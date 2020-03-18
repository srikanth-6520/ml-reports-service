// var express = require('express');
// var router = express.Router();
// var authService = require('../services/authentication_service');
const config = require('../config/config')
// var instanceController = require('../controllers/v1/instance_observation');
// var entityController = require('../controllers/v1/entity_observations');
// var entitySolutionCOntroller = require('../controllers/v2/entity_observations');
// var observationController = require('../controllers/v1/observation_controller');
// var entityAssessController = require('../controllers/v1/entity_assessments');
// var listAssessmentPrograms = require('../controllers/v1/list_assessment_programs');
// var course_enrollment = require('../controllers/v1/course_enrollment');
// var content_view = require('../controllers/v1/content_view');
// var pdfController = require('../controllers/v1/observation_pdf_controller');
// var pdfV2Controller = require('../controllers/v2/observation_pdf_controller');
// var listObservationNames = require('../controllers/v1/list_observation_names');
// var observationSubmissions = require('../controllers/v1/observation_submissions');
// var listObservationSolutions = require('../controllers/v1/list_observation_solutions');
// var entityV2Controller = require('../controllers/v2/entity_observations');
// var listObservationSolutionsV2 = require('../controllers/v2/list_observation_solutions');


// //========= API calls for samiksha observation and assessment reports=============

// //API router for observations instanceReport
// router.post("/v1/observations/instance",authenticate,instanceController.instanceReport);

// //API router for observations entityReport
// router.post("/v1/observations/entity",authenticate,entityController.entityReport);

// router.post("/v1/observations/byEntity",authenticate,entityController.observationsByEntity);

// //API router for observationReport
// router.post("/v1/observations/report",authenticate,observationController.observationReport);

// //API router for listing all the observation Names
// router.post("/v1/observations/listObservationNames",authenticate,listObservationNames.listObservationNames)

// //API router for listing all the solution Names
// router.post("/v1/observations/listObservationSolutions",authenticate,listObservationSolutions.listObservationSolutions)

// //API router for getting observation submission count
// router.post("/v1/observations/submissionsCount",authenticate,observationSubmissions.observationSubmissionsCount)

// //API router for observation report (cluster/block/district)
// router.post("/v1/observations/entityObservationReport",authenticate,entityController.entityObservationReport)

// //API router for solution report (cluster/block/district)
// router.post("/v1/observations/entitySolutionReport",authenticate,entitySolutionCOntroller.entitySolutionReport)

// //API router for instance observation score report
// router.post("/v1/observations/instanceObservationScoreReport",authenticate,instanceController.instanceObservationScoreReport)

// //API router for entity observation score report
// router.post("/v1/observations/entityScoreReport",authenticate,entityController.entityObservationScoreReport)

// //API router for v2 entity observation score report
// router.post("/v2/observations/entityScoreReport",authenticate,entityV2Controller.entityObservationScoreReport)

// //API router observation score report
// router.post("/v1/observations/scoreReport",authenticate,observationController.scoreReport)

// //API router entity solution score report
// router.post("/v1/observations/entitySolutionScoreReport",authenticate,entityController.entitySolutionScoreReport)

// //API router for list programs (Assessment)
// router.post("/v1/assessments/listPrograms",authenticate,listAssessmentPrograms.listPrograms);

// //API router for Assessment Report 
// router.post("/v1/assessments/entity",authenticate,entityAssessController.entityAssessment);

// //API router for listing mysolutions
// router.post("/v2/observations/listObservationSolutions",listObservationSolutionsV2.listObservationSolutions)


// //========= API calls for observation PDF reports=============

// //API for observation PDF generation
// router.get("/v1/observations/pdfReports",authenticate,pdfController.observationPdfReports);

// //API for observations PDF ( For internal use)
// router.get("/v1/observations/pdfReportsUrl",pdfController.pdftempUrl);

// //API router for observation score PDF report
// router.post("/v1/observations/observationScorePdfReport",authenticate,pdfController.observationScorePdfReport)

// //API router for observation score PDF report
// router.post("/v2/observations/observationScorePdfReport",authenticate,pdfV2Controller.observationScorePdfReport)


// //========= API calls for assessment pdf reports=============

// //API for Assessment PDF
// router.post("/v1/assessment/pdfReports",authenticate,entityAssessController.assessmentPdfReport);


// //========= API calls for unnati app=============

// //API for Unnati app PDF generation 
// router.post("/v1/unnati/pdfReport",authenticate,pdfController.unnatiPdfGeneration)

// //API for Unnati app monthly report PDF generation 
// router.post("/v1/unnati/monthlyReport",authenticate,pdfController.unnatiMonthlyReport)

// //API for Unnati view full  report PDF generation 
// router.post("/v1/unnati/viewProjectReport",authenticate,pdfController.unnatiViewFullReport)


// //========= API calls for container app=============

// //API for course enrollment
// router.post("/v1/shikshalokam/courseEnrollment",authenticate,course_enrollment.courseEnrollment);

// //API for content view
// router.get("/v1/shikshalokam/contentView",authenticate,content_view.contentView);

// //API for content view by user
// router.post("/v1/shikshalokam/contentDownloadedByUser",authenticate,content_view.contentDownloadedByUser);

// //API for content view by user
// router.get("/v1/shikshalokam/usageByContent",authenticate,content_view.usageByContent);


// function authenticate(req,res,next){

//     authService.validateToken(req,res)
//     .then(function (result) {

//         if(result.status=="success"){

//             req.body.userId = result.userId;
//             next();
//         } else {
//             res.send({ status:"failed",message:result.message })
//         }


//     });

// }


// module.exports = router;


