const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

const port = 3000

app.set('view engine', 'pug')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.render('home', {
    metadata: "Welcome to the page!"
  })
})

setInterval(() => {
  const currentDate = new Date().toISOString()
  io.emit('datetime', currentDate)
}, 1000)

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})