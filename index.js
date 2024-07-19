const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const {sequelize, Sequelize, historical_data, config} = require('./models')
const {Op} = require('@sequelize/core')
const fs = require('node:fs/promises');
const {
  gpioInit,
  setChillerStatus,
  setFermenterStatus,
  getWeightData,
  getTempData
} = require('./gpio')

require('dotenv').config()

const HIGH_ALARM = 10
const LOW_ALARM = 10
const NOTIFICATION_TIMEOUT = 60

const app = express();
const server = createServer(app);
const io = new Server(server);
gpioInit()

const port = 3000

let loop
let currentData
let notifications = {}

const sendNotification = (id, content) => {
  if (notifications[id] && notifications[id] < Date.now() + NOTIFICATION_TIMEOUT*60*1000) {
    return
  }
  console.log(`TODO: SEND NOTIFICATION HERE ${content}`)
  notifications[id] = Date.now()
}

const startStreaming = () => {
  loop = setInterval(async () => {
    io.emit('currentData', currentData)
  }, 1000)
}

const stopStreaming = () => {
  clearInterval(loop)
}

app.set('view engine', 'pug')
app.use(express.static('public'))
app.use(express.json())

app.get('/', (req, res) => {
  res.render('home', {
    metadata: "Welcome to Hipster Castle Brewery!"
  })
})

app.get('/setup', (req, res) => {
  res.render('update', {
    metadata: "Update equipment parameters"
  })
})

app.get('/current', (req,res) => {
  res.json(currentData)
})

app.get('/historical', async (req, res) => {
  const deviceId = req.query.deviceId
  const startTime = req.query.start
  const endTime = req.query.end

  if (!deviceId) {
    res.status(422)
  }

  try {
    const data = await historical_data.findAll({
      attributes: [
        'time',
        'status',
        'set_temp',
        'current_temp',
        'gravity'
      ],
      where: {
        device_id: deviceId,
        time: {
          [Op.gt]: startTime ? new Date(Number(startTime)).toISOString(): 0,
          [Op.lt]: endTime ? new Date(Number(endTime)).toISOString() : new Date().toISOString()
        }
      }
    })
    res.json(data)
  } catch (e) {
    console.error(e)
    res.status(500)
  }
})

app.get('/config', async (req, res) => {
  try {
    const dbConfig = await config.findAll()
    const currentConfig = dbConfig.reduce((acc, val) => {
      acc[val.device_id] = val
      return acc
    }, {})

    res.json(currentConfig)
  } catch (e) {
    console.error(e)
    res.status(500)
  }
})

app.post('/config', async (req, res) => {
  const configData = req.body
  const deviceId = configData.device_id
  const writeData = {
    ...configData,
    device_id: undefined
  }

  if (!deviceId) {
    res.status(422).send('Error: Missing device ID')
    return
  }

  try {
    const [rows, updatedConfig] = await config.update(
      writeData,
      {
        where: {
          device_id: deviceId
        },
        returning: true,
        plain: true
      },
    )
    res.json(updatedConfig)
  } catch (e) {
    console.error(e)
    res.status(500).send(e)
  }
})

app.post('/tare', async (req,res) => {
  const deviceId = req.body.device_id
  const TARE_VALUE = 100*Math.random()

  if (!deviceId) {
    res.status(422).send('Error: Missing device ID')
    return
  }

  try {
    const [rows, updatedConfig] = await config.update({
      tare: TARE_VALUE
    }, {
      where: {
        device_id: deviceId
      },
      returning: true,
      plain: true
    })
    res.json(updatedConfig)
  } catch (e) {
    console.error(e)
    res.status(500).send(e)
  }
})

app.post('/full', async (req,res) => {
  const deviceId = req.body.device_id
  const FULL_VALUE = 1000 + 100*Math.random()

  if (!deviceId) {
    res.status(422).send('Error: Missing device ID')
    return
  }

  try {
    const [rows, updatedConfig] = await config.update({
      full: FULL_VALUE
    }, {
      where: {
        device_id: deviceId
      },
      returning: true,
      plain: true
    })
    res.json(updatedConfig)
  } catch (e) {
    console.error(e)
    res.status(500).send(e)
  }
})

app.get('/update', async (req,res) => {
  const currentTime = new Date()
  const addHistoricalPoint = req.query.historical
  const dbConfig = await config.findAll()
  const currentConfig = dbConfig.reduce((acc, val) => {
    acc[val.device_id] = val
    return acc
  }, {})

  const raw_weight = await getWeightData()
  const temps = await getTempData(null, currentData, currentConfig)

  const gravity = {
    ferm1: null,
    ferm2: null
  }

  if (currentConfig.ferm1.tare && currentConfig.ferm1.full && currentConfig.ferm1.og && raw_weight.ferm1) {
    const og1 = currentConfig.ferm1.og
    const platoOg1 = (-1 * 616.868) + (1111.14 * og1) - (630.272 * og1^2) + (135.997 * og1^3)
    const volume1 = (currentConfig.ferm1.full - currentConfig.ferm1.tare) / platoOg1
    const platoFg1 = (raw_weight.ferm1 - currentConfig.ferm1.tare) / volume1
    gravity.ferm1 = 1+ (platoFg1 / (258.6 - ( (platoFg1/258.2) *227.1) ) )
  }

  if (currentConfig.ferm2.tare && currentConfig.ferm2.full && currentConfig.ferm2.og && raw_weight.ferm2) {
    const og1 = currentConfig.ferm2.og
    const platoOg1 = (-1 * 616.868) + (1111.14 * og1) - (630.272 * og1^2) + (135.997 * og1^3)
    const volume1 = (currentConfig.ferm2.full - currentConfig.ferm2.tare) / platoOg1
    const platoFg1 = (raw_weight.ferm2 - currentConfig.ferm2.tare) / volume1
    gravity.ferm2 = 1+ (platoFg1 / (258.6 - ( (platoFg1/258.2) *227.1) ) )
  }

  let chillerStatus = false

  if (currentConfig.ferm1.status !== 'cool' && temps.ferm1 >= (currentConfig.ferm1?.set_temp + (currentConfig.ferm1?.threshold || 2))) {
    // Turn chiller on
    setFermenterStatus('ferm1', 'cool')
    await config.update({status: 'cool'}, {where: {device_id: 'ferm1'}})
    chillerStatus = true
  } else if (currentConfig.ferm1.status !== 'heat' && temps.ferm1 <= (currentConfig.ferm1?.set_temp - (currentConfig.ferm1?.threshold || 2))) {
    // Turn heater on
    setFermenterStatus('ferm1', 'heat')
    await config.update({status: 'heat'}, {where: {device_id: 'ferm1'}})
  } else if (currentConfig.ferm1.status === 'cool' &&  temps.ferm1 <= currentConfig.ferm1?.set_temp) {
    // Turn chiller off
    setFermenterStatus('ferm1', null)
    await config.update({status: null}, {where: {device_id: 'ferm1'}})
    chillerStatus = chillerStatus || false
  } else if (currentConfig.ferm1.status === 'heat' && temps.ferm1 >= currentConfig.ferm1?.set_temp) {
    // Turn heater off
    setFermenterStatus('ferm1', null)
    await config.update({status: null}, {where: {device_id: 'ferm1'}})
  }

  if (currentConfig.ferm2.status !== 'cool' && temps.ferm2 >= (currentConfig.ferm2?.set_temp + (currentConfig.ferm2?.threshold || 2))) {
    // Turn chiller on
    setFermenterStatus('ferm2', 'cool')
    await config.update({status: 'cool'}, {where: {device_id: 'ferm2'}})
    chillerStatus = true
  } else if (currentConfig.ferm2.status !== 'heat' && temps.ferm2 <= (currentConfig.ferm2?.set_temp - (currentConfig.ferm2?.threshold || 2))) {
    // Turn heater on
    setFermenterStatus('ferm2', 'heat')
    await config.update({status: 'heat'}, {where: {device_id: 'ferm2'}})
  } else if (currentConfig.ferm2.status === 'cool' && temps.ferm2 <= currentConfig.ferm2?.set_temp) {
    // Turn chiller off
    setFermenterStatus('ferm2', null)
    await config.update({status: null}, {where: {device_id: 'ferm2'}})
    chillerStatus = chillerStatus || false
  } else if (currentConfig.ferm2.status === 'heat' && temps.ferm2 >= currentConfig.ferm2?.set_temp) {
    // Turn heater off
    setFermenterStatus('ferm2', null)
    await config.update({status: null}, {where: {device_id: 'ferm1'}})
  }

  const dbChillerStatus = chillerStatus ? 'cool' : null
  if (currentConfig.chiller?.status !== dbChillerStatus) {
    // Turn chiller unit on or off
    setChillerStatus(dbChillerStatus === 'cool')
    await config.update({status: dbChillerStatus}, {where: {device_id: 'chiller'}})
  }

  // Alarms
  if (currentConfig.ferm1.set_temp && temps.ferm1 >= currentConfig.ferm1.set_temp + HIGH_ALARM ) {
    // Turn heater off
    setFermenterStatus('ferm1', null)
    await config.update({status: null}, {where: {device_id: 'ferm1'}})
    // Send notification
    sendNotification('FERM_1_HIGH', `Fermenter 1 is set to ${currentConfig.ferm1.set_temp}, but is over temperature at ${temps.ferm1}`)
  }
  if (currentConfig.ferm1.set_temp && temps.ferm1 <= currentConfig.ferm1.set_temp - LOW_ALARM ) {
    // Turn chiller off
    setFermenterStatus('ferm1', null)
    await config.update({status: null}, {where: {device_id: 'ferm1'}})
    // Send notification
    sendNotification('FERM_1_LOW', `Fermenter 1 is set to ${currentConfig.ferm1.set_temp}, but is under temperature at ${temps.ferm1}`)
  }
  if (currentConfig.ferm2.set_temp && temps.ferm2 >= currentConfig.ferm2.set_temp + HIGH_ALARM ) {
    // Turn heater off
    setFermenterStatus('ferm2', null)
    await config.update({status: null}, {where: {device_id: 'ferm2'}})
    // Send notification
    sendNotification('FERM_2_HIGH', `Fermenter 2 is set to ${currentConfig.ferm2.set_temp}, but is over temperature at ${temps.ferm2}`)
  }
  if (currentConfig.ferm2.set_temp && temps.ferm2 <= currentConfig.ferm2.set_temp - LOW_ALARM ) {
    // Turn chiller off
    setFermenterStatus('ferm2', null)
    await config.update({status: null}, {where: {device_id: 'ferm2'}})
    // Send notification
    sendNotification('FERM_2_LOW', `Fermenter 2 is set to ${currentConfig.ferm2.set_temp}, but is over temperature at ${temps.ferm2}`)
  }


  currentData = {
    time: currentTime,
    ferm1: {
      device_id: 'ferm1',
      status: currentConfig.ferm1?.status,
      set_temp: currentConfig.ferm1?.set_temp,
      current_temp: temps.ferm1,
      gravity: gravity.ferm1
    },
    ferm2: {
      device_id: 'ferm2',
      status: currentConfig.ferm2?.status,
      set_temp: currentConfig.ferm2?.set_temp,
      current_temp: temps.ferm2,
      gravity: gravity.ferm2
    },
    chiller: {
      device_id: 'chiller',
      status: currentConfig.chiller?.status,
      set_temp: currentConfig.chiller?.set_temp,
      current_temp: temps.chiller,
    },
    ambient: {
      device_id: 'ambient',
      current_temp: temps.ambient,
    }
  }

  if (addHistoricalPoint) {
    try {
      await historical_data.bulkCreate(Object.values(currentData).map(val => {
        return {
          time: currentTime,
          device_id: val.device_id,
          status: val.status || null,
          set_temp: val.set_temp || null,
          current_temp: val.current_temp || null,
          gravity: val.gravity || null
        }
      }))
    } catch (e) {
      console.error(e)
      return res.status(500)
    }
  }

  return res.status(200)
})

io.on("connection", (socket) => {
  if (io.engine.clientsCount === 1) {
    startStreaming();
  }

  socket.on('disconnect', () => {
    if (io.engine.clientsCount === 0) {
      stopStreaming();
    }
  })
})

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})