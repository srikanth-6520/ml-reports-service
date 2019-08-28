var express = require('express');
var router = express.Router();

var instanceController = require('../controllers/v1/instance_observation');
var entityController = require('../controllers/v1/entity_observations')
var observationController = require('../controllers/v1/observation_controller')

//API router for instanceReport
router.post("/observations/instance",instanceController.instanceReport);

//API router for entityReport
router.post("/observations/entity",entityController.entityReport);

//API router for observationReport
router.post("/observations/report",observationController.observationReport);

module.exports = router;
