require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { dbModel } = require('../models/dbModel');
const { isEmail } = require('validator');
const { ACCESS_SECRET, REFRESH_SECRET } = process.env;

module.exports.signup = async (req, res) => {
	try {
		if (!await dbModel.connected) {
			return res.status(500).send({error: "failed to establish connection to database"});
		}
    
		const { username, password, email, selectedLanguage } = req.body;
		if (!(await validateCredentials({ username, password, email }, res))) return;
		
		const _id = new ObjectId();
		const credentials = { _id, username, email };
		const accessToken = generateAccessToken(credentials);
		const refreshToken = generateRefreshToken(credentials);

		const flashcardsId = new ObjectId();

		const user = {
			_id,
			username,
			email,
			password: await bcrypt.hash(password, await bcrypt.genSalt()),
			flashcards: [
				flashcardsId
			],
			messages: [],
			refreshToken,
			selectedLanguages: [
				selectedLanguage
			],
		}

		dbModel.userCollection.insertOne(user);
		
		const cards = await dbModel.find(`fc_${selectedLanguage}`, {});
		cards.forEach(card => card._id = new ObjectId());
		dbModel.insertOne('flashcards', {
			_id: flashcardsId,
			[selectedLanguage]: cards
		});

		res.json({ accessToken, refreshToken });
	} catch (e) {
		res.status(500).send({error: e.message});
	}
}

module.exports.signin = async (req, res) => {
	if (!dbModel.connected) {
		res.status(500).send({error: "failed to establish connection to database"});
		return;
	}

	try {
		const { username, password } = req.body;
		
		const user = await dbModel.findOne('users', { username });
		
		if (!user) {
			return res.status(404).send({error: 'User not found'});
		}
		
		if (!(await bcrypt.compare(password, user.password))) {
			return res.status(401).send({error: 'Invalid password'});
		}
		
		const credentials = { _id: user._id, username, email: user.email };
		const accessToken = generateAccessToken(credentials);
		const refreshToken = generateRefreshToken(credentials);

		if (!await dbModel.updateRefreshToken(user.refreshToken, refreshToken)) {
			return res.status(500).send({ error: 'Failed to update refresh token' });
		}
	
		res.json({ accessToken, refreshToken });
	} catch (e) {
		res.status(500).send(e.message);
	}
}

module.exports.refresh = async (req, res) => {
	if (!dbModel.connected) {
		res.sendStatus(500);
		return;
	}

	try {
		const { token } = req.body;
		if (!token) return res.sendStatus(400);
		
		const user = await dbModel.findOne('users', { refreshToken: token });
		if (!user) return res.status(401).send({error: 'Please log in again'});

		const { _id, username, email } = jwt.decode(token);

		const accessToken = generateAccessToken({ _id, username, email });

		res.json({ accessToken });
	} catch (e) {
		res.status(500).send(e.message);
	}
}

module.exports.signout = async (req, res) => {
	if (!dbModel.connected) {
		res.sendStatus(500);
		return;
	}

	try {
		const token = req.headers['authorization']?.split(' ')[1];
		if (!token) return res.sendStatus(401);
		
		const user = await dbModel.findOne('users', { refreshToken: token });
		if (!user) return res.status(403).send({error: 'Please log in again'});

		if (!(await dbModel.updateRefreshToken(user.refreshToken, ''))) {
			return res.status(500).send({error: 'Failed to delete refresh token'});
		}

		res.sendStatus(204);
	} catch (e) {
		res.status(500).send({error: e.message});
	}
}

const generateAccessToken = (user) => {
	return jwt.sign(user, ACCESS_SECRET, { expiresIn: '1d' });
}

const generateRefreshToken = (user) => {
	return jwt.sign(user, REFRESH_SECRET);
}

const validateCredentials = async ({ username, password, email }, res) => {
	if (dbModel.mainDB?.s?.namespace?.db !== 'main') {
		res.status(500).send(
      {error: "failed to obtain namespace of db 'main' from dbModel.mainDB"}
    );
		return false;
	}

	if (await dbModel.findOne('users', { username })) {
		res.status(409).send({error: 'Username already exists'});
		return false;
	}

	if (!isEmail(email)) {
		res.status(406).send({error: 'Invalid email'});
		return false;
	}

	if (await dbModel.findOne('users', { email })) {
		res.status(409).send({error: 'Email already in use'});
		return false;
	}
	
	if (username?.replaceAll(' ', '')?.length < 1) {
		res.status(406).send({error: 'Username must be at least 1 character long'});
		return false;
	}

	if (password?.length < 8) {
		res.status(406).send({error: 'Password must be at least 8 characters long'});
		return false;
	}

	return true;
}