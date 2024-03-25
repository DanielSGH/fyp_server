const { ObjectId } = require('mongodb');
const { dbModel } = require('../models/dbModel');
const socketio = require('socket.io');

let userIDs = [];

let io;
module.exports.socketConnection = server => {
  io = socketio(server).of('/messageprotocol');

  io.on('connection', (socket) => {
    socket.on('message', ({room, msg}) => {
      console.log(`Message from ${room}: ${msg}`);
      socket.to(room).emit('message', { room, msg });
      // const user = userIDs.find(user => user.socketID === socket.id);

      // dbModel.updateOne('messages', { _id: new ObjectId(String(room)) }, { $push: { messages: { from: user.userID, message: msg } } });
    });
    socket.on('join', ({ userID, room }) => {
      console.log(`${userID} joined room: ${room}`);
      setOnline(socket, userID);
      socket.join(room);
    })
    socket.on('disconnect', () => {
      const user = userIDs.find(user => user.socketID === socket.id);
      if (!user) {
        return;
      }

      dbModel.updateOne('users', { _id: new ObjectId(String(user.userID)) }, { $set: { "onlineStatus": "offline", "lastSeenTime": new Date().toISOString() } });
      userIDs.splice(userIDs.indexOf(user), 1);
      console.log(user.userID + ' disconnected');
    });
  });
}

const setOnline = (socket, userID) => {
  if (userIDs.find(user => user.userID === userID)) {
    return;
  }

  console.log('Setting online: ' + userID);

  try {
    dbModel.updateOne('users', { _id: new ObjectId(String(userID)) }, { $set: { onlineStatus: "online" } });
  } catch (e) {
    console.log(e);
  }
  userIDs.push({ userID, socketID: socket.id });
}