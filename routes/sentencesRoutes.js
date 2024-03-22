const { Router } = require('express');
const sentencesController = require('../controllers/sentencesController');
const { authoriseToken } = require('../middleware/authoriseToken');

const router = Router();
router.use(authoriseToken);

router.get('/sentences', sentencesController.sentences);

module.exports = router;