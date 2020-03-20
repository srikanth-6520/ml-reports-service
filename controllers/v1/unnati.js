var pdfHandler = require('../../helper/common_handler');


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

    let response = await pdfHandler.unnatiPdfGeneration(req.body,true);
    let hostname = req.headers.host;
  
    response.pdfUrl = "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + response.pdfUrl
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

    let response = await pdfHandler.unnatiMonthlyReportPdfGeneration(req.body,true);
    let hostname = req.headers.host;
  
    response.pdfUrl = "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + response.pdfUrl
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

    let response = await pdfHandler.unnatiViewFullReportPdfGeneration(req.body,true);
    let hostname = req.headers.host;
  
    response.pdfUrl = "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + response.pdfUrl
    res.send(response);
}
