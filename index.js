const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const {sequelize, Sequelize, historical_data, config} = require('./models')
const {Op} = require('@sequelize/core')
const fs = require('node:fs/promises');

require('dotenv').config()

const app = express();
const server = createServer(app);
const io = new Server(server);

const port = 3000

let loop
let currentData

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
    metadata: "Welcome to the page!"
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
    const data = await config.findAll()
    res.json(data)
  } catch (e) {
    console.error(e)
    res.status(500)
  }
})

app.post('/config', async (req, res) => {
  const configData = req.body
  const deviceId = configData.device_id

  if (!deviceId) {
    res.status(422)
  }

  try {
    await config.update(configData, {
      where: {
        device_id: deviceId
      }
    })
  } catch (e) {
    console.error(e)
    res.status(500)
  }
})

app.get('/update', async (req,res) => {
  console.log('updated')
  const currentTime = new Date()
  const addHistoricalPoint = req.query.historical

  const temps = {
    ferm1:  55 + (2*Math.random()),
    ferm2:  60 + (2*Math.random()),
    chiller:  35 + (2*Math.random()),
    ambient:  65 + (2*Math.random())
  }

  const gravity = {
    ferm1: 1.065,
    ferm2: 1.055
  }

  currentData = {
    time: currentTime,
    ferm1: {
      device_id: 'ferm1',
      status: 'heat',
      set_temp: 60,
      current_temp: temps.ferm1,
      gravity: gravity.ferm1
    },
    ferm2: {
      device_id: 'ferm2',
      status: 'cool',
      set_temp: 60,
      current_temp: temps.ferm2,
      gravity: gravity.ferm2
    },
    chiller: {
      device_id: 'chiller',
      status: 'cool',
      set_temp: 32,
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
      // await historical_data.bulkCreate([
      //   {
      //     time: currentTime,
      //     device_id: 'ferm1',
      //     status: 'heat',
      //     set_temp: 60,
      //     current_temp: temps.ferm1,
      //     gravity: gravity.ferm1
      //   },
      //   {
      //     time: currentTime,
      //     device_id: 'ferm2',
      //     status: 'cool',
      //     set_temp: 60,
      //     current_temp: temps.ferm2,
      //     gravity: gravity.ferm2
      //   },
      //   {
      //     time: currentTime,
      //     device_id: 'chiller',
      //     status: 'cool',
      //     set_temp: 32,
      //     current_temp: temps.chiller,
      //     gravity: null
      //   },
      //   {
      //     time: currentTime,
      //     device_id: 'ambient',
      //     status: null,
      //     set_temp: null,
      //     current_temp: temps.ambient,
      //     gravity: null
      //   }
      // ])
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