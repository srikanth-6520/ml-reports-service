var express = require('express');
var router = express.Router();

var myController = require('../controllers/users');

//sl_assessment query
router.post("/slassessment",myController.slAssessment);
router.post("/instanceReport",myController.instanceReport);

module.exports = router;
