const rp = require('request-promise');
const request = require('request');
const helperFunc = require('../../helper/chart_data');
const pdfHandler = require('../../helper/common_handler');
const observationController = require('../v1/observations');
const url = require("url");
const omit = require('object.omit');
const assessmentService = require('../../helper/assessment_service');
const storePdfReportsToS3 = (!process.env.STORE_PDF_REPORTS_IN_AWS_ON_OFF || process.env.STORE_PDF_REPORTS_IN_AWS_ON_OFF != "OFF") ? "ON" : "OFF"
const helperFuncV2 = require('../../helper/chart_data_v2');
const pdfHandlerV2 =  require('../../helper/common_handler_v2');
const filesHelper = require('../../common/files_helper');


//Controller for entity solution report (cluster/block/zone/district)
exports.entitySolutionReport = async function (req, res) {

  return new Promise(async function (resolve, reject) {

    let responseData = await entitySolutionReportGeneration(req, res);
    res.send(responseData);

  })

};

// Function for entity observation report generation 
async function entitySolutionReportGeneration(req, res) {

  return new Promise(async function (resolve, reject) {

    try {

      if (!req.body.entityId || !req.body.entityType || !req.body.solutionId) {
        let response = {
          result: false,
          message: 'entityId, entityType, immediateChildEntityType and solutionId are required fields'
        }
        resolve(response);
      }

      else {

        entityType = req.body.entityType;
        entityId = req.body.entityId;
        immediateChildEntityType = req.body.immediateChildEntityType;

        let bodyParam = gen.utils.getDruidQuery("entity_solution_report_query");

        if (process.env.OBSERVATION_DATASOURCE_NAME) {
          bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
        }

        //Assign values to the query filter object 
        bodyParam.filter.fields[0].dimension = req.body.entityType;
        bodyParam.filter.fields[0].value = req.body.entityId;
        bodyParam.filter.fields[1].value = req.body.solutionId;

        //if programId is given
        if (req.body.programId) {
          let programFilter = { "type": "selector", "dimension": "programId", "value": req.body.programId };
          bodyParam.filter.fields.push(programFilter);
        }

        if (req.body.reportType == "my") {
          let filter = {
            "type": "or", "fields": [{
              "type": "and", "fields": [{ "type": "selector", "dimension": "createdBy", "value": req.userDetails.userId },
              { "type": "selector", "dimension": "isAPrivateProgram", "value": true }]
            },
            {
              "type": "and", "fields": [{ "type": "selector", "dimension": "createdBy", "value": req.userDetails.userId },
              { "type": "selector", "dimension": "isAPrivateProgram", "value": false }]
            }]
          };

          bodyParam.filter.fields.push(filter);
        }
        else {
          let filter = {
            "type": "or", "fields": [{
              "type": "and", "fields": [{ "type": "selector", "dimension": "createdBy", "value": req.userDetails.userId },
              { "type": "selector", "dimension": "isAPrivateProgram", "value": true }]
            },
            { "type": "selector", "dimension": "isAPrivateProgram", "value": false }]
          };

          bodyParam.filter.fields.push(filter);
        }

        // filter out not answered questions
        bodyParam.filter.fields.push({ "type": "not", "field": { "type": "selector", "dimension": "questionAnswer", "value": "" } });

        //get the acl data from samiksha service
        let userProfile = await assessmentService.getUserProfile(req.userDetails.userId, req.headers["x-auth-token"]);
        let aclLength = Object.keys(userProfile.result.acl);
        if (userProfile.result && userProfile.result.acl && aclLength > 0) {
          let tagsArray = await helperFunc.tagsArrayCreateFunc(userProfile.result.acl);

          bodyParam.filter.fields.push({
            "type": "or", "fields": [{ "type": "in", "dimension": "schoolType", "values": tagsArray },
            { "type": "in", "dimension": "administrationType", "values": tagsArray }]
          });
        }


        //Push column names dynamically to the query dimensions array 
        if (!req.body.immediateChildEntityType) {
          bodyParam.dimensions.push(entityType, entityType + "Name");
        }
        else if (req.body.immediateChildEntityType == "school") {
          bodyParam.dimensions.push(entityType, entityType + "Name", immediateChildEntityType, immediateChildEntityType + "Name");
        }
        else {
          bodyParam.dimensions.push(entityType, entityType + "Name", immediateChildEntityType, immediateChildEntityType + "Name", "school", "schoolName");
        }

        //pass the query as body param and get the result from druid
        let options = gen.utils.getDruidConnection();
        options.method = "POST";
        options.body = bodyParam;
        let data = await rp(options);

        if (!data.length) {
          resolve({ "data": "No observations made for the entity" })
        }
        else {
          let responseObj = await helperFunc.entityReportChart(data, req.body.entityId, req.body.entityType)
          resolve(responseObj);
        }
      }
    }
    catch (err) {
      let response = {
        result: false,
        message: 'INTERNAL_SERVER_ERROR'
      }
      resolve(response);
    }
  })
}



//Function for entity solution report PDF generation
async function entitySolutionReportPdfGeneration(req, res) {

  return new Promise(async function (resolve, reject) {

    var entityResponse = await entitySolutionReportGeneration(req, res);

    if (("solutionName" in entityResponse) == true) {

      let obj = {
        solutionName: entityResponse.solutionName
      }

      let resData = await pdfHandler.pdfGeneration(entityResponse, storeReportsToS3 = false, obj);

      var responseObject = {
        "status": "success",
        "message": "report generated",
        pdfUrl: process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
      }
      resolve(responseObject);
    }

    else {
      resolve(entityResponse);
    }
  });

};



//Controller for Entity Observation Score Report
exports.entityScoreReport = async function (req, res) {

  let data = await entityScoreReportGenerate(req, res);

  res.send(data);

}

async function entityScoreReportGenerate(req, res) {

  return new Promise(async function (resolve, reject) {

    try {

      if (!req.body.entityId || !req.body.observationId) {
        var response = {
          result: false,
          message: 'entityId and observationId are required fields'
        }
        resolve(response);
      }

      else {

        let bodyParam = gen.utils.getDruidQuery("entity_observation_score_query");

        if (process.env.OBSERVATION_DATASOURCE_NAME) {
          bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
        }

        let entityType = "school";

        if (req.body.entityType) {
          entityType = req.body.entityType;
        }

        //if filter is given
        if (req.body.filter) {
          if (req.body.filter.questionId && req.body.filter.questionId.length > 0) {
            bodyParam.filter.fields[1].fields[0].dimension = entityType;
            bodyParam.filter.fields[1].fields[0].value = req.body.entityId;
            bodyParam.filter.fields[1].fields[1].value = req.body.observationId;
            bodyParam.filter.fields.push({ "type": "in", "dimension": "questionExternalId", "values": req.body.filter.questionId });
          }
          else {
            bodyParam.filter.fields[1].fields[0].dimension = entityType;
            bodyParam.filter.fields[1].fields[0].value = req.body.entityId;
            bodyParam.filter.fields[1].fields[1].value = req.body.observationId;
          }
        }
        else {
          bodyParam.filter.fields[1].fields[0].dimension = entityType;
          bodyParam.filter.fields[1].fields[0].value = req.body.entityId;
          bodyParam.filter.fields[1].fields[1].value = req.body.observationId;
        }


        //pass the query as body param and get the resul from druid
        let options = gen.utils.getDruidConnection();
        options.method = "POST";
        options.body = bodyParam;

        let data = await rp(options);

        if (!data.length) {
          resolve({ "data": "No observations made for the entity" })
        }

        else {

          let chartData = await helperFunc.entityScoreReportChartObjectCreation(data, "v2");

          // send entity name dynamically
          chartData.entityName = data[0].event[entityType + "Name"];

          //Get evidence data from evidence datasource
          let inputObj = {
            entityId: req.body.entityId,
            observationId: req.body.observationId,
            entityType: entityType
          }

          let evidenceData = await getEvidenceData(inputObj);
          let responseObj;

          if (evidenceData.result) {
            responseObj = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
          } else {
            responseObj = chartData;
          }

          resolve(responseObj);

        }
      }
    }
    catch (err) {
      let response = {
        result: false,
        message: 'Data not found'
      }
      resolve(response);
    }
  })

}


//Entity observation score pdf generation
async function entityObservationScorePdfFunc(req, res) {

  return new Promise(async function (resolve, reject) {

    var entityRes = await entityScoreReportGenerate(req, res);

    if (entityRes.result == true) {

      let obj = {
        entityName: entityRes.entityName,
        totalObservations: entityRes.totalObservations
      }

      let resData = await pdfHandler.instanceObservationScorePdfGeneration(entityRes, storeReportsToS3 = false, obj);

      resData.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl

      resolve(resData);
    }

    else {
      resolve(entityRes);
    }

  });

};



//Controller for listing solution Names
exports.listObservationSolutions = async function (req, res) {

  try {

    if (!req.body.entityId || !req.body.entityType) {
      res.status(400);
      var response = {
        result: false,
        message: 'entityId,entityType are required fields'
      }
      res.send(response);
    }
    else {

      let query;

      if (req.body.reportType == "my") {
        query = "list_my_solutions_query";
      } else {
        query = "solutions_list_query";
      }

      let bodyParam = gen.utils.getDruidQuery(query);

      if (process.env.OBSERVATION_DATASOURCE_NAME) {
        bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
      }

      if (req.body.reportType == "my") {
        bodyParam.filter.fields[0].dimension = req.body.entityType;
        bodyParam.filter.fields[0].value = req.body.entityId;
        bodyParam.filter.fields[1].value = req.userDetails.userId;
      }
      else {
        bodyParam.filter.fields[0].dimension = req.body.entityType;
        bodyParam.filter.fields[0].value = req.body.entityId;
        bodyParam.filter.fields[1].fields[0].fields[0].value = req.userDetails.userId;
      }

      //get the acl data from samiksha service
      let userProfile = await assessmentService.getUserProfile(req.userDetails.userId, req.headers["x-auth-token"]);
      let aclLength = Object.keys(userProfile.result.acl);
      if (userProfile.result && userProfile.result.acl && aclLength > 0) {
        let tagsArray = await helperFunc.tagsArrayCreateFunc(userProfile.result.acl);

        bodyParam.filter.fields.push({
          "type": "or", "fields": [{ "type": "in", "dimension": "schoolType", "values": tagsArray },
          { "type": "in", "dimension": "administrationType", "values": tagsArray }]
        });
      }

      //pass the query as body param and get the result from druid
      let options = gen.utils.getDruidConnection();
      options.method = "POST";
      options.body = bodyParam;
      let data = await rp(options);

      if (!data.length) {
        res.send({ "result": false, "data": [] })
      }
      else {

        //call the function listObservationNamesObjectCreate to create response object
        let responseObj = await helperFunc.listSolutionNamesObjectCreate(data);
        res.send({ "result": true, "data": responseObj });
      }
    }
  }
  catch (err) {
    let response = {
      result: false,
      message: 'INTERNAL SERVER ERROR'
    }
    res.send(response);
  }
}


//Controller function for observation pdf reports
exports.pdfReports = async function (req, res) {

  return new Promise(async function (resolve, reject) {

    if (req.body.observationId && req.body.entityId) {

      let resObj = await entityObservationPdf(req, res);
      res.send(resObj);
    }
    else if (req.body.submissionId) {

      let resObj = await instancePdfReport(req, res);
      res.send(resObj);

    }
    else if (req.body.observationId) {

      let resObj = await observationGenerateReport(req, res);
      res.send(resObj);

    }
    else if (req.body.entityId && req.body.entityType && req.body.solutionId) {

      let resObj = await entitySolutionReportPdfGeneration(req, res);
      res.send(resObj);
    }
    else if (req.body.entityId && req.body.entityType && req.body.solutionId && req.body.reportType) {

      let resObj = await entitySolutionReportPdfGeneration(req, res);
      res.send(resObj);
    }
    else {
      res.send({
        status: "failure",
        message: "Invalid input"
      });
    }
  })

}


//Funcion for instance observation pdf generation
async function instancePdfReport(req, res) {

  return new Promise(async function (resolve, reject) {

    let instaRes = await observationController.instanceObservationData(req, res);

    if (("observationName" in instaRes) == true) {
      
      let resData = await pdfHandler.instanceObservationPdfGeneration(instaRes, storeReportsToS3 = false);

      if (resData.status && resData.status == "success") {

        let response = {
          status: "success",
          message: 'Instance observation Pdf Generated successfully',
          pdfUrl: process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
        }

        resolve(response);

      } else {
        resolve(resData);
      }
    
    }
    else {
      resolve(instaRes);
    }
  });
};



//Controller for entity observation pdf generation
async function entityObservationPdf(req, res) {

  return new Promise(async function (resolve, reject) {

    let responseData = await observationController.entityObservationData(req, res);

    if (("observationName" in responseData) == true) {

      let resData = await pdfHandler.pdfGeneration(responseData, storeReportsToS3 = false);

      if (resData.status && resData.status == "success") {

        let obj = {
          status: "success",
          message: 'Observation Pdf Generated successfully',
          pdfUrl: process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
        }

        resolve(obj);

      } else {
        resolve(resData);
      }
    }
    else {
      resolve(responseData);
    }

  });
}

//Controller for observation pdf report
async function observationGenerateReport(req, res) {

  return new Promise(async function (resolve, reject) {

    let responseData = await observationController.observationReportData(req, res);

    if (("observationName" in responseData) == true) {

      let resData = await pdfHandler.pdfGeneration(responseData, storeReportsToS3 = false);

      if (resData.status && resData.status == "success") {

        let obj = {
          status: "success",
          message: 'Observation Pdf Generated successfully',
          pdfUrl: process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
        }

        resolve(obj);
      } else {
        resolve(resData);
      }
    }
    else {
      resolve(responseData);
    }


  });
}


/**
   * @api {post} /dhiti/api/v2/observations/instance 
   * Instance observation report
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "submissionId": "",
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "entityName": "",
       "observationName": "",
       "observationId": "",
       "entityType": "",
       "entityId": "",
       "response": [{
         "order": "",
         "question": "",
         "responseType": "",
         "answers": [],
         "chart": {},
         "instanceQuestions":[],
         "evidences":[
              {"url":"", "extension":""}
          ]
       }]
*     }
   * @apiUse errorBody
   */

//Controller for instance observation report
exports.instance = async function (req, res) {

  let data = await instanceObservationData(req, res);

  res.send(data);
}


async function instanceObservationData(req, res) {

return new Promise(async function (resolve, reject) {

  try {

    if (!req.body.submissionId) {
      let response = {
        result: false,
        message: 'submissionId is a required field'
      };
      resolve(response);
    } else {
      let submissionId = req.body.submissionId;

      let bodyParam = gen.utils.getDruidQuery("instance_observation_query");

      if (process.env.OBSERVATION_DATASOURCE_NAME) {
        bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
      }

      bodyParam.filter.fields[0].value = submissionId;

      //if filter is given
      if (req.body.filter && req.body.filter.questionId && req.body.filter.questionId.length > 0) {
        let filter = { "type": "in", "dimension": "questionExternalId", "values": req.body.filter.questionId };
        bodyParam.filter.fields.push(filter);
      }
      else {
        let filter = { "type": "not", "field": { "type": "selector", "dimension": "questionAnswer", "value": "" } };
        bodyParam.filter.fields.push(filter);
      }

      //pass the query as body param and get the resul from druid
      var options = gen.utils.getDruidConnection();
      options.method = "POST";
      options.body = bodyParam;
      var data = await rp(options);

      if (!data.length) {
        let message;
        let getSubmissionStatusResponse = await assessmentService.getObservationSubmissionStatusById
          (
            submissionId,
            req.headers["x-auth-token"]
          )

        if (getSubmissionStatusResponse.result &&
          getSubmissionStatusResponse.result.status == filesHelper.submission_status_completed) {
          message = filesHelper.submission_not_found_message
        }
        else {
          message = "SUBMISSION_ID_NOT_FOUND";
        }

        resolve({
          "data": message
        });
      } else {

        let chartData = await helperFuncV2.instanceReportChart(data);

        //Get evidence data from evidence datasource
        let inputObj = {
          submissionId: submissionId
        }

        let evidenceData = await getEvidenceData(inputObj);
        let responseObj;

        if (evidenceData.result) {
          responseObj = await helperFuncV2.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
        } else {
          responseObj = chartData;
        }

        resolve(responseObj);

      }
    }

  }
  catch (err) {
    let response = {
      result: false,
      message: 'INTERNAL_SERVER_ERROR'
    };
    resolve(response);
  }

});
};


/**
   * @api {post} /dhiti/api/v2/observations/instanceObservationScoreReport 
   * Instance observation score report
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "submissionId": "",
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "result": true,
       "totalScore": "",
       "scoreAchieved": "",
       "observationName": "",
       "response": [{
          "order": "",
          "question": "",
          "chart": {
            "type": "",
            "credits": {
                "enabled": false
            },
            "plotOptions": {
                "pie": {
                    "allowPointSelect": true,
                    "cursor": "pointer",
                    "dataLabels": {
                        "enabled": false
                    },
                    "showInLegend": true,
                    "borderColor": "#000000"
                }
            },
            "data": [{
                "data": [{
                    "name": "",
                    "y": "",
                    "color": "#6c4fa1"
                },{
                    "name": "",
                    "y": "",
                    "color": "#fff"
                }]
            }]
          },
          "evidences":[
              {"url":"", "extension":""}
          ]
        }]
*     }
   * @apiUse errorBody
   */

//Controller for instance observation score report query
exports.instanceObservationScoreReport = async function (req, res) {

  let data = await instanceScoreReport(req, res);

  res.send(data);
}


//Controller for instance observation score report chart object creation
async function instanceScoreReport(req, res) {

  return new Promise(async function (resolve, reject) {
   
    try {

    if (!req.body.submissionId) {
      let response = {
        result: false,
        message: 'submissionId is a required field'
      };

      resolve(response);

    } else {
      
          let bodyParam = gen.utils.getDruidQuery("instance_observation_score_query");
          
          if (process.env.OBSERVATION_DATASOURCE_NAME) {
            bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
          }

           //if filter is given
           if (req.body.filter) {
            if (req.body.filter.questionId && req.body.filter.questionId.length > 0) {
              bodyParam.filter.fields[0].value = req.body.submissionId;
              bodyParam.filter.fields.push({"type":"in","dimension":"questionExternalId","values":req.body.filter.questionId});
            }
            else {
              bodyParam.filter.fields[0].value = req.body.submissionId;
            }
          }
          else {
            bodyParam.filter.fields[0].value = req.body.submissionId;
          }
      
          //pass the query as body param and get the resul from druid
          let options = gen.utils.getDruidConnection();
          options.method = "POST";
          options.body = bodyParam;
          let data = await rp(options);

          if (!data.length) {
            let message;
            let getSubmissionStatusResponse = await assessmentService.getObservationSubmissionStatusById
            (
              req.body.submissionId,
              req.headers["x-auth-token"]
            )

            if (getSubmissionStatusResponse.result && 
                getSubmissionStatusResponse.result.status == filesHelper.submission_status_completed) {
                message = filesHelper.submission_not_found_message;
            }
            else {
                message = "SUBMISSION_ID_NOT_FOUND";
            }

            resolve({
              "data": message
            });

          } else {

            let chartData = await helperFuncV2.instanceScoreReportChartObjectCreation(data);

            //Get evidence data from evidence datasource
            let inputObj = {
              submissionId : req.body.submissionId
            }

            let evidenceData = await getEvidenceData(inputObj);
            
            let responseObj;

            if(evidenceData.result) {
              responseObj = await helperFuncV2.evidenceChartObjectCreation(chartData,evidenceData.data,req.headers["x-auth-token"]);

            } else {
              responseObj = chartData;
            }
            resolve(responseObj);
          }
      }
    }
    catch(err) {
      let response = {
        result: false,
        message: 'INTERNAL_SERVER_ERROR'
      };
      resolve(response);
    }
  })
};




//Instance observation score pdf generation
async function instanceObservationScorePdfFunc(req, res) {

  return new Promise(async function (resolve, reject) {
 
    let instaRes = await instanceScoreReport(req, res);

    if (instaRes.result == true) {

      let obj = {
        totalScore: instaRes.totalScore,
        scoreAchieved: instaRes.scoreAchieved
      }
     
      let resData = await pdfHandlerV2.instanceObservationScorePdfGeneration(instaRes, storeReportsToS3 = false, obj);
       
      resData.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
      resolve(resData);

      }
    else {
      resolve(instaRes);
    }
  });
};



/**
   * @api {post} /dhiti/api/v2/observations/entity 
   * Entity observation report
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token    
   * @apiParamExample {json} Request-Body:
* {
  "entityId": "",
  "observationId": "",
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "observationId": "",
       "observationName": "",
       "entityType": "",
       "entityId": "",
       "entityName": "",
       "response": [{
          "order": "",
          "question": "",
          "responseType": "",
          "answers": "",
          "chart": {},
          "instanceQuestions": [],
          "evidences":[
              {"url":"", "extension":""}
          ]
       }]
*     }
   * @apiUse errorBody
   */

//Controller for entity observation report
exports.entity = async function (req, res) {

  let data = await entityObservationData(req, res);

  res.send(data);
}


async function entityObservationData(req, res) {

  return new Promise(async function (resolve, reject) {

    try {

      if (!req.body.entityId || !req.body.observationId) {
        let response = {
          result: false,
          message: 'entityId and observationId are required fields'
        }
        resolve(response);
      }
      else {

        let bodyParam = gen.utils.getDruidQuery("entity_observation_query");

        if (process.env.OBSERVATION_DATASOURCE_NAME) {
          bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
        }

        let entityType = "school";

        if (req.body.entityType) {
          entityType = req.body.entityType;
        }

        bodyParam.filter.fields[0].dimension = entityType;
        bodyParam.filter.fields[0].value = req.body.entityId;
        bodyParam.filter.fields[1].value = req.body.observationId;

        //if filter is given
        if (req.body.filter && req.body.filter.questionId && req.body.filter.questionId.length > 0) {
          let filter = { "type": "in", "dimension": "questionExternalId", "values": req.body.filter.questionId };
          bodyParam.filter.fields.push(filter);
        }
        else {
          let filter = { "type": "not", "field": { "type": "selector", "dimension": "questionAnswer", "value": "" } };
          bodyParam.filter.fields.push(filter);
        }

        //pass the query as body param and get the resul from druid
        let options = gen.utils.getDruidConnection();
        options.method = "POST";
        options.body = bodyParam;
        let data = await rp(options);

        if (!data.length) {
          let message;
          let getEntityObservationSubmissionsStatus = await assessmentService.getEntityObservationSubmissionsStatus
            (
              req.body.entityId,
              req.body.observationId,
              req.headers["x-auth-token"]
            )

          if (getEntityObservationSubmissionsStatus.result &&
            getEntityObservationSubmissionsStatus.result.length > 0) {

            if (getEntityObservationSubmissionsStatus.result.filter(submission => submission.status === filesHelper.submission_status_completed).length > 0) {
              message = filesHelper.submission_not_found_message
            }
          }
          else {
            message = "No observations made for the entity";
          }

          resolve({
            "data": message
          });
        }
        else {

          let chartData = await helperFuncV2.entityReportChart(data, req.body.entityId, "school")

          //Get evidence data from evidence datasource
          let inputObj = {
            entityId: req.body.entityId,
            observationId: req.body.observationId,
            entityType: entityType
          }

          let evidenceData = await getEvidenceData(inputObj);

          let responseObj;

          if (evidenceData.result) {
            responseObj = await helperFuncV2.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);

          } else {
            responseObj = chartData;
          }

          resolve(responseObj);

        }
      }
    }
    catch (err) {
      res.status(400);
      let response = {
        result: false,
        message: 'INTERNAL_SERVER_ERROR'
      }
      resolve(response);
    }

  });
}


/**
   * @api {post} /dhiti/api/v2/observations/entitySolutionScoreReport 
   * Entity solution score report
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "entityId": "",
  "entityType": "",
  "solutionId": ""
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "result": true,
       "solutionName": "",
       "response": [{
         "order": "",
         "question": "",
         "chart": {
            "type": "bar",
            "title": "",
            "xAxis": {
                "title": {
                    "text": null
                },
                "labels": {},
                "categories": []
            },
            "yAxis": {
                "min": 0,
                "max": "",
                "title": {
                    "text": "Score"
                },
                "labels": {
                    "overflow": "justify"
                },
                "allowDecimals" : false
            },
            "plotOptions": {
                "bar": {
                    "dataLabels": {
                        "enabled": true
                    }
                }
            },
            "legend": {
               "enabled" : true
            },
            "credits": {
                "enabled": false
            },
            "data": [{
                "name": "observation1",
                "data": []
            }, {
                "name": "observation2",
                "data": []
            }]

          }
        }]
*     }
   * @apiUse errorBody
   */

//Controller for entity solution score report (cluster/block/zone/district/state)
exports.entitySolutionScoreReport = async function (req, res) {

  return new Promise(async function (resolve, reject) {

    let responseData = await entitySolutionScoreReportGeneration(req, res);
    res.send(responseData);

  })

};


//Function for entity solution report generation 
async function entitySolutionScoreReportGeneration(req, res) {

  return new Promise(async function (resolve, reject) {

    try {

    if (!req.body.entityId || !req.body.entityType || !req.body.solutionId) {
      res.status(400);
      let response = {
        result: false,
        message: 'entityId, entityType and solutionId are required fields'
      }
      resolve(response);
    }
    
    else if (req.body.entityType == "school") {

      let response = await schoolSolutionScoreReport(req, res);
      resolve(response);

    }

    else {

          let bodyParam = gen.utils.getDruidQuery("entity_solution_score_query");

          if (process.env.OBSERVATION_DATASOURCE_NAME) {
            bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
          }

          //Assign values to the query filter object 
          bodyParam.filter.fields[1].fields[0].dimension = req.body.entityType;
          bodyParam.filter.fields[1].fields[0].value = req.body.entityId;
          bodyParam.filter.fields[1].fields[1].value = req.body.solutionId;

           //if programId is given
           if (req.body.programId) {
            let programFilter = { "type": "selector", "dimension": "programId", "value": req.body.programId };
            bodyParam.filter.fields[1].fields.push(programFilter);
          }
          
          //code for myObservation
          if (req.body.reportType == "my") {
            let filter = {"type":"or","fields":[{"type":"and","fields":[{"type":"selector","dimension":"createdBy","value": req.userDetails.userId},
                         {"type":"selector","dimension":"isAPrivateProgram","value":true}]},
                         {"type":"and","fields":[{"type":"selector","dimension":"createdBy","value": req.userDetails.userId},
                         {"type":"selector","dimension":"isAPrivateProgram","value":false}]}]};
            bodyParam.filter.fields[1].fields.push(filter);

          }
          else {
            let filter = {"type": "or","fields":[{"type":"and","fields":[{"type":"selector","dimension":"createdBy","value": req.userDetails.userId},
            {"type":"selector","dimension":"isAPrivateProgram","value":true}]},
            {"type":"selector","dimension":"isAPrivateProgram","value":false}]};

            bodyParam.filter.fields[1].fields.push(filter);
          }

          //get the acl data from samiksha service
          let userProfile = await assessmentService.getUserProfile(req.userDetails.userId, req.headers["x-auth-token"]);
          let aclLength = Object.keys(userProfile.result.acl);
          if (userProfile.result && userProfile.result.acl && aclLength > 0) {
            let tagsArray = await helperFunc.tagsArrayCreateFunc(userProfile.result.acl);

            bodyParam.filter.fields[1].fields.push({"type":"or","fields":[{"type": "in", "dimension": "schoolType", "values": tagsArray },
                                         { "type": "in", "dimension": "administrationType", "values": tagsArray }]});
          }

          //pass the query as body param and get the result from druid
          let options = gen.utils.getDruidConnection();
          options.method = "POST";
          options.body = bodyParam;
          let data = await rp(options);

          if (!data.length) {
            resolve({ "data": "No observations made for the entity" })
          }
          else {
            let responseObj = await helperFuncV2.observationScoreReportChart(data)
            responseObj.solutionId = req.body.solutionId;
            resolve(responseObj);
          }
          }
        }
        catch(err) {
          res.status(400);
          let response = {
            result: false,
            message: 'INTERNAL_SERVER_ERROR'
          }
          resolve(response);
        }
  })

}


//School solution score report creation function
async function schoolSolutionScoreReport(req, res) {

  return new Promise(async function (resolve, reject) {

    try {

        let bodyParam = gen.utils.getDruidQuery("entity_solution_score_query");

        if (process.env.OBSERVATION_DATASOURCE_NAME) {
          bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
        }

        //Assign values to the query filter object 
        bodyParam.filter.fields[1].fields[0].dimension = req.body.entityType;
        bodyParam.filter.fields[1].fields[0].value = req.body.entityId;
        bodyParam.filter.fields[1].fields[1].value = req.body.solutionId;

        //if programId is given
        if (req.body.programId) {
          let programFilter = { "type": "selector", "dimension": "programId", "value": req.body.programId };
          bodyParam.filter.fields[1].fields.push(programFilter);
        }
        
        //code for myObservation
        if (req.body.reportType == "my") {
          let filter = { "type": "selector", "dimension": "createdBy", "value": req.userDetails.userId }
          bodyParam.filter.fields[1].fields.push(filter);

          //if programId is given
          if (req.body.programId) {
            let programFilter = { "type": "selector", "dimension": "programId", "value": req.body.programId };
            bodyParam.filter.fields[1].fields.push(programFilter);
          }
          
        }

        //get the acl data from samiksha service
        let userProfile = await assessmentService.getUserProfile(req.userDetails.userId, req.headers["x-auth-token"]);
        let aclLength = Object.keys(userProfile.result.acl);
        if (userProfile.result && userProfile.result.acl && aclLength > 0) {
          let tagsArray = await helperFunc.tagsArrayCreateFunc(userProfile.result.acl);

          bodyParam.filter.fields[1].fields.push({"type":"or","fields":[{"type": "in", "dimension": "schoolType", "values": tagsArray },
                                       { "type": "in", "dimension": "administrationType", "values": tagsArray }]});
        }

        //pass the query as body param and get the resul from druid
        let options = gen.utils.getDruidConnection();
        options.method = "POST";
        options.body = bodyParam;

        let data = await rp(options);

        if (!data.length) {
          resolve({ "data": "No observations made for the entity" })
        }

        else {

          let responseObj = await helperFuncV2.entityScoreReportChartObjectCreation(data)
          delete responseObj.observationName;
          responseObj.solutionName = data[0].event.solutionName;
          resolve(responseObj);

        }
    }
    catch(err) {
        let response = {
          result: false,
          message: 'INTERNAL_SERVER_ERROR'
        }
        resolve(response);
      }
  })
}


//Entity solution score pdf generation
async function entitySolutionScorePdfFunc(req, res) {

  return new Promise(async function (resolve, reject) {

    var entityRes = await entitySolutionScoreReportGeneration(req, res);

    if (entityRes.result == true) {

      let obj = {
        solutionName: entityRes.solutionName
      }

      let resData = await pdfHandlerV2.instanceObservationScorePdfGeneration(entityRes, storeReportsToS3 = false, obj);

      resData.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl

      resolve(resData);
    }

    else {
      resolve(entityRes);
    }

  });

};



/**
   * @api {post} /dhiti/api/v2/observations/report
   * Observation report
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "observationId": "",
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "observationId": "",
       "observationName": "",
       "entityType": "",
       "entityId": "",
       "entityName": "",
       "response": [{
          "order": "",
          "question": "",
          "responseType": "",
          "answers": "",
          "chart": {},
          "instanceQuestions": [],
          "evidences":[
              {"url":"", "extension":""}
          ]
       }]
*     }
   * @apiUse successBody
   * @apiUse errorBody
   */

//Controller for observation report
exports.report = async function (req, res) {
  return new Promise(async function (resolve, reject) {
      let data = await observationReportData(req, res);
      res.send(data);
  })
}

async function observationReportData(req, res) {
return new Promise(async function (resolve, reject) {

  try {
    if (!req.body.observationId) {
      res.status(400);
      let response = {
        result: false,
        message: 'observationId is a required field'
      }
      resolve(response);
    }
    else {

      let bodyParam = gen.utils.getDruidQuery("observation_report_query");

      if (process.env.OBSERVATION_DATASOURCE_NAME) {
        bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
      }

      bodyParam.filter.fields[0].value = req.body.observationId;

      //if filter is given
      if (req.body.filter && req.body.filter.questionId && req.body.filter.questionId.length > 0) {
        let filter = { "type": "in", "dimension": "questionExternalId", "values": req.body.filter.questionId };
        bodyParam.filter.fields.push(filter);
      }
      else {
        let filter = { "type": "not", "field": { "type": "selector", "dimension": "questionAnswer", "value": "" } };
        bodyParam.filter.fields.push(filter);
      }

      //pass the query as body param and get the resul from druid
      let options = gen.utils.getDruidConnection();
      options.method = "POST";
      options.body = bodyParam;
      let data = await rp(options);

      //if no data throw error message
      if (!data.length) {
        resolve({ "data": "No entities are observed" })
      }
      else {
        entityId = "";
        entityType = "";

        let chartData = await helperFuncV2.entityReportChart(data, entityId, entityType);

        //Get evidence data from evidence datasource
        let inputObj = {
          observationId: req.body.observationId
        }

        let evidenceData = await getEvidenceData(inputObj);

        let responseObj;

        if (evidenceData.result) {
          responseObj = await helperFuncV2.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);

        } else {
          responseObj = chartData;
        }

        resolve(responseObj);

      }
    }
  }
  catch (err) {
    res.status(400);
    let response = {
      result: false,
      message: 'INTERNAL_SERVER_ERROR'
    }
    resolve(response);
  }
});
}




//COntroller function for observation score pdf reports
exports.observationScorePdfReport = async function (req, res) {

  return new Promise(async function (resolve, reject) {

      if (req.body && req.body.submissionId) {

          let resObj = await instanceObservationScorePdfFunc(req, res);
          res.send(resObj);
      }

      else if (req.body && req.body.entityId && req.body.observationId) {

          let resObj = await entityObservationScorePdfFunc(req, res);
          res.send(resObj);
      }
      else if (req.body && req.body.observationId) {

          let resObj = await observationScorePdfFunc(req, res);
          res.send(resObj);
      }
      else if (req.body && req.body.solutionId && req.body.entityId && req.body.entityType) {

          let resObj = await entitySolutionScorePdfFunc(req, res);
          res.send(resObj);

      }
      else if (req.body && req.body.solutionId && req.body.entityId && req.body.entityType && req.body.reportType) {

          let resObj = await entitySolutionScorePdfFunc(req, res);
          res.send(resObj);

      }
      else {
          res.send({
              status: "failure",
              message: "Invalid input"
          });
      }

  })
}


/**
   * @api {post} /dhiti/api/v2/observations/scoreReport
   * Observation score report
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "observationId": "",
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "result": true,
       "solutionName": "",
       "response": [{
         "order": "",
         "question": "",
         "chart": {
            "type": "bar",
            "title": "",
            "xAxis": {
                "title": {
                    "text": null
                },
                "labels": {},
                "categories": []
            },
            "yAxis": {
                "min": 0,
                "max": "",
                "title": {
                    "text": "Score"
                },
                "labels": {
                    "overflow": "justify"
                },
                "allowDecimals" : false
            },
            "plotOptions": {
                "bar": {
                    "dataLabels": {
                        "enabled": true
                    }
                }
            },
            "legend": {
               "enabled" : true
            },
            "credits": {
                "enabled": false
            },
            "data": [{
                "name": "observation1",
                "data": []
            }, {
                "name": "observation2",
                "data": []
            }]
        },
        "evidences":[
            {"url":"", "extension":""}
        ]
      }]
*     }
   * @apiUse errorBody
   */

//Controller for observation Score report  
exports.scoreReport = async function (req , res){

  let data = await observationScoreReport(req, res);

  res.send(data);

}


async function observationScoreReport(req, res) {

  return new Promise(async function (resolve, reject) {

   try {

    if (!req.body.observationId) {
      let response = {
        result: false,
        message: 'observationId is a required fields'
      }
      resolve(response);
    }

    else {
        
        let bodyParam = gen.utils.getDruidQuery("observation_score_report_query");

          if (process.env.OBSERVATION_DATASOURCE_NAME) {
            bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
          }
          
          let entityType = "school";

          if(req.body.entityType){
             entityType = req.body.entityType;
          }
          
          bodyParam.dimensions.push(entityType,entityType + "Name");
          
           //if filter is given
           if (req.body.filter) {
            if (req.body.filter.questionId && req.body.filter.questionId.length > 0) {
              bodyParam.filter.fields[0].value = req.body.observationId;
              bodyParam.filter.fields.push({"type":"in","dimension":"questionExternalId","values":req.body.filter.questionId});
            }
            else {
              bodyParam.filter.fields[0].value = req.body.observationId;
            }
          }
          else {
            bodyParam.filter.fields[0].value = req.body.observationId;
          }

          //pass the query as body param and get the resul from druid
          let options = gen.utils.getDruidConnection();
          options.method = "POST";
          options.body = bodyParam;

          let data = await rp(options);

          if (!data.length) {
            resolve({ "data": "No entities found" })
          }

          else {

            let chartData = await helperFuncV2.observationScoreReportChart(data,entityType);

              //Call samiksha API to get total schools count for the given observationId
              let totalEntities = await assessmentService.getTotalEntities(req.body.observationId,req.headers["x-auth-token"]);

            if (totalEntities.result && totalEntities.result.count) {
              chartData.totalEntities = totalEntities.result.count;
            }

            //Get evidence data from evidence datasource
            let inputObj = {
              observationId: req.body.observationId
            }

            let evidenceData = await getEvidenceData(inputObj);

            let responseObj;

            if (evidenceData.result) {
              responseObj = await helperFuncV2.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);

            } else {
              responseObj = chartData;
            }

            resolve(responseObj);

          }
      }
    }
    catch(err) {
      let response = {
        result: false,
        message: 'INTERNAL_SERVER_ERROR'
      }
        resolve(response);
    }

  })

}


//Observation score pdf generation 
async function observationScorePdfFunc(req, res) {

  return new Promise (async function (resolve,reject){

  let observationRes = await observationScoreReport(req, res);

  if (observationRes.result == true) {
    
    let obj = {
      totalEntities : observationRes.totalEntities,
      entitiesObserved : observationRes.entitiesObserved,
      entityType: observationRes.entityType
    }

    let resData = await pdfHandlerV2.instanceObservationScorePdfGeneration(observationRes, storeReportsToS3 = false, obj);

    resData.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl

    res.send(resData);
  }

  else {
    res.send(observationRes);
  }
});
};



/**
   * @api {post} /dhiti/api/v2/observations/instanceReportByCriteria
   * Instance report by criteria
   * @apiVersion 1.0.0
   * @apiGroup observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "submissionId": "",
  "filter": {
    "criteria" : []
  }
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "entityName": "",
       "observationName": "",
       "observationId": "",
       "entityType": "",
       "entityId": "",
       "response": [{
         "criteriaName": "",
         "criteriaId": "",
         "questionArray": [{
            "order": "",
            "question": "",
            "responseType": "",
            "answers": [],
            "chart": {},
            "instanceQuestions":[],
            "evidences":[
              {"url":"", "extension":""},
            ]
         }]
         
       }]
*     }
   * @apiUse errorBody
   */

//Controller for instance observation report
exports.instanceReportByCriteria = async function (req, res) {

  let data = await instanceCriteriaReportData(req, res);

  res.send(data);
}


async function instanceCriteriaReportData(req, res) {

  return new Promise(async function (resolve, reject) {

    try {

      if (!req.body.submissionId) {
        let response = {
          result: false,
          message: 'submissionId is a required field'
        };
        resolve(response);
      } else {

        let submissionId = req.body.submissionId;


        let bodyParam = gen.utils.getDruidQuery("instance_criteria_report_query");

        if (process.env.OBSERVATION_DATASOURCE_NAME) {
          bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
        }

        bodyParam.filter = {
          "type": "and", "fields": [{ "type": "selector", "dimension": "observationSubmissionId", "value": submissionId },
          { "type": "not", "field": { "type": "selector", "dimension": "questionAnswer", "value": "" } }]
        };

        //if filter is given
        if (req.body.filter && req.body.filter.criteria && req.body.filter.criteria.length > 0) {
          bodyParam.filter.fields.push({ "type": "in", "dimension": "criteriaId", "values": req.body.filter.criteria });
        }

        //pass the query as body param and get the resul from druid
        let options = gen.utils.getDruidConnection();
        options.method = "POST";
        options.body = bodyParam;
        let data = await rp(options);

        if (!data.length) {
          let message;
          let getSubmissionStatusResponse = await assessmentService.getObservationSubmissionStatusById
            (
              submissionId,
              req.headers["x-auth-token"]
            )

          if (getSubmissionStatusResponse.result &&
            getSubmissionStatusResponse.result.status == filesHelper.submission_status_completed) {
            message = filesHelper.submission_not_found_message;
          }
          else {
            message = "SUBMISSION_ID_NOT_FOUND";
          }

          resolve({
            "result": false,
            "data": message
          });

        } else {

          let reportType = "criteria";
          let chartData = await helperFuncV2.instanceReportChart(data, reportType);

          //Get evidence data from evidence datasource
          let inputObj = {
            submissionId: submissionId
          }

          let evidenceData = await getEvidenceData(inputObj);
          let responseObj;

          if (evidenceData.result) {
            responseObj = await helperFuncV2.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
          } else {
            responseObj = chartData;
          }

          responseObj = await helperFuncV2.getCriteriawiseReport(responseObj);

          resolve(responseObj);

        }
      }
    }
    catch (err) {
      let response = {
        result: false,
        message: 'INTERNAL_SERVER_ERROR'
      };
      resolve(response);
    }

  });
};



//Funcion for instance observation pdf generation
async function instancePdfReportByCriteria(req, res) {

return new Promise(async function (resolve, reject) {

  let instaRes = await instanceCriteriaReportData(req, res);

  if (("observationName" in instaRes) == true) {

    let resData = await pdfHandlerV2.instanceCriteriaReportPdfGeneration(instaRes, storeReportsToS3 = false);
    
    resData.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
    resolve(resData);
  }
  else {
    resolve(instaRes);
  }

});
};


/**
   * @api {post} /dhiti/api/v2/observations/instanceScoreReportByCriteria
   * Instance score report by criteria
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "submissionId": "",
  "filter": {
     "criteria": []
  }
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "result": true,
       "totalScore": "",
       "scoreAchieved": "",
       "observationName": "",
       "response": [{
          "criteriaName": "",
          "criteriaId": "",
          "questionArray": [{
              "order": "",
              "question": "",
              "chart": {
                 "type": "",
                 "credits": {
                    "enabled": false
                  },
                 "plotOptions": {
                    "pie": {
                       "allowPointSelect": true,
                       "cursor": "pointer",
                       "dataLabels": {
                          "enabled": false
                        },
                    "showInLegend": true,
                    "borderColor": "#000000"
                  }
                },
                "data": [{
                  "data": [{
                    "name": "",
                    "y": "",
                    "color": "#6c4fa1"
                },{
                    "name": "",
                    "y": "",
                    "color": "#fff"
                  }]
                }]
              },
              "evidences":[
                 {"url":"", "extension":""},
              ]
          }]
        }]
*     }
   * @apiUse errorBody
   */

//Controller for instance observation score report query
exports.instanceScoreReportByCriteria = async function (req, res) {

  let data = await instanceScoreCriteriaReportData(req, res);

  res.send(data);
}


//Controller for instance observation score report chart object creation
async function instanceScoreCriteriaReportData(req, res) {

  return new Promise(async function (resolve, reject) {
    
    try {

    if (!req.body.submissionId) {
      let response = {
        result: false,
        message: 'submissionId is a required field'
      };

      resolve(response);

    } else {

          let bodyParam = gen.utils.getDruidQuery("instance_score_criteria_report_query");

          if (process.env.OBSERVATION_DATASOURCE_NAME) {
            bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
          }
          
          bodyParam.filter.fields[0].value = req.body.submissionId;
          bodyParam.filter.fields.push({"type":"not","field":{"type":"selector","dimension":"questionAnswer","value":""}});

           //if filter is given
           if (req.body.filter && req.body.filter.criteria && req.body.filter.criteria.length > 0) {
              bodyParam.filter.fields.push({"type":"in","dimension":"criteriaId","values":req.body.filter.criteria});
           }
      
          //pass the query as body param and get the resul from druid
          let options = gen.utils.getDruidConnection();
          options.method = "POST";
          options.body = bodyParam;
          let data = await rp(options);

          if (!data.length) {
            let message;
            let getSubmissionStatusResponse = await assessmentService.getObservationSubmissionStatusById
            (
              req.body.submissionId,
              req.headers["x-auth-token"]
            )

            if (getSubmissionStatusResponse.result && 
                getSubmissionStatusResponse.result.status == filesHelper.submission_status_completed) {
                message = filesHelper.submission_not_found_message;
            }
            else {
                message = "SUBMISSION_ID_NOT_FOUND";
            }

            resolve({
              "result": false,
              "data": message
            });
          
          } else {
              
            let reportType = "criteria";
            let chartData = await helperFuncV2.instanceScoreReportChartObjectCreation(data,reportType);

            //Get evidence data from evidence datasource
            let inputObj = {
              submissionId : req.body.submissionId
            }

            let evidenceData = await getEvidenceData(inputObj);
            
            let responseObj;

            if(evidenceData.result) {
              responseObj = await helperFuncV2.evidenceChartObjectCreation(chartData,evidenceData.data,req.headers["x-auth-token"]);

            } else {
              responseObj = chartData;
            }
            
            // get criteria wise report
            responseObj = await helperFuncV2.getCriteriawiseReport(responseObj);

            resolve(responseObj);
          }
        }
      }
      catch (err) {
      let response = {
        result: false,
        message: 'INTERNAL_SERVER_ERROR'
      };
      resolve(response);
    }

  })
};


//Instance observation score pdf generation
async function instanceScorePdfReprtByCriteria(req, res) {

  return new Promise(async function (resolve, reject) {

    let instaRes = await instanceScoreCriteriaReportData(req, res);

    if (instaRes.result == true) {

      let obj = {
        totalScore: instaRes.totalScore,
        scoreAchieved: instaRes.scoreAchieved
      }

      let resData = await pdfHandlerV2.instanceScoreCriteriaPdfGeneration(instaRes, storeReportsToS3 = false, obj);

      resData.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
      resolve(resData);

    }
    else {
      resolve(instaRes);
    }
  });
};


/**
   * @api {post} /dhiti/api/v2/observations/entityReportByCriteria
   * Entity report by criteria
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token    
   * @apiParamExample {json} Request-Body:
* {
  "entityId": "",
  "observationId": "",
  "entityType": "",
  "filter": {
     "criteria": []
  }
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "observationId": "",
       "observationName": "",
       "entityType": "",
       "entityId": "",
       "entityName": "",
       "response": [{
          "criteriaName": "",
          "criteriaId": "",
          "questionArray": [{
              "order": "",
              "question": "",
              "responseType": "",
              "answers": "",
              "chart": {},
              "instanceQuestions": [],
              "evidences":[
                  {"url":"", "extension":""}
              ]
            }]  
        }]
*     }
   * @apiUse errorBody
   */

//Controller for entity observation report
exports.entityReportByCriteria = async function (req, res) {

  let data = await entityCriteriaReportData(req, res);

  res.send(data);
}


async function entityCriteriaReportData(req, res) {

  return new Promise(async function (resolve, reject) {

    try {

    if (!req.body.entityId || !req.body.observationId) {
      let response = {
        result: false,
        message: 'entityId and observationId are required fields'
      }
      resolve(response);
    }
    else {

        let bodyParam = gen.utils.getDruidQuery("entity_criteria_report_query");

          if (process.env.OBSERVATION_DATASOURCE_NAME) {
            bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
          }

          let entityType = "school";
          
          if(req.body.entityType){
            entityType = req.body.entityType;
          }

          bodyParam.filter.fields[0].dimension = entityType;
          bodyParam.filter.fields[0].value = req.body.entityId;
          bodyParam.filter.fields[1].value = req.body.observationId;
          bodyParam.filter.fields.push({"type":"not","field":{"type":"selector","dimension":"questionAnswer","value":""}});

           //if filter is given
           if (req.body.filter && req.body.filter.criteria && req.body.filter.criteria.length > 0) {
            bodyParam.filter.fields.push({ "type": "in", "dimension":"criteriaId","values":req.body.filter.criteria });
          }

          //pass the query as body param and get the resul from druid
          let options = gen.utils.getDruidConnection();
          options.method = "POST";
          options.body = bodyParam;
          let data = await rp(options);
         
          if (!data.length) {
              let message;
              let getEntityObservationSubmissionsStatus = await assessmentService.getEntityObservationSubmissionsStatus
              (
                  req.body.entityId,
                  req.body.observationId,
                  req.headers["x-auth-token"]
              )
             
              if (getEntityObservationSubmissionsStatus.result && 
                getEntityObservationSubmissionsStatus.result.length > 0) {

                if(getEntityObservationSubmissionsStatus.result.filter(submission => submission.status === filesHelper.submission_status_completed).length > 0) {
                  message = filesHelper.submission_not_found_message
                }
              }
              else {
                  message = "NO_OBSERVATIONS_MADE_FOR_THE_ENTITY";
              }
            
            resolve({ 
              "result": false,
              "data": message })
          }
          else {

            let reportType = "criteria";
            let chartData = await helperFuncV2.entityReportChart(data, req.body.entityId, "school",reportType)

             //Get evidence data from evidence datasource
             let inputObj = {
              entityId : req.body.entityId,
              observationId : req.body.observationId,
              entityType: entityType
            }

            let evidenceData = await getEvidenceData(inputObj);
            
            let responseObj;

            if(evidenceData.result) {
              responseObj = await helperFuncV2.evidenceChartObjectCreation(chartData,evidenceData.data,req.headers["x-auth-token"]);

            } else {
              responseObj = chartData;
            }
          
            responseObj = await helperFuncV2.getCriteriawiseReport(responseObj);

            resolve(responseObj);

          }
        }
      }
        catch(err) {
          let response = {
            result: false,
            message: 'INTERNAL_SERVER_ERROR'
          }
          resolve(response);
        }
    
  });
}


//Funcion for instance observation pdf generation
async function entityPdfReportByCriteria(req, res) {
  
  return new Promise(async function (resolve, reject) {

    let entityRes = await entityCriteriaReportData(req, res);
  
    if (("observationName" in entityRes) == true) {
     
      let resData = await pdfHandlerV2.entityCriteriaPdfReportGeneration(entityRes, storeReportsToS3 = false);

      resData.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl

      resolve(resData);
    }

    else {
      resolve(entityRes);
    }

  });
};


/**
   * @api {post} /dhiti/api/v2/observations/entityScoreReportByCriteria
   * Entity score report by criteria
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "entityId": "",
  "observationId": "",
  "filter":{
     "criteria": []
  }
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "result": true,
       "schoolName": "",
       "totalObservations": "",
       "observationName": "",
       "response" : [{
          "criteriaName": "",
          "criteriaId": "",
          "questionArray": [{
              "order": "",
              "question": "",
              "chart": {
                  "type": "scatter",
                  "title": "",
                  "xAxis": {
                     "title": {
                     "enabled": true,
                     "text": "observations"
                    },
                     "labels": {},
                     "categories": ["Obs1", "Obs2", "Obs3", "Obs4", "Obs5"],
                     "startOnTick": false,
                     "endOnTick": false,
                     "showLastLabel": true
                  },
                  "yAxis": {
                     "min": 0,
                     "max": "",
                     "allowDecimals": false,
                     "title": {
                        "text": "Score"
                     }
                  },
                  "plotOptions":{
                     "scatter":{
                     "lineWidth": 1,
                     "lineColor": "#F6B343"
                     }
                  },
                  "credits": {
                     "enabled": false
                  },
                  "legend": {
                     "enabled": false
                  },
                  "data": [{
                    "color": "#F6B343",
                    "data": []
                  }]
              }
            }]
        }]
*     }
   * @apiUse errorBody
   */

//Controller for Entity Observation Score Report
exports.entityScoreReportByCriteria = async function (req, res) {

  let data = await entityScoreCriteriaReportData(req, res);

  res.send(data);

}

async function entityScoreCriteriaReportData(req, res) {
  
  return new Promise(async function (resolve, reject) {

    try {

    if (!req.body.entityId || !req.body.observationId) {
      let response = {
        result: false,
        message: 'entityId and observationId are required fields'
      }
      resolve(response);
    }

    else {
         
          let bodyParam = gen.utils.getDruidQuery("entity_score_criteria_report_query");

          if (process.env.OBSERVATION_DATASOURCE_NAME) {
            bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
          }

          let entityType = "school";

          if(req.body.entityType){
            entityType = req.body.entityType;
          }

          bodyParam.filter.fields[1].fields[0].dimension = entityType;
          bodyParam.filter.fields[1].fields[0].value = req.body.entityId;
          bodyParam.filter.fields[1].fields[1].value = req.body.observationId;
          bodyParam.filter.fields.push({"type":"not","field":{"type":"selector","dimension":"questionAnswer","value":""}});

           //if filter is given
           if (req.body.filter && req.body.filter.criteria && req.body.filter.criteria.length > 0) {
              bodyParam.filter.fields.push({"type":"in","dimension":"criteriaId","values":req.body.filter.criteria});
           }

          //pass the query as body param and get the resul from druid
          let options = gen.utils.getDruidConnection();
          options.method = "POST";
          options.body = bodyParam;

          let data = await rp(options);

          if (!data.length) {
            resolve({
              "result": false,
              "data": "NO_OBSERVATIONS_MADE_FOR_THE_ENTITY" })
          }

          else {
            let reportType = "criteria";
            let chartData = await helperFuncV2.entityScoreReportChartObjectCreation(data, reportType);

            // send entity name dynamically
            chartData.entityName = data[0].event[entityType + "Name"];

            //Get evidence data from evidence datasource
             let inputObj = {
              entityId : req.body.entityId,
              observationId: req.body.observationId,
              entityType: entityType
            }

            let evidenceData = await getEvidenceData(inputObj);
            let responseObj;

            if(evidenceData.result) {
                responseObj = await helperFuncV2.evidenceChartObjectCreation(chartData,evidenceData.data,req.headers["x-auth-token"]);
            } else {
                responseObj = chartData;
            }

            responseObj = await helperFuncV2.getCriteriawiseReport(responseObj);
            resolve(responseObj);

          }
        }
      }
      catch(err) {
          let response = {
            result: false,
            message: 'INTERNAL_SERVER_ERROR'
          }
          resolve(response);
      }
    })

}


//Entity observation score pdf generation
async function entityScorePdfReportByCriteria(req, res) {
  
  return new Promise(async function (resolve, reject) {

    var entityRes = await entityScoreCriteriaReportData(req, res);

    if (entityRes.result == true) {

      let obj = {
        entityName: entityRes.entityName,
        totalObservations: entityRes.totalObservations
      }

      let resData = await pdfHandlerV2.instanceScoreCriteriaPdfGeneration(entityRes, storeReportsToS3 = false, obj);

      resData.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl

      resolve(resData);
    }

    else {
      resolve(entityRes);
    }

  });

};


/**
   * @api {post} /dhiti/api/v2/observations/observationReportByCriteria
   * Observation report by criteria
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "observationId": "",
  "filter":{
     "criteria": []
  }
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "observationId": "",
       "observationName": "",
       "entityType": "",
       "entityId": "",
       "entityName": "",
       "response": [{
          "criteriaName": "",
          "criteriaId": "",
          "questionArray":[{
             "order": "",
             "question": "",
             "responseType": "",
             "answers": "",
             "chart": {},
             "instanceQuestions": [],
             "evidences":[
                {"url":"", "extension":""},
            ]
          }]
       }]
*     }
   * @apiUse successBody
   * @apiUse errorBody
   */

//Controller for observation report
exports.observationReportByCriteria = async function (req, res) {
  return new Promise(async function (resolve, reject) {
      let data = await observationCriteriaReportData(req, res);
      res.send(data);
  })
}

async function observationCriteriaReportData(req, res) {
  return new Promise(async function (resolve, reject) {
    try {
      if (!req.body.observationId) {
          let response = {
              result: false,
              message: 'observationId is a required field'
          }
          resolve(response);
      }
      else {
              let bodyParam = gen.utils.getDruidQuery("observation_criteria_report_query");

                if (process.env.OBSERVATION_DATASOURCE_NAME) {
                  bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
                }

                bodyParam.filter = {"type": "and", "fields":[{ "type": "selector", "dimension": "observationId", "value": req.body.observationId},
                                   {"type":"not","field":{"type":"selector","dimension":"questionAnswer","value":""}}]};
                

                //if filter is given
                if (req.body.filter && req.body.filter.criteria && req.body.filter.criteria.length > 0) {
                  bodyParam.filter.fields.push({"type": "in", "dimension": "criteriaId", "values": req.body.filter.criteria});
                }

                //pass the query as body param and get the resul from druid
                let options = gen.utils.getDruidConnection();
                options.method = "POST";
                options.body = bodyParam;
                let data = await rp(options);

                  //if no data throw error message
                  if (!data.length) {
                      resolve({
                        "result": false,
                         "data": "NO_ENTITY_WAS_FOUND" })
                  }
                else {
                  let entityId = "";
                  let entityType = "";
                  let reportType = "criteria";
                  let chartData = await helperFuncV2.entityReportChart(data, entityId, entityType, reportType);

                  //Get evidence data from evidence datasource
                  let inputObj = {
                    observationId: req.body.observationId
                  }

                  let evidenceData = await getEvidenceData(inputObj);

                  let responseObj;

                  if (evidenceData.result) {
                    responseObj = await helperFuncV2.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);

                  } else {
                    responseObj = chartData;
                  }
                  
                  responseObj = await helperFuncV2.getCriteriawiseReport(responseObj);
                  resolve(responseObj);

                }
              }
            }
            catch(err) {
              let response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
              }
                resolve(response);
            }
      
  });
}


//Funcion for observation pdf generation
async function observationPdfReportByCriteria(req, res) {
  
  return new Promise(async function (resolve, reject) {

    let observeRes = await observationCriteriaReportData(req, res);
  
    if (("observationName" in observeRes) == true) {
     
      let resData = await pdfHandlerV2.entityCriteriaPdfReportGeneration(observeRes, storeReportsToS3 = false);

      resData.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl

      resolve(resData);
    }

    else {
      resolve(observeRes);
    }

  });
};


/**
   * @api {post} /dhiti/api/v2/observations/observationScoreReportByCriteria
   * Observation score report by criteria
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "observationId": "",
  "filter":{
      "criteria": []
  }
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "result": true,
       "solutionName": "",
       "response": [{
         "criteriaName": "",
         "criteriaId": "",
         "questionArray": [{
            "order": "",
            "question": "",
            "chart": {
               "type": "bar",
               "title": "",
               "xAxis": {
                  "title": {
                     "text": null
                  },
                  "labels": {},
                  "categories": []
                },
                "yAxis": {
                   "min": 0,
                   "max": "",
                   "title": {
                     "text": "Score"
                    },
                   "labels": {
                      "overflow": "justify"
                    },
                   "allowDecimals" : false
                },
                "plotOptions": {
                  "bar": {
                    "dataLabels": {
                        "enabled": true
                    }
                  } 
                },
                "legend": {
                  "enabled" : true
                },
                "credits": {
                  "enabled": false
                },
                "data": [{
                  "name": "observation1",
                  "data": []
                }, {
                  "name": "observation2",
                  "data": []
                }]
            },
            "evidences":[
              {"url":"", "extension":""}
            ]
          }]
        }]
*     }
   * @apiUse errorBody
   */

//Controller for observation Score report  
exports.observationScoreReportByCriteria = async function (req , res){

  let data = await observationScoreCriteriaReportData(req, res);

  res.send(data);

}


async function observationScoreCriteriaReportData(req, res) {

  return new Promise(async function (resolve, reject) {
    
    try {

    if (!req.body.observationId) {
      let response = {
        result: false,
        message: 'observationId is a required fields'
      }
      resolve(response);
    }

    else {

         let bodyParam = gen.utils.getDruidQuery("observation_score_criteria_report_query");

          if (process.env.OBSERVATION_DATASOURCE_NAME) {
            bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
          }

          let entityType = "school";

            if(req.body.entityType){
               entityType = req.body.entityType;
            }
            
            bodyParam.dimensions.push(entityType,entityType + "Name");
            bodyParam.filter.fields[0].value = req.body.observationId;
            bodyParam.filter.fields.push({"type":"not","field":{"type":"selector","dimension":"questionAnswer","value":""}});
  
           //if filter is given
           if (req.body.filter && req.body.filter.criteria && req.body.filter.criteria.length > 0) {
              bodyParam.filter.fields.push({"type":"in","dimension":"criteriaId","values":req.body.filter.criteria});
            }

          //pass the query as body param and get the resul from druid
          let options = gen.utils.getDruidConnection();
          options.method = "POST";
          options.body = bodyParam;

          let data = await rp(options);

          if (!data.length) {
            resolve({
               "result": false, 
               "data": "NO_ENTITIES_FOUND" })
          }

          else {
            let reportType = "criteria";
            let chartData = await helperFuncV2.observationScoreReportChart(data,entityType,reportType);

              //Call samiksha API to get total schools count for the given observationId
              let totalEntities = await  assessmentService.getTotalEntities(req.body.observationId,req.headers["x-auth-token"]);


            if (totalEntities.result && totalEntities.result.count) {
              chartData.totalEntities = totalEntities.result.count;
            }

            //Get evidence data from evidence datasource
            let inputObj = {
              observationId: req.body.observationId
            }

            let evidenceData = await getEvidenceData(inputObj);

            let responseObj;

            if (evidenceData.result) {
              responseObj = await helperFuncV2.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);

            } else {
              responseObj = chartData;
            }
            
            //get criteria wise report
            responseObj = await helperFuncV2.getCriteriawiseReport(responseObj);
            resolve(responseObj);

          }
        }
      }
      catch(err) {
          let response = {
            result: false,
            message: 'INTERNAL_SERVER_ERROR'
          }
          resolve(response);
      }

  })

}


//Observation score pdf generation 
async function observationScorePdfReportByCriteria(req, res) {

  return new Promise(async function (resolve, reject) {

    let observationRes = await observationScoreCriteriaReportData(req, res);

    if (observationRes.result == true) {

      let obj = {
        totalEntities: observationRes.totalEntities,
        entitiesObserved: observationRes.entitiesObserved,
        entityType: observationRes.entityType
      }

      let resData = await pdfHandlerV2.instanceScoreCriteriaPdfGeneration(observationRes, storeReportsToS3 = false, obj);

      resData.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl

      res.send(resData);
    }

    else {
      res.send(observationRes);
    }
  });
};


//Controller function for observation pdf reports
exports.pdfReportsByCriteria = async function (req, res) {

  return new Promise(async function (resolve, reject) {

    if (req.body.submissionId) {

      let resObj = await instancePdfReportByCriteria(req, res);
      res.send(resObj);

    }

    else if (req.body.entityId && req.body.observationId && req.body.entityType) {

      let resObj = await entityPdfReportByCriteria(req, res);
      res.send(resObj);
    }

    else if (req.body.observationId) {

      let resObj = await observationPdfReportByCriteria(req, res);
      res.send(resObj);

    }
    else {
      res.send({
        status: "failure",
        message: "INVALID_INPUT"
      });
    }
  })

}


//Controller function for criteria score pdf reports
exports.scorePdfReportsByCriteria = async function (req, res) {

  return new Promise(async function (resolve, reject) {

    if (req.body.submissionId) {

      let resObj = await instanceScorePdfReprtByCriteria(req, res);
      res.send(resObj);

    }

    else if (req.body.entityId && req.body.observationId && req.body.entityType) {

      let resObj = await entityScorePdfReportByCriteria(req, res);
      res.send(resObj);
    }

    else if (req.body.observationId) {

      let resObj = await observationScorePdfReportByCriteria(req, res);
      res.send(resObj);

    }
    else {
      res.send({
        status: "failure",
        message: "INVALID_INPUT"
      });
    }
  })

}





// Get the evidence data
async function getEvidenceData(inputObj) {

  return new Promise(async function (resolve, reject) {

    try {

      let submissionId = inputObj.submissionId;
      let entityId = inputObj.entity;
      let observationId = inputObj.observationId;
      let entityType = inputObj.entityType;

      // let bodyParam = JSON.parse(result.query);
      let bodyParam = gen.utils.getDruidQuery("get_evidence_query");

      //based on the given input change the filter
      let filter = {};

      if (submissionId) {
        filter = { "type": "selector", "dimension": "observationSubmissionId", "value": submissionId }
      } else if (entityId && observationId) {
        filter = { "type": "and", "fileds": [{ "type": "selector", "dimension": entityType, "value": entityId }, { "type": "selector", "dimension": "observationId", "value": observationId }] }
      } else if (observationId) {
        filter = { "type": "selector", "dimension": "observationId", "value": observationId }
      }

      if (process.env.OBSERVATION_EVIDENCE_DATASOURCE_NAME) {
        bodyParam.dataSource = process.env.OBSERVATION_EVIDENCE_DATASOURCE_NAME;
      }

      bodyParam.filter = filter;

      //pass the query as body param and get the resul from druid
      let options = gen.utils.getDruidConnection();
      options.method = "POST";
      options.body = bodyParam;
      let data = await rp(options);

      if (!data.length) {
        resolve({
          "result": false,
          "data": "EVIDENCE_NOT_FOUND"
        });
      } else {
        resolve({ "result": true, "data": data });
      }

    }
    catch (err) {
      let response = {
        result: false,
        message: "Internal server error"
      };
      resolve(response);
    };
  })
}


module.exports.instanceObservationData = instanceObservationData;
module.exports.entityObservationData = entityObservationData;
module.exports.observationReportData = observationReportData;
