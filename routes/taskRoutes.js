const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasksController');
// const isAuthenticated = require('../auth');
router.get('/homepage', tasksController.showTasks);
router.post('/add', tasksController.addTask);
router.post('/delete', tasksController.deleteTask);
router.post('/modify', tasksController.modifyTask);
router.post('/reinitialize', tasksController.reinitialize);
module.exports = router;
