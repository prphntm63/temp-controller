const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const fs = require('node:fs/promises');

const app = express();
const server = createServer(app);
const io = new Server(server);

const port = 3000

let loop

const startStreaming = () => {
  loop = setInterval(async () => {
    const currentData = JSON.parse(await fs.readFile('current.json'))
    io.emit('currentData', currentData)
  }, 1000)
}

const stopStreaming = () => {
  clearInterval(loop)
}

app.set('view engine', 'pug')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.render('home', {
    metadata: "Welcome to the page!"
  })
})

app.get('/current', (req,res) => {
  res.sendFile(`${__dirname}/current.json`)
})

app.get('/historical', (req, res) => {
  res.sendFile(`${__dirname}/historical.json`)
})

app.get('/config', (req, res) => {
  res.sendFile(`${__dirname}/config.json`)
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