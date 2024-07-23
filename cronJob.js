const { CronJob } = require('cron');
const fs = require('node:fs/promises');
const http = require('http')
require('dotenv').config()

const port = process.env.PORT || 3000

const loop = async () => {
  http.get(`http://localhost:${port}/update`)
}

const historicalLoop = async () => {
  http.get(`http://localhost:${port}/update?historical=true`)
}

const currentJob = new CronJob(
	'1-29,31-59 * * * * *', // cronTime
	loop, // onTick
	null, // onComplete
	true, // start
	'America/Los_Angeles' // timeZone
);

const historicalJob = new CronJob(
	'0,30 * * * * *', // cronTime
	historicalLoop, // onTick
	null, // onComplete
	true, // start
	'America/Los_Angeles' // timeZone
);