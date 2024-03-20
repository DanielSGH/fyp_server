const { Router } = require('express');
const userController = require('../controllers/userController');
const { authoriseToken } = require('../middleware/authoriseToken');

const router = Router();
router.use(authoriseToken);

router.get('/user/info', userController.info);
router.get('/user/flashcards', userController.flashcards);
router.post('/user/updateFlashcard', userController.updateFlashcard);

module.exports = router;