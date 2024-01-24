$( document ).ready(function() {
  const socket = io()

  socket.on('datetime', (msg) => {
    $('#dynamic_content').text(msg)
  })
});