var express = require('express');
var router = express.Router();
var authService = require('../services/autentication_service')

var instanceController = require('../controllers/v1/instance_observation');
var entityController = require('../controllers/v1/entity_observations')
var observationController = require('../controllers/v1/observation_controller')
var entityAssessController = require('../controllers/v1/entity_assessments')
var listAssessmentPrograms = require('../controllers/v1/list_assessment_programs')
var course_enrollment = require('../controllers/v1/course_enrollment')
var content_view = require('../controllers/v1/content_view')

//========= API calls for samiksha observation and assessment reports=============

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

router.get("/observations/instanceLevelPdfReports",authenticate,observationController.pdfReports);
router.get("/observations/pdfReports",authenticate,observationController.pdfReports);
// router.get('/observations/instanceLevelPdfReports',authenticate,instanceController.instancePdfReport);

//API for observations PDF
router.get("/observations/pdfReportsUrl",observationController.pdftempUrl);

//API for Assessment PDF
router.post("/assessment/pdfReports",authenticate,entityAssessController.assessmentPdfReport);


//========= API calls for container app=============

//API for course enrollment
router.post("/shikshalokam/courseEnrollment",authenticate,course_enrollment.courseEnrollment);

//API for content view
router.get("/shikshalokam/contentView",authenticate,content_view.contentView);

//API for content view by user
router.post("/shikshalokam/contentDownloadedByUser",authenticate,content_view.contentViewedByUser);

//API for content view by user
router.get("/shikshalokam/usageByContent",authenticate,content_view.usageByContent);


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