const config = require('../../config/config');
const rp = require('request-promise');
const request = require('request');
const model = require('../../db');
const helperFunc = require('../../helper/chart_data');
const commonCassandraFunc = require('../../common/cassandra_func');
const pdfHandler = require('../../helper/common_handler');
const omit = require('object.omit');
const url = require("url");
const rimraf = require("rimraf");
const fs = require('fs');
const path = require('path');
const kendraService = require('../../helper/kendra_service');
const assessmentService = require('../../helper/assessment_service');
const storePdfReportsToS3 = (!config.store_pdf_reports_in_s3_on_off || config.store_pdf_reports_in_s3_on_off != "OFF") ? "ON" : "OFF"
const filesHelper = require('../../common/files_helper');


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
  
      if (!req.body.submissionId) {
        let response = {
          result: false,
          message: 'submissionId is a required field'
        };
        resolve(response);
      } else {
        let submissionId = req.body.submissionId;
        bodyData = req.body;
        let dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(bodyData);
  
       if (dataReportIndexes == undefined) {
          model.MyModel.findOneAsync({ qid: "instance_observation_query" }, { allow_filtering: true })
            .then(async function (result) {

              let bodyParam = JSON.parse(result.query);

              if (config.druid.observation_datasource_name) {
                bodyParam.dataSource = config.druid.observation_datasource_name;
              }

              bodyParam.filter.fields[0].value = submissionId;

              //if filter is given
              if (req.body.filter && req.body.filter.questionId && req.body.filter.questionId.length > 0 ) {
                  let filter = {"type": "in","dimension":"questionExternalId","values": req.body.filter.questionId};
                  bodyParam.filter.fields.push(filter);
              }
                else {
                  let filter = {"type":"not","field":{"type":"selector","dimension":"questionAnswer","value":""}};
                  bodyParam.filter.fields.push(filter);
              }
             
              //pass the query as body param and get the resul from druid
              var options = config.druid.options;
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
               
                let chartData = await helperFunc.instanceReportChart(data);

                //Get evidence data from evidence datasource
                 let inputObj = {
                  submissionId : submissionId
                }

                let evidenceData = await getEvidenceData(inputObj);
                let responseObj;

                if(evidenceData.result) {
                    responseObj = await helperFunc.evidenceChartObjectCreation(chartData,evidenceData.data,req.headers["x-auth-token"]);
                } else {
                    responseObj = chartData;
                }

                resolve(responseObj);
                commonCassandraFunc.insertReqAndResInCassandra(bodyData, responseObj);
              }
            })
            .catch(function (err) {
              let response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
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
async function instancePdfReport(req, res) {

  return new Promise(async function (resolve, reject) {

    let reqData = req.query;
    let dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(reqData);

    if (dataReportIndexes && dataReportIndexes.downloadpdfpath) {

      dataReportIndexes.downloadpdfpath = dataReportIndexes.downloadpdfpath.replace(/^"(.*)"$/, '$1');
      let signedUlr = await pdfHandler.getSignedUrl(dataReportIndexes.downloadpdfpath);

      let response = {
        status: "success",
        message: 'Observation Pdf Generated successfully',
        pdfUrl: signedUlr
      };

      resolve(response);

    } else {

      req.body.submissionId = req.query.submissionId;

      var instaRes = await instanceObservationData(req, res);

      if (("observationName" in instaRes) == true) {

        let storeReportsToS3 = false;
        if (storePdfReportsToS3 == "ON") {
          storeReportsToS3 = true;
        }
        let resData = await pdfHandler.instanceObservationPdfGeneration(instaRes, storeReportsToS3);

        if (storeReportsToS3 == false) {

          resData.pdfUrl = config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
          resolve(resData);

        }
        else {

          if (dataReportIndexes) {
            let reqOptions = {
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
      }
      else {
        resolve(instaRes);
      }
    }
  });
};
  

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
  
      if (!req.body.submissionId) {
        let response = {
          result: false,
          message: 'submissionId is a required field'
        };
  
        resolve(response);
  
      } else {
  
        model.MyModel.findOneAsync({ qid: "instance_observation_score_query" }, { allow_filtering: true })
          .then(async function (result) {
  
            let bodyParam = JSON.parse(result.query);
  
            if (config.druid.observation_datasource_name) {
              bodyParam.dataSource = config.druid.observation_datasource_name;
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
            let options = config.druid.options;
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

              let chartData = await helperFunc.instanceScoreReportChartObjectCreation(data);

              //Get evidence data from evidence datasource
              let inputObj = {
                submissionId : req.body.submissionId
              }

              let evidenceData = await getEvidenceData(inputObj);
              
              let responseObj;

              if(evidenceData.result) {
                responseObj = await helperFunc.evidenceChartObjectCreation(chartData,evidenceData.data,req.headers["x-auth-token"]);

              } else {
                responseObj = chartData;
              }
              resolve(responseObj);
            }
          })
          .catch(function (err) {
            let response = {
              result: false,
              message: 'Data not found'
            };
            resolve(response);
          });
  
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
       
        let resData = await pdfHandler.instanceObservationScorePdfGeneration(instaRes, storeReportsToS3 = false, obj);
         
        resData.pdfUrl = config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
        resolve(resData);

        }
      else {
        resolve(instaRes);
      }

     
  
    });
  
  };
  

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
  
      if (!req.body.entityId && !req.body.observationId) {
        let response = {
          result: false,
          message: 'entityId and observationId are required fields'
        }
        resolve(response);
      }
      else {
  
        model.MyModel.findOneAsync({ qid: "entity_observation_query" }, { allow_filtering: true })
          .then(async function (result) {
  
            let bodyParam = JSON.parse(result.query);
  
            if (config.druid.observation_datasource_name) {
              bodyParam.dataSource = config.druid.observation_datasource_name;
            }

            let entityType = "school";
            
            if(req.body.entityType){
              entityType = req.body.entityType;
            }

            bodyParam.filter.fields[0].dimension = entityType;
            bodyParam.filter.fields[0].value = req.body.entityId;
            bodyParam.filter.fields[1].value = req.body.observationId;

             //if filter is given
             if (req.body.filter && req.body.filter.questionId && req.body.filter.questionId.length > 0) {
                let filter = { "type": "in","dimension":"questionExternalId","values":req.body.filter.questionId };
                bodyParam.filter.fields.push(filter);
             }
             else {
                let filter = {"type":"not","field":{"type":"selector","dimension":"questionAnswer","value":""}};
                bodyParam.filter.fields.push(filter);
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

              let chartData = await helperFunc.entityReportChart(data, req.body.entityId, "school")

               //Get evidence data from evidence datasource
               let inputObj = {
                entityId : req.body.entityId,
                observationId : req.body.observationId,
                entityType : entityType
              }

              let evidenceData = await getEvidenceData(inputObj);
              
              let responseObj;

              if(evidenceData.result) {
                responseObj = await helperFunc.evidenceChartObjectCreation(chartData,evidenceData.data,req.headers["x-auth-token"]);

              } else {
                responseObj = chartData;
              }
            
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
async function entityObservationPdf(req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      req.body.observationId = req.query.observationId;
      req.body.entityId = req.query.entityId;
  
      let responseData = await entityObservationData(req, res);
  
      if (("observationName" in responseData) == true) {

        let resData = await pdfHandler.pdfGeneration(responseData, storeReportsToS3 = false);
  
        if (resData.status && resData.status == "success") {
  
          
          var pathname = url.parse(req.url).pathname;
          
          var obj = {
            status: "success",
            message: 'Observation Pdf Generated successfully',
            pdfUrl: config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
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
async function entityObservationReportPdfGeneration(req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      req.body = req.query;
      var entityResponse = await entityObservationReportGeneration(req, res);
  
      if (("observationName" in entityResponse) == true) {

        let resData = await pdfHandler.pdfGeneration(entityResponse, storeReportsToS3 = false);
  
        var responseObject = {
          "status": "success",
          "message": "report generated",
          pdfUrl: config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
        }
        resolve(responseObject);
      }
  
      else {
        resolve(entityResponse);
      }
    });
  
  };
  

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
  
              let responseObj = await helperFunc.entityScoreReportChartObjectCreation(data, "v1");

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
async function entityObservationScorePdfFunc(req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      var entityRes = await entityScoreReport(req, res);
  
      if (entityRes.result == true) {
  
        let obj = {
          schoolName: entityRes.schoolName,
          totalObservations: entityRes.totalObservations
        }
        
        let resData = await pdfHandler.instanceObservationScorePdfGeneration(entityRes, storeReportsToS3 = false, obj);
  
        resData.pdfUrl = config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
  
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
  
          let bodyParam = JSON.parse(result.query);
  
          if (config.druid.observation_datasource_name) {
            bodyParam.dataSource = config.druid.observation_datasource_name;
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
          let options = config.druid.options;
          options.method = "POST";
          options.body = bodyParam;
  
          let data = await rp(options);
  
          if (!data.length) {
            resolve({ "data": "No observations made for the entity" })
          }
  
          else {
  
            let responseObj = await helperFunc.entityScoreReportChartObjectCreation(data, "v2")
            delete responseObj.observationName;
            responseObj.solutionName = data[0].event.solutionName;
            resolve(responseObj);
  
          }
        })
  
        .catch(function (err) {
          let response = {
            result: false,
            message: 'Data not found'
          }
          resolve(response);
        })
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

        let resData = await pdfHandler.instanceObservationScorePdfGeneration(entityRes, storeReportsToS3 = false, obj);
  
        resData.pdfUrl = config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
  
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

                  bodyParam.filter.fields[0].value = req.body.observationId;

                  //if filter is given
                  if (req.body.filter && req.body.filter.questionId && req.body.filter.questionId.length > 0) {
                      let filter = { "type": "in","dimension":"questionExternalId","values":req.body.filter.questionId};
                      bodyParam.filter.fields.push(filter);
                  }
                    else {
                      let filter = {"type":"not","field":{"type":"selector","dimension":"questionAnswer","value":""}};
                      bodyParam.filter.fields.push(filter);
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

                    let chartData = await helperFunc.entityReportChart(data, entityId, entityType);

                    //Get evidence data from evidence datasource
                    let inputObj = {
                      observationId: req.body.observationId
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
async function observationGenerateReport(req, res) {

  return new Promise(async function (resolve, reject) {

    req.body.observationId = req.query.observationId;
    let responseData = await observationReportData(req, res);

    if (("observationName" in responseData) == true) {

      let resData = await pdfHandler.pdfGeneration(responseData, storeReportsToS3 = false);

      if (resData.status && resData.status == "success") {
        
        var obj = {
          status: "success",
          message: 'Observation Pdf Generated successfully',
          pdfUrl: config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
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
            var options = config.druid.options;
            options.method = "POST";
            options.body = bodyParam;
  
            var data = await rp(options);
  
            if (!data.length) {
              resolve({ "data": "No entities found" })
            }
  
            else {

              let chartData = await helperFunc.observationScoreReportChart(data,entityType);

                //Call samiksha API to get total schools count for the given observationId
                let totalEntities = await getTotalEntities(req.body.observationId,req.headers["x-auth-token"]);

              if (totalEntities.result) {
                chartData.totalEntities = totalEntities.result.count;
              }

              //Get evidence data from evidence datasource
              let inputObj = {
                observationId: req.body.observationId
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
async function getTotalEntities(observationId,token) {

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
async function observationScorePdfFunc(req, res) {

    return new Promise (async function (resolve,reject){
  
    let observationRes = await observationScoreReport(req, res);
  
    if (observationRes.result == true) {

      let obj = {
        totalEntities : observationRes.totalEntities,
        entitiesObserved : observationRes.entitiesObserved,
        entityType: observationRes.entityType
      }

      let resData = await pdfHandler.instanceObservationScorePdfGeneration(observationRes, storeReportsToS3 = false, obj);
  
      resData.pdfUrl = config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
  
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
        let response = {
            result: false,
            message: 'entityId,entityType are required fields'
        }
        res.send(response);
    }
    else {

        //get quey from cassandra
        model.MyModel.findOneAsync({ qid: "list_observation_names_query" }, { allow_filtering: true })
            .then(async function (result) {

                let bodyParam = JSON.parse(result.query);

                if (config.druid.observation_datasource_name) {
                    bodyParam.dataSource = config.druid.observation_datasource_name;
                }
                
                bodyParam.filter.fields[0].dimension = req.body.entityType;
                bodyParam.filter.fields[0].value = req.body.entityId;
                bodyParam.filter.fields[1].fields[0].fields[0].value = req.userDetails.userId;

                //pass the query as body param and get the result from druid
                let options = config.druid.options;
                options.method = "POST";
                options.body = bodyParam;
                let data = await rp(options);

                if (!data.length) {
                    res.send({ "result": false, "data": [] })
                }
                else {

                    //call the function listObservationNamesObjectCreate to create response object
                    let responseObj = await helperFunc.listObservationNamesObjectCreate(data);
                    res.send({ "result": true, "data": responseObj });
                }
            })
            .catch(function (err) {
                res.status(400);
                let response = {
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
        model.MyModel.findOneAsync({ qid: "solutions_list_query" }, { allow_filtering: true })
            .then(async function (result) {

                let bodyParam = JSON.parse(result.query);

                if (config.druid.observation_datasource_name) {
                    bodyParam.dataSource = config.druid.observation_datasource_name;
                }

                bodyParam.filter.fields[0].dimension = req.body.entityType;
                bodyParam.filter.fields[0].value = req.body.entityId;
                bodyParam.filter.fields[1].fields[0].fields[0].value = req.userDetails.userId;

                //pass the query as body param and get the result from druid
                let options = config.druid.options;
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
            })
            .catch(function (err) {
                let response = {
                    result: false,
                    message: 'INTERNAL_SERVER_ERROR'
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

            let resObj = await entitySolutionReportPdfGeneration(req, res);
            res.send(resObj);
        }
        else if (req.query.entityId && req.query.entityType && req.query.solutionId && req.query.reportType) {

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


//COntroller function to get the pdf report from tmp folder and then delete the folder from local storage
exports.pdfReportsUrl = async function (req, response) {

    try {

    var folderPath = Buffer.from(req.query.id, 'base64').toString('ascii')
   
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

                

            }
            response.end();
          
        } else {
            response.send("File Not Found");
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

           //if programId is given
           if (req.body.programId) {
            let programFilter = { "type": "selector", "dimension": "programId", "value": req.body.programId };
            bodyParam.filter.fields.push(programFilter);
          }

          if(req.body.reportType == "my"){ 
            let filter = {"type":"or","fields":[{"type":"and","fields":[{"type":"selector","dimension":"createdBy","value": req.userDetails.userId},
                           {"type":"selector","dimension":"isAPrivateProgram","value":true}]},
                           {"type":"and","fields":[{"type":"selector","dimension":"createdBy","value": req.userDetails.userId},
                           {"type":"selector","dimension":"isAPrivateProgram","value":false}]}]};
            bodyParam.filter.fields.push(filter);
          }
          else {
            let filter = {"type": "or","fields":[{"type":"and","fields":[{"type":"selector","dimension":"createdBy","value": req.userDetails.userId},
                         {"type":"selector","dimension":"isAPrivateProgram","value":true}]},
                         {"type":"selector","dimension":"isAPrivateProgram","value":false}]};

            bodyParam.filter.fields.push(filter);
          }
          
          // filter out not answered questions
          bodyParam.filter.fields.push({"type":"not","field":{"type":"selector","dimension":"questionAnswer","value":""}});

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

//Function for entity solution report PDF generation
exports.entitySolutionReportPdfGeneration = async function (req, res) {

  return new Promise (async function (resolve,reject){

    req.body = req.query;
    var entityResponse = await entitySolutionReportGeneration(req, res);

    if (("solutionName" in entityResponse) == true) {

      let obj = {
        solutionName: entityResponse.solutionName
      }
      
      let resData = await pdfHandler.pdfGeneration(entityResponse, storeReportsToS3 = false, obj);

      var responseObject = {
        "status": "success",
        "message": "report generated",
        pdfUrl: config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
      }
      resolve(responseObject);
    }

    else {
      resolve(entityResponse);
    }
  });
  
};


/**
   * @api {post} /dhiti/api/v1/observations/instanceReportByCriteria
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

      if (!req.body.submissionId) {
          let response = {
              result: false,
              message: 'submissionId is a required field'
          };
          resolve(response);
      } else {

          let submissionId = req.body.submissionId;

          model.MyModel.findOneAsync({ qid: "instance_criteria_report_query" }, { allow_filtering: true })
              .then(async function (result) {

                  let bodyParam = JSON.parse(result.query);

                  if (config.druid.observation_datasource_name) {
                      bodyParam.dataSource = config.druid.observation_datasource_name;
                  }

                  bodyParam.filter = {"type":"and","fields":[{ "type": "selector", "dimension": "observationSubmissionId", "value": submissionId },
                                     {"type":"not","field":{"type":"selector","dimension":"questionAnswer","value":""}}]};

                  //if filter is given
                  if (req.body.filter && req.body.filter.criteria && req.body.filter.criteria.length > 0) {
                    bodyParam.filter.fields.push({"type": "in", "dimension":"criteriaId","values":req.body.filter.criteria});
                  }

                  //pass the query as body param and get the resul from druid
                  let options = config.druid.options;
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
                      let chartData = await helperFunc.instanceReportChart(data, reportType);

                      //Get evidence data from evidence datasource
                      let inputObj = {
                          submissionId: submissionId
                      }

                      let evidenceData = await getEvidenceData(inputObj);
                      let responseObj;

                      if (evidenceData.result) {
                          responseObj = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
                      } else {
                          responseObj = chartData;
                      }

                      responseObj = await helperFunc.getCriteriawiseReport(responseObj);

                      resolve(responseObj);

                  }
              })
              .catch(function (err) {
                  let response = {
                      result: false,
                      message: 'INTERNAL_SERVER_ERROR'
                  };
                  resolve(response);
              });
      }
  });
};



//Funcion for instance observation pdf generation
async function instancePdfReportByCriteria(req, res) {

return new Promise(async function (resolve, reject) {

  let instaRes = await instanceCriteriaReportData(req, res);

  if (("observationName" in instaRes) == true) {

    let resData = await pdfHandler.instanceCriteriaReportPdfGeneration(instaRes, storeReportsToS3 = false);
    
    resData.pdfUrl = config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
    resolve(resData);
  }
  else {
    resolve(instaRes);
  }

});
};



/**
   * @api {post} /dhiti/api/v1/observations/instanceScoreReportByCriteria
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

    if (!req.body.submissionId) {
      let response = {
        result: false,
        message: 'submissionId is a required field'
      };

      resolve(response);

    } else {

      model.MyModel.findOneAsync({ qid: "instance_score_criteria_report_query" }, { allow_filtering: true })
        .then(async function (result) {

          let bodyParam = JSON.parse(result.query);

          if (config.druid.observation_datasource_name) {
            bodyParam.dataSource = config.druid.observation_datasource_name;
          }
          
          bodyParam.filter.fields[0].value = req.body.submissionId;
          bodyParam.filter.fields.push({"type":"not","field":{"type":"selector","dimension":"questionAnswer","value":""}});

           //if filter is given
           if (req.body.filter && req.body.filter.criteria && req.body.filter.criteria.length > 0) {
              bodyParam.filter.fields.push({"type":"in","dimension":"criteriaId","values":req.body.filter.criteria});
           }
      
          //pass the query as body param and get the resul from druid
          let options = config.druid.options;
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
            let chartData = await helperFunc.instanceScoreReportChartObjectCreation(data,reportType);

            //Get evidence data from evidence datasource
            let inputObj = {
              submissionId : req.body.submissionId
            }

            let evidenceData = await getEvidenceData(inputObj);
            
            let responseObj;

            if(evidenceData.result) {
              responseObj = await helperFunc.evidenceChartObjectCreation(chartData,evidenceData.data,req.headers["x-auth-token"]);

            } else {
              responseObj = chartData;
            }
            
            // get criteria wise report
            responseObj = await helperFunc.getCriteriawiseReport(responseObj);

            resolve(responseObj);
          }
        })
        .catch(function (err) {
          let response = {
            result: false,
            message: 'INTERNAL_SERVER_ERROR'
          };
          resolve(response);
        });
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

    let resData = await pdfHandler.instanceScoreCriteriaPdfGeneration(instaRes, storeReportsToS3 = false, obj);
    
       resData.pdfUrl = config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
       resolve(resData);
  
  }

  else {
    resolve(instaRes);
  }

});

};



/**
   * @api {post} /dhiti/api/v1/observations/entityReportByCriteria
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

    if (!req.body.entityId && !req.body.observationId) {
      let response = {
        result: false,
        message: 'entityId and observationId are required fields'
      }
      resolve(response);
    }
    else {

      model.MyModel.findOneAsync({ qid: "entity_criteria_report_query" }, { allow_filtering: true })
        .then(async function (result) {

          let bodyParam = JSON.parse(result.query);

          if (config.druid.observation_datasource_name) {
            bodyParam.dataSource = config.druid.observation_datasource_name;
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
          let options = config.druid.options;
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
            let chartData = await helperFunc.entityReportChart(data, req.body.entityId, "school",reportType)

             //Get evidence data from evidence datasource
             let inputObj = {
              entityId : req.body.entityId,
              observationId : req.body.observationId,
              entityType: entityType
            }

            let evidenceData = await getEvidenceData(inputObj);
            
            let responseObj;

            if(evidenceData.result) {
              responseObj = await helperFunc.evidenceChartObjectCreation(chartData,evidenceData.data,req.headers["x-auth-token"]);

            } else {
              responseObj = chartData;
            }
          
            responseObj = await helperFunc.getCriteriawiseReport(responseObj);

            resolve(responseObj);

          }
        })
        .catch(function (err) {
          let response = {
            result: false,
            message: 'INTERNAL_SERVER_ERROR'
          }
          resolve(response);
        })
    }
  });
}


//Funcion for instance observation pdf generation
async function entityPdfReportByCriteria(req, res) {
  
  return new Promise(async function (resolve, reject) {

    let entityRes = await entityCriteriaReportData(req, res);
  
    if (("observationName" in entityRes) == true) {
     
      let resData = await pdfHandler.entityCriteriaPdfReportGeneration(entityRes, storeReportsToS3 = false);

      resData.pdfUrl = config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl

      resolve(resData);
    }

    else {
      resolve(entityRes);
    }

  });
};



/**
   * @api {post} /dhiti/api/v1/observations/entityScoreReportByCriteria
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

    if (!req.body.entityId && !req.body.observationId) {
      var response = {
        result: false,
        message: 'entityId and observationId are required fields'
      }
      resolve(response);
    }

    else {

      model.MyModel.findOneAsync({ qid: "entity_score_criteria_report_query" }, { allow_filtering: true })
        .then(async function (result) {

          var bodyParam = JSON.parse(result.query);

          if (config.druid.observation_datasource_name) {
            bodyParam.dataSource = config.druid.observation_datasource_name;
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
          var options = config.druid.options;
          options.method = "POST";
          options.body = bodyParam;

          var data = await rp(options);

          if (!data.length) {
            resolve({
              "result": false,
              "data": "NO_OBSERVATIONS_MADE_FOR_THE_ENTITY" })
          }

          else {
            let reportType = "criteria";
            let chartData = await helperFunc.entityScoreReportChartObjectCreation(data,"v2", reportType);

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
                responseObj = await helperFunc.evidenceChartObjectCreation(chartData,evidenceData.data,req.headers["x-auth-token"]);
            } else {
                responseObj = chartData;
            }

            responseObj = await helperFunc.getCriteriawiseReport(responseObj);
            resolve(responseObj);

          }
        })

        .catch(function (err) {
          let response = {
            result: false,
            message: 'INTERNAL_SERVER_ERROR'
          }
          resolve(response);
        })

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

      let resData = await pdfHandler.instanceScoreCriteriaPdfGeneration(entityRes, storeReportsToS3 = false, obj);

      resData.pdfUrl = config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl

      resolve(resData);
    }

    else {
      resolve(entityRes);
    }

  });

};



/**
   * @api {post} /dhiti/api/v1/observations/observationReportByCriteria
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

      if (!req.body.observationId) {
          let response = {
              result: false,
              message: 'observationId is a required field'
          }
          resolve(response);
      }
      else {
          
          model.MyModel.findOneAsync({ qid: "observation_criteria_report_query" }, { allow_filtering: true })
              .then(async function (result) {

                let bodyParam = JSON.parse(result.query);
                if (config.druid.observation_datasource_name) {
                  bodyParam.dataSource = config.druid.observation_datasource_name;
                }

                bodyParam.filter = {"type": "and", "fields":[{ "type": "selector", "dimension": "observationId", "value": req.body.observationId},
                                   {"type":"not","field":{"type":"selector","dimension":"questionAnswer","value":""}}]};
                

                //if filter is given
                if (req.body.filter && req.body.filter.criteria && req.body.filter.criteria.length > 0) {
                  bodyParam.filter.fields.push({"type": "in", "dimension": "criteriaId", "values": req.body.filter.criteria});
                }

                //pass the query as body param and get the resul from druid
                let options = config.druid.options;
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
                  let chartData = await helperFunc.entityReportChart(data, entityId, entityType, reportType);

                  //Get evidence data from evidence datasource
                  let inputObj = {
                    observationId: req.body.observationId
                  }

                  let evidenceData = await getEvidenceData(inputObj);

                  let responseObj;

                  if (evidenceData.result) {
                    responseObj = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);

                  } else {
                    responseObj = chartData;
                  }
                  
                  responseObj = await helperFunc.getCriteriawiseReport(responseObj);
                  resolve(responseObj);

                }
              })
            .catch(function (err) {
                  let response = {
                      result: false,
                      message: 'INTERNAL_SERVER_ERROR'
                  }
                  resolve(response);
              })
      }
  });
}


//Funcion for observation pdf generation
async function observationPdfReportByCriteria(req, res) {
  
  return new Promise(async function (resolve, reject) {

    let observeRes = await observationCriteriaReportData(req, res);
  
    if (("observationName" in observeRes) == true) {
     
      let resData = await pdfHandler.entityCriteriaPdfReportGeneration(observeRes, storeReportsToS3 = false);

      resData.pdfUrl = config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl

      resolve(resData);
    }

    else {
      resolve(observeRes);
    }

  });
};


/**
   * @api {post} /dhiti/api/v1/observations/observationScoreReportByCriteria
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

    if (!req.body.observationId) {
      let response = {
        result: false,
        message: 'observationId is a required fields'
      }
      resolve(response);
    }

    else {

      model.MyModel.findOneAsync({ qid: "observation_score_criteria_report_query" }, { allow_filtering: true })
        .then(async function (result) {

          var bodyParam = JSON.parse(result.query);

          if (config.druid.observation_datasource_name) {
            bodyParam.dataSource = config.druid.observation_datasource_name;
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
          let options = config.druid.options;
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
            let chartData = await helperFunc.observationScoreReportChart(data,entityType,reportType);

              //Call samiksha API to get total schools count for the given observationId
              let totalEntities = await getTotalEntities(req.body.observationId,req.headers["x-auth-token"]);


            if (totalEntities.result) {
              chartData.totalEntities = totalEntities.result.count;
            }

            //Get evidence data from evidence datasource
            let inputObj = {
              observationId: req.body.observationId
            }

            let evidenceData = await getEvidenceData(inputObj);

            let responseObj;

            if (evidenceData.result) {
              responseObj = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);

            } else {
              responseObj = chartData;
            }
            
            //get criteria wise report
            responseObj = await helperFunc.getCriteriawiseReport(responseObj);
            resolve(responseObj);

          }
        })

        .catch(function (err) {
          let response = {
            result: false,
            message: 'INTERNAL_SERVER_ERROR'
          }
          resolve(response);
        })

    }

  })

}


//Observation score pdf generation 
async function observationScorePdfReportByCriteria(req, res) {

  return new Promise (async function (resolve,reject){

  let observationRes = await observationScoreCriteriaReportData(req, res);

  if (observationRes.result == true) {

    let obj = {
        totalEntities : observationRes.totalEntities,
        entitiesObserved : observationRes.entitiesObserved,
        entityType: observationRes.entityType
    }

    let resData = await pdfHandler.instanceScoreCriteriaPdfGeneration(observationRes, storeReportsToS3 = false, obj);

    resData.pdfUrl = config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl

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


/**
   * @api {post} /dhiti/api/v1/observations/listAllEvidences 
   * List all evidence 
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "submissionId": "",
  "entityId": "",
  "observationId": "",
  "questionId": ""
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "result": true,
       "data": [{
          "images":[{"url":"", "extension":""}],
          "videos":[{"url":"", "extension":""}],
          "documents":[{"url":"", "extension":""}],
          "remarks":[]
        }]
*     }
   * @apiUse errorBody
   */

//controller for all evidence API
exports.listAllEvidences = async function (req, res) {

  return new Promise(async function (resolve, reject) {

    let responseData = await allEvidencesList(req, res);
    res.send(responseData);

  })

};


//Function for getting all the evidences of a question
async function allEvidencesList(req, res) {
  return new Promise(async function (resolve, reject) {

    if (!req.body.submissionId && !req.body.questionId) {
      var response = {
        result: false,
        message: 'submissionId and questionId are required fields'
      }
      resolve(response);

    } else if (!req.body.entityId && !req.body.observationId && !req.body.questionId) {
      var response = {
        result: false,
        message: 'entityId, observationId and questionId are required fields'
      }
      resolve(response);

    } else if (!req.body.observationId && !req.body.questionId) {
      var response = {
        result: false,
        message: 'observationId and questionId are required fields'
      }
      resolve(response);

    } else {

      model.MyModel.findOneAsync({ qid: "list_all_evidence_query" }, { allow_filtering: true })
        .then(async function (result) {

          var bodyParam = JSON.parse(result.query);

          if (config.druid.evidence_datasource_name) {
            bodyParam.dataSource = config.druid.evidence_datasource_name;
          }

          let filter = {};

          if (req.body.submissionId && req.body.questionId) {
            filter = { "type": "and", fields: [{ "type": "selector", "dimension": "observationSubmissionId", "value": req.body.submissionId }, { "type": "selector", "dimension": "questionExternalId", "value": req.body.questionId }] };
          }
          else if (req.body.entityId && req.body.observationId && req.body.questionId) {
            let entityType = "school";
            if(req.body.entityType){
              entityType = req.body.entityType;
            }
            filter = { "type": "and", fields: [{ "type": "selector", "dimension": entityType, "value": req.body.entityId }, { "type": "selector", "dimension": "observationId", "value": req.body.observationId }, { "type": "selector", "dimension": "questionExternalId", "value": req.body.questionId }] };
          }
          else if (req.body.observationId && req.body.questionId) {
            filter = { "type": "and", fields: [{ "type": "selector", "dimension": "observationId", "value": req.body.observationId }, { "type": "selector", "dimension": "questionExternalId", "value": req.body.questionId }] };
          }

          bodyParam.filter = filter;

          //pass the query as body param and get the resul from druid
          var options = config.druid.options;
          options.method = "POST";
          options.body = bodyParam;
          var data = await rp(options);

          if (!data.length) {
            resolve({
              "result": false,
              "data": "Evidence_NOT_FOUND"
            });
          } else {

            let evidenceList = await helperFunc.getEvidenceList(data);

            let downloadableUrl = await kendraService.getDownloadableUrl(evidenceList[0], req.headers["x-auth-token"]);

            let response = await helperFunc.evidenceResponseCreateFunc(downloadableUrl.result);

            response.remarks = evidenceList[1];
            
            resolve({"result" : true, "data" : response});
          }

        })
        .catch(err => {
          var response = {
            result: false,
            message: 'Data not found'
          };
          resolve(response);

        })
    }
  })

}

// Get the evidence data
async function getEvidenceData(inputObj) {

  return new Promise(async function (resolve, reject) {

    model.MyModel.findOneAsync({ qid: "get_evidence_query" }, { allow_filtering: true })
      .then(async function (result) {

        let submissionId = inputObj.submissionId;
        let entityId = inputObj.entityId;
        let observationId = inputObj.observationId;
        let entityType = inputObj.entityType;

        var bodyParam = JSON.parse(result.query);
        
        //based on the given input change the filter
        let filter = {};

        if (submissionId) {
          filter = { "type": "selector", "dimension": "observationSubmissionId", "value": submissionId }
        } else if(entityId && observationId) {
          filter = {"type":"and","fields":[{"type": "selector", "dimension": entityType, "value": entityId},{"type": "selector", "dimension": "observationId", "value": observationId}]}
        } else if(observationId) {
          filter = { "type": "selector", "dimension": "observationId", "value": observationId }
        }

        if (config.druid.evidence_datasource_name) {
          bodyParam.dataSource = config.druid.evidence_datasource_name;
        }
         
        bodyParam.filter = filter;

        //pass the query as body param and get the resul from druid
        var options = config.druid.options;
        options.method = "POST";
        options.body = bodyParam;
        var data = await rp(options);

        if (!data.length) {
          resolve({
            "result": false,
            "data": "EVIDENCE_NOT_FOUND"
          });
        } else {
          resolve({"result":true,"data":data});
        }
      })
      .catch(function (err) {
        var response = {
          result: false,
          message: "Internal server error"
        };
        resolve(response);
      });
  })
}


module.exports.instanceObservationData = instanceObservationData;
module.exports.entityObservationData = entityObservationData;
module.exports.observationReportData = observationReportData;
