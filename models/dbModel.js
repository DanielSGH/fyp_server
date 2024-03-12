const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const [,, ...ARGS] = process.argv;
const MONGODB_USERS_URI = process.env[ARGS[0]];

const mongoClient = new MongoClient(
  MONGODB_USERS_URI, {
		serverApi: {
			version: ServerApiVersion.v1,
			strict: true,
			deprecationErrors: true,
		}
	}
)

class mongodbModel {
	constructor() {
		this.client = mongoClient;
		this.connected = (async () => await this.connect())();
		this.mainDB = null;
		this.userCollection = null;
	}

	async connect() {
		try {
			const client = await mongoClient.connect();
			const db = this.mainDB = mongoClient.db('main');
			this.userCollection = db.collection('users');
			
			if (!client?.topology?.isConnected()) {
				return false;
			}
			
			console.log("successfully established connection to MongoDB");
	
			return true;
		} catch (e) {
			console.dir(e);
		} finally {
			await mongoClient.close();
		}
	}

	async findOne(collection, obj) {
		const client = await mongoClient.connect();
		const col = client.db('main').collection(collection);
		let response = await col.find(obj)?.toArray();

		return response.at(0);
	}

	async find(collection, obj, options = {}) {
		const col = await this._getCollection(collection);
		let response = await col.find(obj, options)?.toArray();

		return response;
	}

	async insertOne(collection, obj) {
		const col = await this._getCollection(collection);
		const res = await col.insertOne(obj);
		
		return res?.insertedCount;
	}

	async updateOne(collection, query, update) {
		const col = await this._getCollection(collection)
		const res = await col.updateOne(query, update);
		
		return res?.modifiedCount;
	}

	async updateRefreshToken(expiredTok, newTok) {
		const col = await this._getCollection('users');
		const res = await col.updateOne({ "refreshToken": expiredTok }, { $set: { "refreshToken": newTok } });
		
		return res?.modifiedCount;
	}

	async _getCollection(collection) {
		const client = await mongoClient.connect();
		return client.db('main').collection(collection);
	}
}

module.exports.mongoClient = mongoClient;
module.exports.dbModel = new mongodbModel();
