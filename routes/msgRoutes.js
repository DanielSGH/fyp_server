const { Router } = require('express');
const msgController = require('../controllers/msgController');
const { authoriseToken } = require('../middleware/authoriseToken');

const router = Router();
router.use(authoriseToken);

router.post('/message/send', msgController.send);

module.exports = router;