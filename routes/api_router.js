var express = require('express');
var router = express.Router();

var instanceController = require('../controllers/v1/instance_observation');
var entityController = require('../controllers/v1/entity_observations')
var observationController = require('../controllers/v1/observation_controller')
var entityAssessController = require('../controllers/v1/entity_assessments')

//sl_assessment query
// router.post("/slassessment",instanceController.slAssessment);
// router.post("/observations/instance",instanceController.instanceReport);
router.get('/observations/instanceLevelPdfReports',instanceController.instancePdfReport)

//API router for observations instanceReport
router.post("/observations/instance",instanceController.instanceReport);

//API router for observations entityReport
router.post("/observations/entity",entityController.entityReport);

//API router for observationReport
router.post("/observations/report",observationController.observationReport);

//API router for HM view 
router.post("/assessments/entity",entityAssessController.entityAssessment);


module.exports = router;
