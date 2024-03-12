const { Router } = require('express');
const authController = require('../controllers/authController');

const router = Router();

router.post('/auth/signup', authController.signup);
router.post('/auth/signin', authController.signin);
router.post('/auth/refresh', authController.refresh);
router.delete('/auth/signout', authController.signout);

module.exports = router;