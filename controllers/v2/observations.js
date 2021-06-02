const rp = require('request-promise');
const request = require('request');
const helperFunc = require('../../helper/chart_data');
const assessmentService = require('../../helper/assessment_service');
const pdfHandler =  require('../../helper/common_handler_v2');
const observationsHelper = require('../../helper/observations');

/**
   * @api {post} /dhiti/api/v2/observations/entitySolutionReport 
   * entity solution report
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "entityId": "",
  "entityType": "",
  "solutionId": "",
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "entityName": "",
       "solutionName": "",
       "solutionId": "",
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

    var entityResponse = await observationsHelper.entitySolutionReportGeneration(req, res);

    if (("solutionName" in entityResponse) == true) {

      let pdfReport = await pdfHandler.pdfGeneration(entityResponse);

      resolve(pdfReport);
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

    var entityRes = await observationsHelper.entityScoreReportGenerate(req, res);

    if (entityRes.result == true) {

      let obj = {
        entityName: entityRes.entityName,
        totalObservations: entityRes.totalObservations
      }

      let pdfReport = await pdfHandler.instanceObservationScorePdfGeneration(entityRes, obj);

      resolve(pdfReport);
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

    let instaRes = await observationsHelper.instanceObservationData(req, res);

    if (("observationName" in instaRes) == true) {
      
      let pdfReport = await pdfHandler.instanceObservationPdfGeneration(instaRes);

      resolve(pdfReport);
    
    }
    else {
      resolve(instaRes);
    }
  });
};



//Controller for entity observation pdf generation
async function entityObservationPdf(req, res) {

  return new Promise(async function (resolve, reject) {

    let responseData = await observationsHelper.entityObservationData(req, res);

    if (("observationName" in responseData) == true) {

      let pdfReport = await pdfHandler.pdfGeneration(responseData);

      resolve(pdfReport);
      
    }
    else {
      resolve(responseData);
    }

  });
}

//Controller for observation pdf report
async function observationGenerateReport(req, res) {

  return new Promise(async function (resolve, reject) {

    let responseData = await observationsHelper.observationReportData(req, res);

    if (("observationName" in responseData) == true) {

      let pdfReport = await pdfHandler.pdfGeneration(responseData);
      
      resolve(pdfReport);
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

  let data = await observationsHelper.instanceObservationData(req, res);

  res.send(data);
}


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
       "schoolName" : "",
       "districtName" : "",
       "response": [{
          "order": "",
          "question": "",
          "chart": {
            "type": "pie",
            "data": {
                "labels": ["2 out of 4"],
                "datasets": [{
                    "backgroundColor": [
                        "#6c4fa1",
                    ],
                    "data": [50, 50],
                    "borderColor": 'black',
                }]
            }
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

  let data = await observationsHelper.instanceScoreReport(req, res);

  res.send(data);
}


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

  let data = await observationsHelper.entityObservationData(req, res);

  res.send(data);
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
             "type": 'horizontalBar',
             "data": {
                "labels": ["shiv sai mandir", "ssm public school"],
                "datasets": [
                    {
                        "label": 'observation1',
                        "data": [5, 10],
                        "backgroundColor": '#de8657'
                    },
                    {
                        "label": 'observation2',
                        "data": [3,6],
                        "backgroundColor": '#d9b730'
                    }]
              },
             "options": {
                "scales": {
                    "xAxes": [{
                        "ticks": {
                            "min": 0,
                            "max": 10
                        },

                        "scaleLabel": {
                            "display": true,
                            "labelString": 'Score'
                        }
                    }],
                }
            }
          }
        }]
*     }
   * @apiUse errorBody
   */

//Controller for entity solution score report (cluster/block/zone/district/state)
exports.entitySolutionScoreReport = async function (req, res) {

  return new Promise(async function (resolve, reject) {

    let responseData = await observationsHelper.entitySolutionScoreReportGeneration(req, res);
    res.send(responseData);

  })

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
      let data = await observationsHelper.observationReportData(req, res);
      res.send(data);
  })
}


//COntroller function for observation score pdf reports
exports.observationScorePdfReport = async function (req, res) {

  return new Promise(async function (resolve, reject) {

      if (req.body && req.body.entityId && req.body.observationId) {

          let resObj = await entityObservationScorePdfFunc(req, res);
          res.send(resObj);
      }
      else {
          res.send({
              status: "failure",
              message: "Invalid Input"
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
       "observationName": "",
       "response": [{
         "order": "",
         "question": "",
         "chart": {
            "type": 'horizontalBar',
             "data": {
                "labels": ["shiv sai mandir", "ssm public school"],
                "datasets": [
                    {
                        "label": 'observation1',
                        "data": [5, 10],
                        "backgroundColor": '#de8657'
                    },
                    {
                        "label": 'observation2',
                        "data": [3,6],
                        "backgroundColor": '#d9b730'
                    }]
              },
             "options": {
                "scales": {
                    "xAxes": [{
                        "ticks": {
                            "min": 0,
                            "max": 10
                        },

                        "scaleLabel": {
                            "display": true,
                            "labelString": 'Score'
                        }
                    }],
                }
            }
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

  let data = await observationsHelper.observationScoreReport(req, res);

  res.send(data);

}



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

  let data = await observationsHelper.instanceCriteriaReportData(req, res);

  res.send(data);
}


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
                "type": "pie",
                "data": {
                  "labels": ["2 out of 4"],
                  "datasets": [{
                    "backgroundColor": [
                        "#6c4fa1",
                    ],
                    "data": [50, 50],
                    "borderColor": 'black',
                  }]
                }
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

  let data = await observationsHelper.instanceScoreCriteriaReportData(req, res);

  res.send(data);
}


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

  let data = await observationsHelper.entityCriteriaReportData(req, res);

  res.send(data);
}


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
                "type": 'bar',
                "data": {
                  "labels": [
                    "Obs1",
                    "Obs2",
                    "Obs3",
                    "Obs4",
                    "Obs5"
                  ],
                  "datasets": [
                    {

                        "data": [1,2,3,4,5],
                        "backgroundColor": "#F6B343"
                    }]
                },
                "options": {
                  "legend": false,
                  "scales": {
                    "xAxes": [{
                        "scaleLabel": {
                            "display": true,
                            "labelString": 'observations'
                        }
                    }],
                    "yAxes": [{
                        "ticks": {
                            "min": 0,
                            "max": 5
                        },

                        "scaleLabel": {
                            "display": true,
                            "labelString": 'score'
                        }
                    }],
                  }
                }
              }
            }]
        }]
*     }
   * @apiUse errorBody
   */

//Controller for Entity Observation Score Report
exports.entityScoreReportByCriteria = async function (req, res) {

  let data = await observationsHelper.entityScoreCriteriaReportData(req, res);

  res.send(data);

}

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
      let data = await observationsHelper.observationCriteriaReportData(req, res);
      res.send(data);
  })
}

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
              "type": 'horizontalBar',
             "data": {
                "labels": ["shiv sai mandir", "ssm public school"],
                "datasets": [
                    {
                        "label": 'observation1',
                        "data": [5, 10],
                        "backgroundColor": '#de8657'
                    },
                    {
                        "label": 'observation2',
                        "data": [3,6],
                        "backgroundColor": '#d9b730'
                    }]
              },
             "options": {
                "scales": {
                    "xAxes": [{
                        "ticks": {
                            "min": 0,
                            "max": 10
                        },

                        "scaleLabel": {
                            "display": true,
                            "labelString": 'Score'
                        }
                    }],
                }
            }
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

  let data = await observationsHelper.observationScoreCriteriaReportData(req, res);

  res.send(data);

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
        filter = { "type": "and", "fields": [{ "type": "selector", "dimension": "entity", "value": entityId }, { "type": "selector", "dimension": "observationId", "value": observationId }] }
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