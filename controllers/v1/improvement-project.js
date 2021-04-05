const pdfHandler = require('../../helper/common_handler');
const pdfHandlerV2 = require('../../helper/common_handler_v2');

/**
   * @api {post} /dhiti/api/v1/improvement-project/viewProjectReport 
   * View project report
   * @apiVersion 1.0.0
   * @apiGroup Improvement-project
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
   "schoolName": "",
   "reportType": "",
   "projectDetails": []
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "status": "",
       "message": "",
       "pdfUrl": ""
*     }
   * @apiUse errorBody
   */

   
//Controller function for unnati view full report pdf generation
exports.viewProjectReport = async function(req,res){

    let response = await pdfHandlerV2.unnatiViewFullReportPdfGeneration(req.body, storeReportsToS3 = false);
  
    response.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + response.pdfUrl
    res.send(response);
}

/**
   * @api {post} /dhiti/api/v1/improvement-project/entityReport 
   * entity report
   * @apiVersion 1.0.0
   * @apiGroup Improvement-project
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
   * {
         "entityName" : "",
         "programName" : "",
         "sharedBy" : "",
         "reportType" : "",
         "categories": {
            "total": 7,
            "null": 2,
            "Teachers": 2,
            "Students": 2,
            "Infrastructure": 2,
            "ui": 1,
             "Community": 1,
             "Othersr": 1
         },
         "tasks": {
            "total": 2,
            "completed": 0,
            "inProgress": 0,
            "notStarted": 1,
            "overdue": 0,
            "not started": 1
         },
         "projects": {
            "total": 3,
            "completed": 0,
            "inProgress": 0,
            "notStarted": 3,
            "overdue": 0
         }
      }
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *  {
        "status": "success",
        "message": "report generated",
        "pdfUrl": "http://localhost:4201/dhiti/api/v1/observations/pdfReportsUrl?id=dG1wLzczMmM5MzhkLTRiOWUtNGRhMS1iMGUxLWQ4NjRjNjUwNDliMC0tMzcxNw=="
      }
   * @apiUse errorBody
   */

exports.entityReport = async function(req,res){

   let response = await pdfHandlerV2.unnatiEntityReportPdfGeneration(req.body, storeReportsToS3 = false);
 
   response.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + response.pdfUrl
   res.send(response);
}


/**
   * @api {post} /dhiti/api/v1/improvement-project/projectAndTaskReport?projectPdf=true
   * Project and task pdf report
   * @apiVersion 1.0.0
   * @apiGroup Improvement-project
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
   "title": "Project with learning resources",
   "duration": "1 month",
   "goal": "Please enter the goal for your Prerak Head Teacher of the Month project",
   "startDate": "",
   "endDate": "",
   "tasks": [	{
			"_id" : "4d074de7-7059-4d99-9da9-452b0d32e081",
			"createdBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
			"updatedBy" : "140558b9-7df4-4993-be3c-31eb8b9ca368",
			"isDeleted" : false,
			"isDeletable" : true,
			"taskSequence" : [ ],
			"children" : [ ],
			"visibleIf" : [ ],
			"hasSubTasks" : false,
			"deleted" : false,
			"type" : "content",
			"name" : "ELECTRICITY",
			"externalId" : "IMP-3399c-TASK1-1612451495703",
			"description" : "",
			"updatedAt" : ISODate("2021-04-01T19:17:03.970+05:30"),
			"createdAt" : ISODate("2021-02-04T20:38:48.626+05:30"),
			"status" : "notStarted"
		}]
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "status": "success",
       "message": "Report generated successfully",
       "pdfUrl": "http://localhost:4700/dhiti/api/v1/observations/pdfReportsUrl?id=dG1wL2NkNDM2OTAwLWZlYjgtNGI2MS1iZDMxLTRkNGJmNzJkODQ3NC0tNDc4NQ=="
*     }
   * @apiUse errorBody
   */

   
//Controller function for unnati view full report pdf generation
exports.projectAndTaskReport = async function(req,res){
   
   let response; 
  
   if (req.query.projectPdf == "true") {
      response = await pdfHandler.unnatiProjectPdfGeneration(req.body, storeReportsToS3 = false);
   }
   else {
      response = await pdfHandler.unnatiTaskPdfGeneration(req.body, storeReportsToS3 = false);
   }
 
   response.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + response.pdfUrl
   res.send(response);
}