const config = require('../../config/config');
const rp = require('request-promise');
const request = require('request');
const model = require('../../db');
const helperFunc = require('../../helper/chart_data');
const pdfHandler = require('../../helper/common_handler');
const omit = require('object.omit');
const url = require("url");
const authService = require('../../middleware/authentication_service');
const rimraf = require("rimraf");
const fs = require('fs');
const path = require('path');


/**
   * @api {post} /dhiti/api/v1/criteria/instance 
   * Instance observation report
   * @apiVersion 1.0.0
   * @apiGroup Criteria
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
              {url:"", extension:""},
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

            model.MyModel.findOneAsync({ qid: "instance_observation_query" }, { allow_filtering: true })
                .then(async function (result) {

                    let bodyParam = JSON.parse(result.query);

                    if (config.druid.observation_datasource_name) {
                        bodyParam.dataSource = config.druid.observation_datasource_name;
                    }

                    bodyParam.dimensions.push("criteriaName");
                    bodyParam.filter.value = submissionId;

                    //pass the query as body param and get the resul from druid
                    let options = config.druid.options;
                    options.method = "POST";
                    options.body = bodyParam;
                    let data = await rp(options);
                   
                    if (!data.length) {
                        resolve({
                            "data": "SUBMISSION_ID_NOT_FOUND"
                        });
                    } else {

                        let reportType = "criteria";
                        let chartData = await helperFunc.instanceReportChart(data,reportType);

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

                        responseObj = await helperFunc.getCriteriawiseReport(responseObj);

                        resolve(responseObj);
                       
                    }
                })
                .catch(function (err) {
                    console.log(err);
                    let response = {
                        result: false,
                        message: 'INTERNAL_SERVER_ERROR'
                    };
                    resolve(response);
                });
        }
    });
};




// Get the evidence data
async function getEvidenceData(inputObj) {

    return new Promise(async function (resolve, reject) {
  
      model.MyModel.findOneAsync({ qid: "get_evidence_query" }, { allow_filtering: true })
        .then(async function (result) {
  
          let submissionId = inputObj.submissionId;
          let entityId = inputObj.entityId;
          let observationId = inputObj.observationId;
  
          var bodyParam = JSON.parse(result.query);
          
          //based on the given input change the filter
          let filter = {};
  
          if (submissionId) {
            filter = { "type": "selector", "dimension": "observationSubmissionId", "value": submissionId }
          } else if(entityId && observationId) {
            filter = {"type":"and","fields":[{"type": "selector", "dimension": "school", "value": entityId},{"type": "selector", "dimension": "observationId", "value": observationId}]}
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
  