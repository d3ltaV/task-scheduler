const express = require('express');
const accountController = require('../controllers/accountController');
const router = express.Router();
router.get('/register', accountController.showRegisterForm);
router.post('/register', accountController.register);
router.get('/login', accountController.showLoginForm);
router.post('/login', accountController.login);
router.post('/logout', accountController.logout);

module.exports = router;