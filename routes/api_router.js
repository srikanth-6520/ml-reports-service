var express = require('express');
var router = express.Router();

var myController = require('../controllers/v1/instance_observation');

//sl_assessment query
router.post("/slassessment",myController.slAssessment);
router.post("/observations/instance",myController.instanceReport);
router.get('/observations/instanceLevelPdfReports',myController.instancePdfReport)

module.exports = router;
