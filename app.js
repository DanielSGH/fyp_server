const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const msgRoutes = require('./routes/msgRoutes');
const userRoutes = require('./routes/userRoutes');
const { socketConnection } = require('./controllers/socketIOController');
const http = require('http');
const server = http.createServer(app);

const { dbModel } = require('./models/dbModel');
require('dotenv').config();

app.use(express.json());
app.use(authRoutes);
app.use(msgRoutes);
app.use(userRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
	if (!await dbModel.connected) {
		console.log('Failed to establish connection to MongoDB');
	}
});

socketConnection(server);
