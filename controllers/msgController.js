const { dbModel } = require('../models/dbModel');
const { ObjectId } = require('mongodb');

module.exports.send = async (req, res) => {
  const requestSender = new ObjectId(String(req.user._id));
  const to = new ObjectId(String(req.body.to));

  const found = await dbModel.findOne('users', { _id: to });
  if (!found) {
    return res.status(404).send({ error: 'User not found' });
  }

  const requestParticipants = await findUsers([requestSender, to]);
  const roomID = new ObjectId();

  const sender = await dbModel.findOne('users', { _id: requestSender });
  const rooms = await dbModel.find('messages', { _id: { $in: sender.messages } });

  let roomExists = false;
  let existingRoomId;

  rooms.forEach(msg => {
    const roomIDs = msg.participants.map(id => id.toString());
    const requestParticipantsString = requestParticipants.map(p => p._id.toString());
    const participantsMatch = roomIDs.every(id => requestParticipantsString.includes(id));

    if (participantsMatch) {
      roomExists = true;
      existingRoomId = msg._id;
      return;
    }
  });

  if (roomExists) {
    if (req.body?.message)
      await dbModel.updateOne('messages', { _id: existingRoomId }, { $push: { messages: req.body.message } });
  
    return res.status(200).send({ roomID: existingRoomId });
  }

  const newMsg = {
    _id: roomID,
    participants: requestParticipants,
    ...(!!req.body?.message) && { messages: [req.body.message] }
  };

  await dbModel.insertOne('messages', newMsg);
  await dbModel.updateOne('users', { _id: requestSender }, { $push: { messages: roomID } });
  
  if (req.body?.message) {
    await dbModel.updateOne('users', { _id: to }, { $push: { messages: roomID } });
  }

  res.status(200).send({ roomID });
};

const findUsers = async users => {
  const usersArray = await dbModel.find('users', { _id: { $in: users } });
  return usersArray.map(({ _id, username }) => ({ _id, username }));
}