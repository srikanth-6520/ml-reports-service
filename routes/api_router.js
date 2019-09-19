var express = require('express');
var router = express.Router();
var authService = require('../services/autentication_service')

var instanceController = require('../controllers/v1/instance_observation');
var entityController = require('../controllers/v1/entity_observations')
var observationController = require('../controllers/v1/observation_controller')
var entityAssessController = require('../controllers/v1/entity_assessments')
var listAssessmentPrograms = require('../controllers/v1/list_assessment_programs')

//sl_assessment query
// router.post("/slassessment",instanceController.slAssessment);
// router.post("/observations/instance",instanceController.instanceReport);

// router.get('/observations/instanceLevelPdfReports',instanceController.instancePdfReport)
router.get('/observations/instanceLevelPdfReports',authenticate,instanceController.instancePdfReport)

//API router for observations instanceReport
router.post("/observations/instance",authenticate,instanceController.instanceReport);

//API router for observations entityReport
router.post("/observations/entity",authenticate,entityController.entityReport);
router.post("/observations/byEntity",authenticate,entityController.observationsByEntity);

//API router for observationReport
router.post("/observations/report",authenticate,observationController.observationReport);

//API router for HM view
//router.post("/assessments/school",observationController.observationReport);

//API router for list programs
router.post("/assessments/listPrograms",authenticate,listAssessmentPrograms.listPrograms);

//API router for HM view 
router.post("/assessments/entity",authenticate,entityAssessController.entityAssessment);


function authenticate(req,res,next){

    authService.validateToken(req,res)
    .then(function (result) {
        // res.send(result);

        // console.log("result",result);

        if(result.status=="success"){

            req.body.userId = result.userId;
            next();
        } else {
            res.send({ status:"failed",message:result.message })
        }


    });

}


module.exports = router;