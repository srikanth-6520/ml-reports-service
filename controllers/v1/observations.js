var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var model = require('../../db');
var helperFunc = require('../../helper/chart_data');
var commonCassandraFunc = require('../../common/cassandra_func');
var pdfHandler = require('../../helper/common_handler');
var omit = require('object.omit');
var url = require("url");
var authService = require('../../middleware/authentication_service');
var rimraf = require("rimraf");
var fs = require('fs');
const path = require('path');
let observationController = require('../v2/observations');


/**
   * @api {post} /dhiti/api/v1/observations/instance 
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
         "instanceQuestions":[]
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
  
      if (!req.body.submissionId) {
        var response = {
          result: false,
          message: 'submissionId is a required field'
        };
        resolve(response);
      } else {

        bodyData = req.body;
        var dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(bodyData);
  
        if (dataReportIndexes == undefined) {
          model.MyModel.findOneAsync({ qid: "instance_observation_query" }, { allow_filtering: true })
            .then(async function (result) {
  
              var bodyParam = JSON.parse(result.query);
  
              if (config.druid.observation_datasource_name) {
                bodyParam.dataSource = config.druid.observation_datasource_name;
              }
              

              //if filter is given
              if (req.body.filter) {
                if (req.body.filter.questionId && req.body.filter.questionId.length > 0) {
                  let filter = {};
                  questionFilter = await filterCreate(req.body.filter.questionId);
                  filter = { "type": "and", "fields": [{ "type": "selector", "dimension": "observationSubmissionId", "value": req.body.submissionId }, { "type": "or", "fields": questionFilter }] };
                  bodyParam.filter = filter;
                }
                else {
                  bodyParam.filter.value = req.body.submissionId;
                }
              }
              else {
                bodyParam.filter.value = req.body.submissionId;
              }

              //pass the query as body param and get the resul from druid
              var options = config.druid.options;
              options.method = "POST";
              options.body = bodyParam;
              var data = await rp(options);
  
              if (!data.length) {
                resolve({
                  "data": "SUBMISSION_ID_NOT_FOUND"
                });
              } else {
                var responseObj = await helperFunc.instanceReportChart(data);
                resolve(responseObj);
                commonCassandraFunc.insertReqAndResInCassandra(bodyData, responseObj);
              }
            })
            .catch(function (err) {
              var response = {
                result: false,
                message: 'Data not found'
              };
              resolve(response);
            });
        } else {
          resolve(JSON.parse(dataReportIndexes['apiresponse']));
        }
      }
    });
  };
  
  
//Funcion for instance observation pdf generation
exports.instancePdfReport = async function (req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      let reqData = req.query;
      var dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(reqData);
  
      if (dataReportIndexes && dataReportIndexes.downloadpdfpath) {
  
        dataReportIndexes.downloadpdfpath = dataReportIndexes.downloadpdfpath.replace(/^"(.*)"$/, '$1');
        let signedUlr = await pdfHandler.getSignedUrl(dataReportIndexes.downloadpdfpath);
  
        var response = {
          status: "success",
          message: 'Observation Pdf Generated successfully',
          pdfUrl: signedUlr
        };
  
        resolve(response);
  
      } else {
  
        req.body.submissionId = req.query.submissionId;
  
        var instaRes = await instanceObservationData(req, res);
  
        if (("observationName" in instaRes) == true) {
          let resData = await pdfHandler.instanceObservationPdfGeneration(instaRes);
  
          if (dataReportIndexes) {
            var reqOptions = {
              query: dataReportIndexes.id,
              downloadPath: resData.downloadPath
            }
            commonCassandraFunc.updateInstanceDownloadPath(reqOptions);
          } else {
            let dataInsert = commonCassandraFunc.insertReqAndResInCassandra(reqData, instaRes, resData.downloadPath);
          }
  
          // res.send(resData);
          resolve(omit(resData, 'downloadPath'));
        }
  
        else {
          resolve(instaRes);
        }
      }
    });
  };
  


//<======================== Instance observation score report ========================================>


/**
   * @api {post} /dhiti/api/v1/observations/instanceObservationScoreReport 
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
                  }
                }
            ]
          }
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
  
      if (!req.body.submissionId) {
        var response = {
          result: false,
          message: 'submissionId is a required field'
        };
  
        resolve(response);
  
      } else {
  
        model.MyModel.findOneAsync({ qid: "instance_observation_score_query" }, { allow_filtering: true })
          .then(async function (result) {
  
            var bodyParam = JSON.parse(result.query);
  
            if (config.druid.observation_datasource_name) {
              bodyParam.dataSource = config.druid.observation_datasource_name;
            }
  
            bodyParam.filter.fields[0].value = req.body.submissionId;
  
            //pass the query as body param and get the resul from druid
            var options = config.druid.options;
            options.method = "POST";
            options.body = bodyParam;
            var data = await rp(options);
  
            if (!data.length) {
              resolve({
                "data": "SUBMISSION_ID_NOT_FOUND"
              });
            } else {
  
              var responseObj = await helperFunc.instanceScoreReportChartObjectCreation(data);
              resolve(responseObj);
            }
          })
          .catch(function (err) {
            var response = {
              result: false,
              message: 'Data not found'
            };
            resolve(response);
          });
  
      }
    })
  };
  
  
  
  
//Instance observation score pdf generation
exports.instanceObservationScorePdfFunc = async function (req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      var instaRes = await instanceScoreReport(req, res);
  
      if (instaRes.result == true) {
  
        let obj = {
          totalScore: instaRes.totalScore,
          scoreAchieved: instaRes.scoreAchieved
        }
  
        let resData = await pdfHandler.instanceObservationScorePdfGeneration(instaRes, true, obj);
  
        let hostname = req.headers.host;
  
        resData.pdfUrl = "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
  
        resolve(resData);
      }
  
      else {
        resolve(instaRes);
      }
  
    });
  
  };
  


//======================== Entity observation report API's =======================================

/**
   * @api {post} /dhiti/api/v1/observations/entity 
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
          "instanceQuestions": []
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
  
      if (!req.body.entityId && !req.body.observationId) {
        var response = {
          result: false,
          message: 'entityId and observationId are required fields'
        }
        resolve(response);
      }
      else {
  
        model.MyModel.findOneAsync({ qid: "entity_observation_query" }, { allow_filtering: true })
          .then(async function (result) {
  
            var bodyParam = JSON.parse(result.query);
  
            if (config.druid.observation_datasource_name) {
              bodyParam.dataSource = config.druid.observation_datasource_name;
            }

             //if filter is given
             if (req.body.filter) {
              if (req.body.filter.questionId && req.body.filter.questionId.length > 0) {

                let filter = {};
                questionFilter = await filterCreate(req.body.filter.questionId);
                filter = { "type": "and", "fields": [{"type":"and","fields":[{"type": "selector", "dimension": "school", "value": req.body.entityId },{"type": "selector", "dimension": "observationId", "value": req.body.observationId }]}, { "type": "or", "fields": questionFilter }] };
                bodyParam.filter = filter;
                
              }
              else {
                bodyParam.filter.fields[0].value = req.body.entityId;
                bodyParam.filter.fields[1].value = req.body.observationId;
              }
            }
            else {
              bodyParam.filter.fields[0].value = req.body.entityId;
              bodyParam.filter.fields[1].value = req.body.observationId;
            }
  
            //pass the query as body param and get the resul from druid
            var options = config.druid.options;
            options.method = "POST";
            options.body = bodyParam;
            var data = await rp(options);
  
            if (!data.length) {
              resolve({ "data": "No observations made for the entity" })
            }
            else {
              var responseObj = await helperFunc.entityReportChart(data, req.body.entityId, "school")
              resolve(responseObj);
  
            }
          })
          .catch(function (err) {
            res.status(400);
            var response = {
              result: false,
              message: 'Data not found'
            }
            resolve(response);
          })
      }
    });
  }
  
  
//Controller for entity observation pdf generation
exports.entityObservationPdf = async function (req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      req.body.observationId = req.query.observationId;
      req.body.entityId = req.query.entityId;
  
      let responseData = await entityObservationData(req, res);
  
      if (("observationName" in responseData) == true) {
  
        let resData = await pdfHandler.pdfGeneration(responseData, true);
  
        if (resData.status && resData.status == "success") {
  
          var hostname = req.headers.host;
          var pathname = url.parse(req.url).pathname;
  
          console.log(pathname, "responseData", hostname);
  
          var obj = {
            status: "success",
            message: 'Observation Pdf Generated successfully',
            pdfUrl: "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
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
   * @api {post} /dhiti/api/v1/observations/entityObservationReport 
   * Entity observation report(cluster/zone/district/state)
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "entityId": "",
  "entityType": "",
  "immediateChildEntityType": "",
  "observationId": ""
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "solutionId": "",
       "solutionName": "",
       "entityType": "",
       "entityId": "",
       "entityName": "",
       "response": [{
          "order": "",
          "question": "",
          "responseType": "",
          "answers": "",
          "chart": {},
          "instanceQuestions": []
       }]
*     }
   * @apiUse errorBody
   */

// Controller for entity observation  (cluster/block/zone/district)
exports.entityObservationReport = async function entityObservationReport(req, res) {

    return new Promise(async function (resolve, reject) {
  
      let responseData = await entityObservationReportGeneration(req, res);
      res.send(responseData);
  
    })
  
  };
  
  // Function for entity observation report generation 
  async function entityObservationReportGeneration(req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      if (!req.body.entityId && !req.body.entityType && !req.body.observationId) {
        res.status(400);
        var response = {
          result: false,
          message: 'entityId, entityType, immediateChildEntityType and observationId are required fields'
        }
        resolve(response);
      }
  
      else {

        entityType = req.body.entityType;
        entityId = req.body.entityId;
        immediateChildEntityType = req.body.immediateChildEntityType;
  
        // Fetch query from cassandra
        model.MyModel.findOneAsync({ qid: "entity_observation_report_query" }, { allow_filtering: true })
          .then(async function (result) {
  
            var bodyParam = JSON.parse(result.query);
  
            if (config.druid.observation_datasource_name) {
              bodyParam.dataSource = config.druid.observation_datasource_name;
            }
  
            //Assign values to the query filter object 
            bodyParam.filter.fields[0].dimension = req.body.entityType;
            bodyParam.filter.fields[0].value = req.body.entityId;
            bodyParam.filter.fields[1].value = req.body.observationId;
  
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
            var options = config.druid.options;
            options.method = "POST";
            options.body = bodyParam;
            var data = await rp(options);
  
            if (!data.length) {
              resolve({ "data": "No observations made for the entity" })
            }
            else {
              var responseObj = await helperFunc.entityReportChart(data, req.body.entityId, req.body.entityType)
              resolve(responseObj);
            }
          })
          .catch(function (err) {
            res.status(400);
            var response = {
              result: false,
              message: 'Data not found'
            }
            resolve(response);
          })
  
      }
  
    })
  
  }
  
  
//Function for entity observation report PDF generation
exports.entityObservationReportPdfGeneration = async function (req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      req.body = req.query;
      var entityResponse = await entityObservationReportGeneration(req, res);
  
      if (("observationName" in entityResponse) == true) {
  
        let resData = await pdfHandler.pdfGeneration(entityResponse, true);
        let hostname = req.headers.host;
  
        var responseObject = {
          "status": "success",
          "message": "report generated",
          pdfUrl: "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
        }
        resolve(responseObject);
      }
  
      else {
        resolve(entityResponse);
      }
    });
  
  };
  


//<======================== Entity observation score report ========================================>

/**
   * @api {post} /dhiti/api/v1/observations/entityScoreReport 
   * Entity observation score report
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "entityId": "",
  "observationId": ""
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "result": true,
       "schoolName": "",
       "totalObservations": "",
       "observationName": "",
       "response" : [{
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
                "labels: {},
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
*     }
   * @apiUse errorBody
   */

//Controller for Entity Observation Score Report
exports.entityScoreReport = async function (req, res) {

    let data = await entityScoreReport(req, res);
  
    res.send(data);
  
  }
  
  async function entityScoreReport(req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      if (!req.body.entityId && !req.body.observationId) {
        var response = {
          result: false,
          message: 'entityId and observationId are required fields'
        }
        resolve(response);
      }
  
      else {

        model.MyModel.findOneAsync({ qid: "entity_observation_score_query" }, { allow_filtering: true })
          .then(async function (result) {
  
            var bodyParam = JSON.parse(result.query);
  
            if (config.druid.observation_datasource_name) {
              bodyParam.dataSource = config.druid.observation_datasource_name;
            }
  
            bodyParam.filter.fields[1].fields[0].value = req.body.entityId;
            bodyParam.filter.fields[1].fields[1].value = req.body.observationId;
  
            //pass the query as body param and get the resul from druid
            var options = config.druid.options;
            options.method = "POST";
            options.body = bodyParam;
  
            var data = await rp(options);
  
            if (!data.length) {
              resolve({ "data": "No observations made for the entity" })
            }
  
            else {
  
              var responseObj = await helperFunc.entityScoreReportChartObjectCreation(data, "v1")
              resolve(responseObj);
  
            }
          })
  
          .catch(function (err) {
            var response = {
              result: false,
              message: 'Data not found'
            }
            resolve(response);
          })
  
      }
  
    })
  
  }
  
//Entity observation score pdf generation
exports.entityObservationScorePdfFunc = async function (req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      var entityRes = await entityScoreReport(req, res);
  
      if (entityRes.result == true) {
  
        let obj = {
          schoolName: entityRes.schoolName,
          totalObservations: entityRes.totalObservations
        }
  
        let resData = await pdfHandler.instanceObservationScorePdfGeneration(entityRes, true, obj);
  
        let hostname = req.headers.host;
  
        resData.pdfUrl = "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
  
        resolve(resData);
      }
  
      else {
        resolve(entityRes);
      }
  
    });
  
  };
  

/**
   * @api {post} /dhiti/api/v1/observations/entitySolutionScoreReport 
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
  
      if (!req.body.entityId && !req.body.entityType && !req.body.solutionId) {
        res.status(400);
        var response = {
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

        // Fetch query from cassandra
        model.MyModel.findOneAsync({ qid: "entity_solution_score_query" }, { allow_filtering: true })
          .then(async function (result) {
  
            var bodyParam = JSON.parse(result.query);
  
            if (config.druid.observation_datasource_name) {
              bodyParam.dataSource = config.druid.observation_datasource_name;
            }
  
            //Assign values to the query filter object 
            bodyParam.filter.fields[1].fields[0].dimension = req.body.entityType;
            bodyParam.filter.fields[1].fields[0].value = req.body.entityId;
            bodyParam.filter.fields[1].fields[1].value = req.body.solutionId;
  
            //code for myObservation
            if (req.body.reportType == "my") {
              let createdBy = await getCreatedByField(req, res);
              let filter = { "type": "selector", "dimension": "createdBy", "value": createdBy }
              bodyParam.filter.fields[1].fields.push(filter);
            }
  
            console.log(bodyParam);
  
            //pass the query as body param and get the result from druid
            var options = config.druid.options;
            options.method = "POST";
            options.body = bodyParam;
            var data = await rp(options);
  
            if (!data.length) {
              resolve({ "data": "No observations made for the entity" })
            }
            else {
              var responseObj = await helperFunc.observationScoreReportChart(data)
              responseObj.solutionId = req.body.solutionId;
              resolve(responseObj);
            }
          })
          .catch(function (err) {
            res.status(400);
            var response = {
              result: false,
              message: 'Data not found'
            }
            resolve(response);
          })
  
      }
  
    })
  
  }

  
//School solution score report creation function
async function schoolSolutionScoreReport(req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      model.MyModel.findOneAsync({ qid: "entity_solution_score_query" }, { allow_filtering: true })
        .then(async function (result) {
  
          var bodyParam = JSON.parse(result.query);
  
          if (config.druid.observation_datasource_name) {
            bodyParam.dataSource = config.druid.observation_datasource_name;
          }
  
          //Assign values to the query filter object 
          bodyParam.filter.fields[1].fields[0].dimension = req.body.entityType;
          bodyParam.filter.fields[1].fields[0].value = req.body.entityId;
          bodyParam.filter.fields[1].fields[1].value = req.body.solutionId;
  
          //code for myObservation
          if (req.body.reportType == "my") {
            let createdBy = await getCreatedByField(req, res);
            let filter = { "type": "selector", "dimension": "createdBy", "value": createdBy }
            bodyParam.filter.fields[1].fields.push(filter);
          }
  
          //pass the query as body param and get the resul from druid
          var options = config.druid.options;
          options.method = "POST";
          options.body = bodyParam;
  
          var data = await rp(options);
  
          if (!data.length) {
            resolve({ "data": "No observations made for the entity" })
          }
  
          else {
  
            var responseObj = await helperFunc.entityScoreReportChartObjectCreation(data, "v2")
            delete responseObj.observationName;
            responseObj.solutionName = data[0].event.solutionName;
            resolve(responseObj);
  
          }
        })
  
        .catch(function (err) {
          var response = {
            result: false,
            message: 'Data not found'
          }
          resolve(response);
        })
    })
  
  }

  
//Entity solution score pdf generation
exports.entitySolutionScorePdfFunc = async function (req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      var entityRes = await entitySolutionScoreReportGeneration(req, res);
  
      if (entityRes.result == true) {
  
        let obj = {
          solutionName: entityRes.solutionName
        }
  
        let resData = await pdfHandler.instanceObservationScorePdfGeneration(entityRes, true, obj);
  
        let hostname = req.headers.host;
  
        resData.pdfUrl = "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
  
        resolve(resData);
      }
  
      else {
        resolve(entityRes);
      }
  
    });
  
  };
  

//API for unnati service
exports.byEntity = async function (req, res) {

    if (!req.body && !req.body) {
      res.status(400);
      var response = {
        result: false,
        message: 'entityId and observationId are required fields'
      }
      res.send(response);
    }
    else {
      model.MyModel.findOneAsync({
        qid: "observations_by_entity"
      }, {
          allow_filtering: true
        })
        .then(async function (result) {
  
          if (req.body.search) {
  
            var bodyParam = JSON.parse(result.query);
            if (config.druid.observation_datasource_name) {
              bodyParam.dataSource = config.druid.observation_datasource_name;
            }
            var query = bodyParam;
            var fieldsArray = [];
            var search = "%" + req.body.search + "%";
            var dimension = "";
  
            if (req.body.entityType == "zone") {
              dimension = "zone";
            } else if (req.body.entityType == "block") {
              dimension = "block";
            } else if (req.body.entityType == "hub") {
              dimension = "hub";
            } else if (req.body.entityType == "cluster") {
              dimension = "cluster";
            } else if (req.body.entityType == "distict") {
              dimension = "distict";
            } else if (req.body.entityType == "state") {
              dimension = "state";
            } else {
              dimension = "entityId";
            }
  
            fieldsArray.push({ "type": "selector", "dimension": dimension, "value": req.body.queryId });
            fieldsArray.push({ "type": "like", "dimension": "observationName", "pattern": search });
            query.filter.fields.push(...fieldsArray);
  
            query.filter.type = "and";
            var options = config.druid.options;
            options.method = "POST";
            options.body = query;
            var data = await rp(options);
  
            let observationData = await getObsvByentitys(req, result);
            var arr = [];
  
            await Promise.all(observationData.map(async each => {
              arr.push(each);
            }));
  
            await Promise.all(data.map(async each => {
              if (!arr.includes(each)) {
                arr.push(each);
              }
            }));
  
            res.send(arr);
  
  
          } else {
  
            let observationData = await getObsvByentitys(req, result);
            res.send(observationData);
  
           }
        });
    }
  
  }

  
async function getObsvByentitys(req, result) {
    return new Promise(async function (resolve, reject) {
  
      var bodyParam = JSON.parse(result.query);
      if (config.druid.observation_datasource_name) {
        bodyParam.dataSource = config.druid.observation_datasource_name;
      }
      var query = bodyParam;
      var fieldsArray = [];
  
  
      await Promise.all(req.body.entityIds.map(async ele => {
        let objSelecter = { "type": "selector", "dimension": "entityId", "value": ele };
        fieldsArray.push(objSelecter);
      }
      ));
  
      query.filter.fields.push(...fieldsArray);
      var options = config.druid.options;
      options.method = "POST";
      options.body = query;
      var data = await rp(options);
      resolve(data);
    });
  
  }
  
  
// Function for getting createdBy field from header access token
async function getCreatedByField(req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      let token = await authService.validateToken(req, res);
  
      resolve(token.userId);
  
    })
}


// ============================ Observation report API's =============================>

/**
   * @api {post} /dhiti/api/v1/observations/report
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
          "instanceQuestions": []
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

        if (!req.body.observationId) {
            res.status(400);
            var response = {
                result: false,
                message: 'observationId is a required field'
            }
            resolve(response);
        }
        else {
            
            model.MyModel.findOneAsync({ qid: "observation_report_query" }, { allow_filtering: true })
                .then(async function (result) {

                  var bodyParam = JSON.parse(result.query);
                  if (config.druid.observation_datasource_name) {
                    bodyParam.dataSource = config.druid.observation_datasource_name;
                  }

                  //if filter is given
                  if (req.body.filter) {
                    if (req.body.filter.questionId && req.body.filter.questionId.length > 0) {

                      let filter = {};
                      questionFilter = await filterCreate(req.body.filter.questionId);
                      filter = { "type": "and", "fields": [{ "type": "selector", "dimension": "observationId", "value": req.body.observationId }, { "type": "or", "fields": questionFilter }] };
                      bodyParam.filter = filter;

                    }
                    else {
                      bodyParam.filter.value = req.body.observationId;
                    }
                  }
                  else {
                    bodyParam.filter.value = req.body.observationId;
                  }

                  //pass the query as body param and get the resul from druid
                  var options = config.druid.options;
                  options.method = "POST";
                  options.body = bodyParam;
                  var data = await rp(options);

                    //if no data throw error message
                    if (!data.length) {
                        resolve({ "data": "No entities are observed" })
                    }
                    else {
                        entityId = "";
                        entityType = "";
                        var responseObj = await helperFunc.entityReportChart(data,entityId,entityType)
                        //send the responseObj as API output
                        resolve(responseObj);
                       
                    }
                })
                .catch(function (err) {
                    res.status(400);
                    var response = {
                        result: false,
                        message: 'Data not found'
                    }
                    resolve(response);
                })
        }
    });
}


//Controller for observation pdf report
exports.observationGenerateReport = async function(req, res) {

    return new Promise(async function (resolve, reject) {

        req.body.observationId = req.query.observationId;
        let responseData = await observationReportData(req, res);

        if (("observationName" in responseData) == true) {

            let resData = await pdfHandler.pdfGeneration(responseData, true);

            if (resData.status && resData.status == "success") {
                var hostname = req.headers.host;
                var pathname = url.parse(req.url).pathname;
                console.log(pathname, "responseData", hostname);
                var obj = {
                    status: "success",
                    message: 'Observation Pdf Generated successfully',
                    pdfUrl: "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
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


//<======================== Observation score report ========================================>

/**
   * @api {post} /dhiti/api/v1/observations/scoreReport
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

          }
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
  
      if (!req.body.observationId) {
        var response = {
          result: false,
          message: 'observationId is a required fields'
        }
        resolve(response);
      }
  
      else {
  
        model.MyModel.findOneAsync({ qid: "observation_score_report_query" }, { allow_filtering: true })
          .then(async function (result) {
  
            var bodyParam = JSON.parse(result.query);
  
            if (config.druid.observation_datasource_name) {
              bodyParam.dataSource = config.druid.observation_datasource_name;
            }
  
            bodyParam.filter.fields[0].value = req.body.observationId;
  
            //pass the query as body param and get the resul from druid
            var options = config.druid.options;
            options.method = "POST";
            options.body = bodyParam;
  
            var data = await rp(options);
  
            if (!data.length) {
              resolve({ "data": "No entities found" })
            }
  
            else {

              var responseObj = await helperFunc.observationScoreReportChart(data);

                //Call samiksha API to get total schools count for the given observationId
                let totalSchools = await getTotalSchools(req.body.observationId,req.headers["x-auth-token"]);

                if (totalSchools.result) {
                    responseObj.totalSchools = totalSchools.result.count;
                }
                resolve(responseObj);

            }
          })
  
          .catch(function (err) {
            var response = {
              result: false,
              message: 'Data not found'
            }
            resolve(response);
          })
  
      }
  
    })
  
  }
  

//Function to make a call to samiksha assessment entities list API
async function getTotalSchools(observationId,token) {

    return new Promise(async function(resolve){
    var options = {
      method: "GET",
      json: true,
      headers: {
          "Content-Type": "application/json",
          "X-authenticated-user-token": token
      },
      uri: config.samiksha_api.observation_details_api + observationId
  }
  
    rp(options).then(function(resp){
      return resolve(resp);
  
    }).catch(function(err){
      return resolve(err);
    })
  
  });
}
  
  

//Observation score pdf generation 
exports.observationScorePdfFunc = async function (req, res) {

    return new Promise (async function (resolve,reject){
  
    let observationRes = await observationScoreReport(req, res);
  
    if (observationRes.result == true) {

      let obj = {
          totalSchools : observationRes.totalSchools,
          schoolsObserved : observationRes.schoolsObserved
      }

      let resData = await pdfHandler.instanceObservationScorePdfGeneration(observationRes, true, obj);
  
      let hostname = req.headers.host;
  
      resData.pdfUrl = "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
  
      res.send(resData);
    }
  
    else {
      res.send(observationRes);
    }
  });
};
  

/**
   * @api {post} /dhiti/api/v1/observations/listObservationNames
   * List observation names
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "entityId": "",
  "entityType":""
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "result": true,
       "data": [{
          "observationId": "",
          "observationName": ""
       }]
*     }
   * @apiUse errorBody
   */

//Controller for listing observation Names
exports.listObservationNames = async function (req, res) {
    if (!req.body.entityId || !req.body.entityType) {
        res.status(400);
        var response = {
            result: false,
            message: 'entityId,entityType are required fields'
        }
        res.send(response);
    }
    else {

        //get quey from cassandra
        model.MyModel.findOneAsync({ qid: "list_observation_names_query" }, { allow_filtering: true })
            .then(async function (result) {

                var bodyParam = JSON.parse(result.query);

                if (config.druid.observation_datasource_name) {
                    bodyParam.dataSource = config.druid.observation_datasource_name;
                }

                bodyParam.filter.dimension = req.body.entityType;
                bodyParam.filter.value = req.body.entityId;

                //pass the query as body param and get the result from druid
                var options = config.druid.options;
                options.method = "POST";
                options.body = bodyParam;
                var data = await rp(options);

                if (!data.length) {
                    res.send({ "result": false, "data": [] })
                }
                else {

                    //call the function listObservationNamesObjectCreate to create response object
                    var responseObj = await helperFunc.listObservationNamesObjectCreate(data);
                    res.send({ "result": true, "data": responseObj });
                }
            })
            .catch(function (err) {
                res.status(400);
                var response = {
                    result: false,
                    message: 'Data not found'
                }
                res.send(response);
            })
    }
}



/**
   * @api {post} /dhiti/api/v1/observations/listObservationSolutions 
   * List observation solutions
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "entityId": "",
  "entityType": "",
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "result": true,
       "data": [{
          "solutionId": "",
          "solutionName": "",
          "scoring": ""
       }]
*     }
   * @apiUse errorBody
   */

//Controller for listing solution Names
exports.listObservationSolutions = async function (req, res) {
    if (!req.body.entityId || !req.body.entityType) {
        res.status(400);
        var response = {
            result: false,
            message: 'entityId,entityType are required fields'
        }
        res.send(response);
    }
    else {

        //get query from cassandra
        model.MyModel.findOneAsync({ qid: "list_observation_solutions_query" }, { allow_filtering: true })
            .then(async function (result) {
                var bodyParam = JSON.parse(result.query);
                if (config.druid.observation_datasource_name) {
                    bodyParam.dataSource = config.druid.observation_datasource_name;
                }

                bodyParam.filter.dimension = req.body.entityType;
                bodyParam.filter.value = req.body.entityId;

                //pass the query as body param and get the result from druid
                var options = config.druid.options;
                options.method = "POST";
                options.body = bodyParam;
                var data = await rp(options);

                if (!data.length) {
                    res.send({ "result": false, "data": [] })
                }
                else {
                    //call the function listObservationNamesObjectCreate to create response object
                    var responseObj = await helperFunc.listSolutionNamesObjectCreate(data);
                    res.send({ "result": true, "data": responseObj });
                }
            })
            .catch(function (err) {
                res.status(400);
                var response = {
                    result: false,
                    message: 'Data not found'
                }
                res.send(response);
            })
    }
}



/**
   * @api {post} /dhiti/api/v1/observations/submissionsCount 
   * Observations submission count
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
       "data": {
         "noOfSubmissions": ""
       }
*     }
   * @apiUse errorBody
   */

//Controller for listing observation Names
exports.submissionsCount = async function (req, res) {
    if (!req.body.entityId && !req.body.observationId) {
        res.status(400);
        var response = {
            result: false,
            message: 'entityId and observationId are required fields'
        }
        res.send(response);
    } else if(!req.body.observationId) {
        res.status(400);
        var response = {
            result: false,
            message: 'observationId is a required fields'
        }
        res.send(response);
    }
    else {

        let query = "";
        if(req.body.entityId && req.body.observationId){
            query = "entity_observation_query";
        }
        else if (req.body.observationId){
            query = "observation_report_query";
        }

        //get quey from cassandra
        model.MyModel.findOneAsync({ qid: query }, { allow_filtering: true })

            .then(async function (result) {

                var bodyParam = JSON.parse(result.query);

                if (config.druid.observation_datasource_name) {
                    bodyParam.dataSource = config.druid.observation_datasource_name;
                }

                if(query == "entity_observation_query"){

                    bodyParam.filter.fields[0].value = req.body.entityId;
                    bodyParam.filter.fields[1].value = req.body.observationId;

                } else if(query == "observation_report_query"){
                    
                    bodyParam.filter.value = req.body.observationId;
                }

                //pass the query as body param and get the result from druid
                var options = config.druid.options;
                options.method = "POST";
                options.body = bodyParam;
                var data = await rp(options);

                if (!data.length) {
                    res.send({ "result": false, "data": {"noOfSubmissions" : 0} })
                }
                else {

                    var noOfSubmissions = await countNumberOfSubmissions(data);
                    res.send({ "result": true, "data": { "noOfSubmissions" : noOfSubmissions} });
                }
            })
            .catch(function (err) {
                res.status(400);
                var response = {
                    result: false,
                    message: 'Data not found'
                }
                res.send(response);
            })
    }
}


async function countNumberOfSubmissions(data){

    let noOfSubmissions = [];

    await Promise.all(data.map(element => {

        if(!noOfSubmissions.includes(element.event.observationSubmissionId)){
             
            noOfSubmissions.push(element.event.observationSubmissionId);
        }


    }))

    return noOfSubmissions.length;
}


//=========================> Observation pdf API ===============

//Controller function for observation pdf reports
exports.pdfReports = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        if (req.query.entityId && req.query.entityType && req.query.observationId) {

            let resObj = await entityObservationReportPdfGeneration(req, res);
            res.send(resObj);
        }
        else if (req.query.observationId && req.query.entityId) {

            let resObj = await entityObservationPdf(req, res);
            res.send(resObj);
        }
        else if (req.query.submissionId) {

            let resObj = await instancePdfReport(req, res);
            res.send(resObj);

        } 
        else if (req.query.observationId) {

            let resObj = await observationGenerateReport(req, res);
            res.send(resObj);

        }
        else if (req.query.entityId && req.query.entityType && req.query.solutionId) {

            let resObj = await observationController.entitySolutionReportPdfGeneration(req, res);
            res.send(resObj);
        }
        else if (req.query.entityId && req.query.entityType && req.query.solutionId && req.query.reportType) {

            let resObj = await observationController.entitySolutionReportPdfGeneration(req, res);
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

            let resObj = await entityController.entitySolutionScorePdfFunc(req, res);
            res.send(resObj);

        }
        else if (req.body && req.body.solutionId && req.body.entityId && req.body.entityType && req.body.reportType) {

            let resObj = await entityController.entitySolutionScorePdfFunc(req, res);
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


//COntroller function to get the pdf report from tmp folder and then delete the folder from local storage
exports.pdfReportsUrl = async function (req, response) {

    try {

    var folderPath = Buffer.from(req.query.id, 'base64').toString('ascii')
    console.log(folderPath, "req", __dirname + '../' + req.query.id);
    fs.readFile(__dirname + '/../../' + folderPath + '/pdfReport.pdf', function (err, data) {
        if (!err) {

           
            response.writeHead(200, { 'Content-Type': 'application/pdf' });
            response.write(data);


            try{
                fs.readdir(__dirname + '/../../' + folderPath, (err, files) => {
                    if (err) throw err;
  
                    var i = 0;
                    for (const file of files) {
                        i = i +1;
                        fs.unlink(path.join(__dirname + '/../../' + folderPath, file), err => {
                            if (err) throw err;
                        });
                        
                    }
                });
                rimraf(__dirname + '/../../' + folderPath, function () { console.log("done"); });
    
            }catch(exp){

                console.log("error",exp)

            }
            response.end();
          
        } else {
            response.send("File Not Found");
            console.log(err);
        }

    });

   } catch(error){
       console.log(error);
   }
};



/**
   * @api {post} /dhiti/api/v1/observations/entitySolutionReport 
   * Entity solution report
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "entityId": "",
  "entityType": "",
  "immediateChildEntityType": "",
  "solutionId": ""
* }
    * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "solutionId": "",
       "solutionName": "",
       "entityType": "",
       "entityId": "",
       "entityName": "",
       "response": [{
          "order": "",
          "question": "",
          "responseType": "",
          "answers": "",
          "chart": {},
          "instanceQuestions": []
       }]
*     }
   * @apiUse errorBody
   */

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

    if (!req.body.entityId && !req.body.entityType && !req.body.solutionId) {
      var response = {
        result: false,
        message: 'entityId, entityType, immediateChildEntityType and solutionId are required fields'
      }
      resolve(response);
    }

    else {
      
      entityType = req.body.entityType;
      entityId = req.body.entityId;
      immediateChildEntityType = req.body.immediateChildEntityType;

      // Fetch query from cassandra
      model.MyModel.findOneAsync({ qid: "entity_solution_report_query" }, { allow_filtering: true })
        .then(async function (result) {

          var bodyParam = JSON.parse(result.query);

          if (config.druid.observation_datasource_name) {
            bodyParam.dataSource = config.druid.observation_datasource_name;
          }
          
          //Assign values to the query filter object 
          bodyParam.filter.fields[0].dimension = req.body.entityType;
          bodyParam.filter.fields[0].value = req.body.entityId;
          bodyParam.filter.fields[1].value = req.body.solutionId;

          if(req.body.reportType == "my"){
            let createdBy = await getCreatedByField(req,res); 
            let filter = {"type":"selector","dimension":"createdBy","value":createdBy}
            bodyParam.filter.fields.push(filter);
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
          var options = config.druid.options;
          options.method = "POST";
          options.body = bodyParam;
          var data = await rp(options);

          if (!data.length) {
            resolve({ "data": "No observations made for the entity" })
          }
          else {
            var responseObj = await helperFunc.entityReportChart(data,req.body.entityId,req.body.entityType)
            resolve(responseObj);
          }
        })
        .catch(function (err) {
          res.status(500);
          var response = {
            result: false,
            message: 'Data not found'
          }
          resolve(response);
        })

    }

  })

}

// Function for preparing filter
async function filterCreate(questions) {
  let fieldsArray = [];

  await Promise.all(questions.map(element => {
    let filterObj = { "type": "selector", "dimension": "questionExternalId", "value": element };
    fieldsArray.push(filterObj);
  }))
  
  return fieldsArray;
}