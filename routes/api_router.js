var express = require('express');
var router = express.Router();

var instanceController = require('../controllers/v1/instance_observation');
var entityController = require('../controllers/v1/entity_observations')
var observationController = require('../controllers/v1/observation_controller')

<<<<<<< HEAD
//sl_assessment query
router.post("/slassessment",myController.slAssessment);
router.post("/observations/instance",myController.instanceReport);
router.get('/observations/instanceLevelPdfReports',myController.instancePdfReport)
=======
//API router for observations instanceReport
router.post("/observations/instance",instanceController.instanceReport);

//API router for observations entityReport
router.post("/observations/entity",entityController.entityReport);

//API router for observationReport
router.post("/observations/report",observationController.observationReport);

//API router for HM view 
router.post("/assessments/school",observationController.observationReport);
>>>>>>> bfcee26ada06260075b2e225ae52557c76199950

module.exports = router;
