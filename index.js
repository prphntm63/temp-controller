const express = require('express')
const app = express()
const port = 80

app.set('view engine', 'pug')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.render('home', {
    metadata: "Welcome to the page!"
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})