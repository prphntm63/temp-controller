const { CronJob } = require('cron');
const fs = require('node:fs/promises');

const loop = async () => {
  const config = JSON.parse(await fs.readFile('config.json'))
  const dateTime = new Date()

  const currentData = {
    timestamp: dateTime.getTime(),
    chillerOn: true,
    chillerTemp: 37,
    roomTemp: 55,
    data: {
      ferm1: {
        id: '1',
        temp: 55 + (2*Math.random()),
        set: 56,
        heat: true,
        cool: false,
        gravity: 1.055
      },
      ferm2: {
        id: '2',
        temp: 50 + (2*Math.random()),
        set: 49,
        heat: false,
        cool: true,
        gravity: 1.055
      },
    }
  }

  fs.writeFile('current.json', JSON.stringify(currentData), err => {
    if (err) {
      console.error(err)
    }
  })


  if (dateTime.getSeconds() % 30 === 0) {
    let historicalData = []

    try {
      historicalData = JSON.parse(await fs.readFile('historical.json'))
    } catch(err) {
      await fs.writeFile('historical.json', '[]')
    }

    if (historicalData.length > 24*60*2) {
      historicalData.shift()
    }

    historicalData.push(currentData)

    fs.writeFile('historical.json', JSON.stringify(historicalData), err => {
      if (err) {
        console.error(err)
      }
    })
  }
}

const job = new CronJob(
	'* * * * * *', // cronTime
	loop, // onTick
	null, // onComplete
	true, // start
	'America/Los_Angeles' // timeZone
);