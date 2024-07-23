const rpio = require('rpio')
const ds18x20 = require('ds18x20')
const fs = require('fs/promises')
const { uptime } = require('node:process')
require('dotenv').config()

const COOL1 = 37
const HEAT1 = 35
const COOL2 = 33
const HEAT2 = 31
const CHILLER = 29

const WEIGHT_CLOCK = 38
const WEIGHT_DATA_1 = 40
const WEIGHT_DATA_2 = 42

const TEMP_DATA = 6

const gpioInit = () => {
  let options = {}
  if (process.env.RASPBERRY_PI === 'false') {
    options.mock = 'raspi-3'
  } else {
    w1temp.setGpioData(TEMP_DATA)
  }

  rpio.init(options);
  rpio.open(COOL1, rpio.OUTPUT, rpio.HIGH);
  rpio.open(HEAT1, rpio.OUTPUT, rpio.HIGH);
  rpio.open(COOL2, rpio.OUTPUT, rpio.HIGH);
  rpio.open(HEAT2, rpio.OUTPUT, rpio.HIGH);
  rpio.open(CHILLER, rpio.OUTPUT, rpio.HIGH);
  
}

const setChillerStatus = (isOn) => {
  rpio.write(CHILLER, isOn ? rpio.HIGH : rpio.LOW)
}

const setFermenterStatus = (fermId, mode) => {
  if (mode === 'cool') {
    rpio.write(fermId === 'ferm1' ? COOL1 : COOL2, rpio.HIGH)
    rpio.write(fermId === 'ferm1' ? HEAT1 : HEAT2, rpio.LOW)
  } else if (mode === 'heat') {
    rpio.write(fermId === 'ferm1' ? COOL1 : COOL2, rpio.LOW)
    rpio.write(fermId === 'ferm1' ? HEAT1 : HEAT2, rpio.HIGH)
  } else {
    rpio.write(fermId === 'ferm1' ? COOL1 : COOL2, rpio.LOW)
    rpio.write(fermId === 'ferm1' ? HEAT1 : HEAT2, rpio.LOW)
  }
}

const getWeightData = async () => {
  const spawn = require('child_process').spawn
  const pythonProcess = spawn('python3', ['read_weight.py', '--clock', WEIGHT_CLOCK, '--data1', WEIGHT_DATA_1, '--data2', WEIGHT_DATA_2])

  return new Promise((resolve, reject) => {
    let output = ''
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString()
    })
    pythonProcess.stderr.on('data', (err) => {
      console.error(`stderr: ${err}`)
    })
    pythonProcess.on('close', (code) => {
      resolve(JSON.parse(output))
    })
    pythonProcess.on('error', (err) => {
      reject(err)
    })
  })
}

const getTempData = async (device, currentData, currentConfig) => {
  if (process.env.RASPBERRY_PI === 'false') {
    // Mock in development
    const temps = {
      ferm1:  55 + (2*Math.random()),
      ferm2:  60 + (2*Math.random()),
      chiller:  30 + (2*Math.random()),
      ambient:  72 + (1*Math.random())
    }
  
    if (currentData?.ferm1?.current_temp) {
      if (currentConfig.ferm1.status === 'cool'  ) {
        temps.ferm1 = currentData.ferm1.current_temp - (0.1 * Math.random())
      } else if (currentConfig.ferm1.status === 'heat'  ) {
        temps.ferm1 = currentData.ferm1.current_temp + (0.1 * Math.random())
      } else if (currentData.ferm1.current_temp < temps.ambient ) {
        temps.ferm1 = currentData.ferm1.current_temp + (0.01 * Math.random())
      } else if (currentData.ferm1.current_temp > temps.ambient) {
        temps.ferm1 = currentData.ferm1.current_temp - (0.01 * Math.random())
      }
    }
  
    if (currentData?.ferm2?.current_temp) {
      if (currentConfig.ferm2.status === 'cool'  ) {
        temps.ferm2 = currentData.ferm2.current_temp - (0.1 * Math.random())
      } else if (currentConfig.ferm2.status === 'heat'  ) {
        temps.ferm2 = currentData.ferm2.current_temp + (0.1 * Math.random())
      } else if (currentData.ferm2.current_temp < temps.ambient ) {
        temps.ferm2 = currentData.ferm2.current_temp + (0.01 * Math.random())
      } else if (currentData.ferm2.current_temp > temps.ambient) {
        temps.ferm2 = currentData.ferm2.current_temp - (0.01 * Math.random())
      }
    }

    return temps
  }

  const sensorIdData = await fs.readFile('temp_sensor_ids.json')
    .then(JSON.parse)
    .catch(err => {
      // Assume file not found
      return null
    })

  if (device && sensorIdData[device]) {
    return await new Promise((resolve, reject) => {
      ds18x20.get(sensorIdData[device], (err, temp) => {
        if (err) {
          reject(err)
        }
        resolve(temp)
      })
    })
  } else if (device && sensorIdData[device]) {
    throw new Error('Requested device does not exist in temp_sensor_ids.json')
  }

  const result = {}
  for await (const [device, sensorId] of Object.entries(sensorIdData)) {
    result[device] = await new Promise((resolve, reject) => {
      ds18x20.get(sensorIdData[device], (err, temp) => {
        if (err) {
          reject(err)
        }
        resolve(temp)
      })
    })
  }
  return result
}

module.exports = {
  gpioInit: gpioInit,
  setChillerStatus: setChillerStatus,
  setFermenterStatus: setFermenterStatus,
  getWeightData: getWeightData,
  getTempData: getTempData
}