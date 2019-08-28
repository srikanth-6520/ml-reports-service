var express = require('express');
var router = express.Router();

var instanceController = require('../controllers/v1/instance_observation');
var entityontroller = require('../controllers/v1/entity_observations')

//API router for instanceReport
router.post("/observations/instance",instanceController.instanceReport);

//API router for entityReport
router.post("/observations/entity",entityontroller.entityReport);

module.exports = router;
