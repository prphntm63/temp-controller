$( document ).ready(function() {
  const socket = io()

  socket.on('currentData', (msg) => {
    $('#ferm1 > .temp').text(msg.data.ferm1.temp)
    $('#ferm1 > .set').text(msg.data.ferm1.set)
    if (msg.data.ferm1.heat) {
      $('#ferm1 > .set').css('color', 'red')
    } else if (msg.data.ferm1.cool) {
      $('#ferm1 > .set').css('color', 'blue')
    } else {
      $('#ferm1 > .set').css('color', 'black')
    }

    $('#ferm2 > .temp').text(msg.data.ferm2.temp)
    $('#ferm2 > .set').text(msg.data.ferm2.set)
    if (msg.data.ferm2.heat) {
      $('#ferm2 > .set').css('color', 'red')
    } else if (msg.data.ferm2.cool) {
      $('#ferm2 > .set').css('color', 'blue')
    } else {
      $('#ferm2 > .set').css('color', 'black')
    }
  })
});