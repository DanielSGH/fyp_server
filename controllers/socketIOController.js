const socketio = require('socket.io');

let io;
module.exports.socketConnection = server => {
  io = socketio(server).of('/messageprotocol');

  io.on('connection', (socket) => {
    socket.on('message', ({room, msg}) => {
      console.log(`Message from ${room}: ${msg}`);
      socket.to(room).emit('message', { room, msg });
    });
    socket.on('join', room => {
      console.log(`User joined room: ${room}`)
      socket.join(room);
    })
  });
}