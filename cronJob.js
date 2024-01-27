const { CronJob } = require('cron');
const fs = require('node:fs/promises');
const http = require('http')

const loop = async () => {
  http.get('http://localhost:3000/update')
}

const historicalLoop = async () => {
  http.get('http://localhost:3000/update?historical=true')
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