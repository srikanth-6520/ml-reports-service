const pdfHandler = require('../../helper/common_handler');
const config = require('../../config/config');


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

    let response = await pdfHandler.unnatiViewFullReportPdfGeneration(req.body, storeReportsToS3 = false);
  
    response.pdfUrl = config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + response.pdfUrl
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

   let response = await pdfHandler.unnatiEntityReportPdfGeneration(req.body, storeReportsToS3 = false);
 
   response.pdfUrl = config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + response.pdfUrl
   res.send(response);
}
