const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports.authoriseToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)
    
    jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
      if (err) return res.status(401).send({ error: 'Invalid token' });
      req.user = user
    
      next();
    })
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
}