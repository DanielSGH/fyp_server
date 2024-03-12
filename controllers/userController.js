const { dbModel } = require('../models/dbModel');
const { ObjectId } = require('mongodb');

module.exports.info = async (req, res) => {
  try {
    const user = await dbModel.findOne('users', { _id: new ObjectId(String(req.user._id)) });
    
    delete user.password;
    delete user.refreshToken;
    delete user.email;
    delete user._id;
    
    user.messages = user.messages.map(id => new ObjectId(String(id)));
    user.messages = await dbModel.find('messages', { _id: { $in: user.messages } });
    user.messages.forEach(({messages}) => {
      messages.splice(0, messages.length - 50);
    });
    
    
    user.contacts = user.messages.flatMap(({participants}) => 
      participants.filter(participant => participant._id.toString() !== req.user._id)
    );

    const currentDate = new Date();
    user.flashcards = user.flashcards.filter(card => Date.parse(card.due) < currentDate);

    res.status(200).send(user);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
}