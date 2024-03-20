const { dbModel } = require('../models/dbModel');
const { ObjectId } = require('mongodb');

module.exports.info = async (req, res) => {
  try {
    const user = await dbModel.findOne('users', { _id: new ObjectId(String(req.user._id)) });
    
    delete user.password;
    delete user.refreshToken;
    delete user.email;
    
    user.messages = user.messages.map(id => new ObjectId(String(id)));
    user.messages = await dbModel.find('messages', { _id: { $in: user.messages } });
    user.messages.forEach(({messages}) => {
      messages?.splice(0, messages.length - 50);
    });

        
    let contacts = user.messages.flatMap(({participants}) => 
      participants.filter(participant => participant._id.toString() !== req.user._id)
    );

    user.contacts = await getContacts({ _id: { $in: contacts.map(contact => new ObjectId(String(contact._id))) } });
    user.newPartners = (await getContacts({ selectedLanguages: { $in: user.selectedLanguages } }))
    .filter(partner => !user.contacts.some(contact => contact._id.toString() === partner._id.toString()));

    let flashcards = await dbModel.findOne('flashcards', { _id: { $in: user.flashcards.map(card => new ObjectId(String(card)))}});
    if (!!flashcards) {
      [, ...flashcards] = Object.values(flashcards);
      flashcards = flashcards.flat();

      const currentDate = new Date();
      flashcards = flashcards.filter(card => card.due ? card.due <= currentDate : true);
      flashcards = flashcards.sort((a, b) => a.due - b.due);
      user.flashcards = flashcards.slice(0, 100);
    }
    
    res.status(200).send(user);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
}

const getContacts = async (query) => {
  return await dbModel._getCollection('users')
  .then(col => col.find(query)
  .project({
    username: 1,
    selectedLanguages: 1,
    _id: 1,
    onlineStatus: 1,
  }).toArray());
}

module.exports.flashcards = async (req, res) => {
  try {
    const user = await dbModel.findOne('users', { _id: new ObjectId(String(req.user._id)) });
    let flashcards = await dbModel.findOne('flashcards', { _id: { $in: user.flashcards.map(card => new ObjectId(String(card)))}});
    [, ...flashcards] = Object.values(flashcards);
    flashcards = flashcards.flat().slice(0,100);
    res.status(200).send(flashcards);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
}

module.exports.updateFlashcard = async (req, res) => {
  const { oldCard, newCard, selectedLanguage} = req.body;

  try {
    const user = await dbModel.findOne('users', { _id: new ObjectId(String(req.user._id)) });
    let flashcards = await dbModel.findOne('flashcards', { _id: { $in: user.flashcards.map(card => new ObjectId(String(card)))}});
    [, ...flashcards] = Object.values(flashcards);
    flashcards = flashcards.flat();

    const index = flashcards.findIndex(card => card._id.toString() === oldCard);
    flashcards[index] = newCard;

    await dbModel.updateOne('flashcards', { _id: new ObjectId(String(user.flashcards[0])) }, { $set: { [selectedLanguage]: flashcards } });
    res.status(200).send({ message: 'Flashcard updated' });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};