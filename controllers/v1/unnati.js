const pdfHandler = require('../../helper/common_handler');


/**
   * @api {post} /dhiti/api/v1/unnati/pdfReport 
   * Project pdf report
   * @apiVersion 1.0.0
   * @apiGroup Unnati
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
    "title": "",
    "goal": "",
    "duration": "",
    "status":"",
    "startDate":"",
    "endDate":"",
    "category":[],
    "tasks": []
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

//Controller function for unnati pdf generation
exports.pdfReport = async function(req,res){

    let response = await pdfHandler.unnatiProjectPdfGeneration(req.body, storeReportsToS3 = false);
   
    response.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + response.pdfUrl
    res.send(response);
}


/**
   * @api {post} /dhiti/api/v1/unnati/monthlyReport 
   * Monthly report
   * @apiVersion 1.0.0
   * @apiGroup Unnati
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
    "schoolName": "",
    "reportType": "",
    "projectDetails": "",
    "title":"",
    "tasks": []
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
  
//Controller function for unnati monthly report pdf generation
exports.monthlyReport = async function(req,res){

    let response = await pdfHandler.unnatiMonthlyReportPdfGeneration(req.body, storeReportsToS3 = false);
  
    response.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + response.pdfUrl
    res.send(response);
}


/**
   * @api {post} /dhiti/api/v1/unnati/viewProjectReport 
   * View project report
   * @apiVersion 1.0.0
   * @apiGroup Unnati
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
  
    response.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + response.pdfUrl
    res.send(response);
}


/**
   * @api {post} /dhiti/api/v1/unnati/addTaskReport 
   * Add task report
   * @apiVersion 1.0.0
   * @apiGroup Unnati
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
   "projectName": "",
   "goal": "",
   "duration": "",
   "startDate": "",
   "assigneeName": "",
   "tasks": {
      "title": "",
      "endDate": "",
      "attachments": [
         {
           "name": ""
         }
      ]
   }
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

   
//Controller function for unnati add task pdf generation
exports.addTaskReport = async function(req,res){

   let response = await pdfHandler.unnatiTaskPdfGeneration(req.body, storeReportsToS3 = false);
 
   response.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + response.pdfUrl
   res.send(response);
}


