const config = require('../../config/config');
const rp = require('request-promise');
const request = require('request');
const model = require('../../db');
const helperFunc = require('../../helper/chart_data');
const filesHelper = require('../../common/files_helper');
const assessmentService = require('../../helper/assessment_service');
const kendraService = require('../../helper/kendra_service');
const solutionReportTextResponseLimit = 10;
const evidenceLimit = 3;
const numberOfResponsesLimit = 10;

   /**
   * @api {get} /dhiti/api/v1/surveys/solutionReport?solutionId=:solutionId solution report
   * Survey solution report
   * @apiVersion 1.0.0
   * @apiGroup Surveys
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiSampleRequest /dhiti/api/v1/surveys/solutionReport?solutionId=5f58b0b8894a0928fc8aa9b3
   * @apiSuccessExample {json} Success-Response:
   * {  
   *   "solutionName" : "",
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
   * }
   * @apiUse errorBody
   */

exports.solutionReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {
        let response;
        if (!req.query.solutionId) {

            response = {
                result: false,
                message: 'solutionId is a required field'
            };

            res.send(response);

        } else {

            let data = [];
            let submissionCount = 0;

            let getSolutionData = [
                getDataOFTextTypeQuestions(req),
                getDataOFChartTypeQuestions(req),
                getSubmissionIdCount(req.query.solutionId)
            ]

            await Promise.all(getSolutionData)
                .then(function (responses) {
                    if (responses[0].length > 0) {
                        data.push(...responses[0])
                    }
                    if (responses[1].length > 0) {
                        data.push(...responses[1])
                    }
                    submissionCount = responses[2].submissionCount;
                })

            if (!data.length) {
                res.send({
                    result: false,
                    message: "SUBMISSIONS_NOT_FOUND"
                })
            } else {

                let chartData = await helperFunc.getSurveySolutionReport(data, submissionCount);

                 //Get evidence data from evidence datasource
                 let evidenceData = await getEvidenceData(
                   { solutionId: req.query.solutionId, 
                     questionExternalIds: chartData.questionExternalIds
                   }
               );

               if (evidenceData.result) {
                   response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
               } else {
                   response = chartData;
               }

               res.send(response);
            }
        }

    });
};


//Function to get submissionId count based on solutionId
const getSubmissionIdCount = async function (solutionId) {
   
    return new Promise(async function (resolve, reject) {

        model.MyModel.findOneAsync({ qid: "get_submissionId_count_query" }, { allow_filtering: true })
        .then(async function (result) {
    
            let bodyParam = JSON.parse(result.query);
    
            if (config.druid.survey_datasource_name) {
                bodyParam.dataSource = config.druid.survey_datasource_name;
            }
    
            bodyParam.filter.value = solutionId;

            let options = config.druid.options;
            options.method = "POST";
            options.body = bodyParam;
    
            let data = await rp(options);
            
            let submissionIdCount = 0;
            if (data.length > 0) {
                submissionIdCount = data[0].event.submissionIdCount;
            }

             return resolve({submissionCount : submissionIdCount });
    
            })
            .catch(function (err) {
    
                let response = {
                    result: false,
                    message: 'INTERNAL_SERVER_ERROR'
                };
                return resolve(response);
            });
    })
}

const getDataOFTextTypeQuestions = async function (req) {
   
    return new Promise(async function (resolve, reject) {

    model.MyModel.findOneAsync({ qid: "survey_solutions_report_query" }, { allow_filtering: true })
    .then(async function (result) {

        let bodyParam = JSON.parse(result.query);

        if (config.druid.survey_datasource_name) {
            bodyParam.dataSource = config.druid.survey_datasource_name;
        }

        bodyParam.filter.fields[0].value = req.query.solutionId;
        bodyParam.limitSpec = {"type":"default","limit":solutionReportTextResponseLimit,"columns":[{"dimension":"questionExternalId","direction":"descending"}]};

         //if filter is given
         if (req.body.filter && req.body.filter.questionId && req.body.filter.questionId.length > 0) {
            let filter = { "type": "in", "dimension": "questionExternalId", "values": req.body.filter.questionId };
            bodyParam.filter.fields.push(filter);
        }
        
        let getDruidData = [
            getDataFromDruid(bodyParam, "text"),
            getDataFromDruid(bodyParam, "number"),
            getDataFromDruid(bodyParam, "slider"),
            getDataFromDruid(bodyParam, "date")
        ];
        
        let data = [];
        
        await Promise.all(getDruidData)
        .then(function (responses) {
             if (responses[0].length) {
                 data.push(...responses[0]);
             }
             if (responses[1].length) {
                data.push(...responses[1]);
            }
            if (responses[2].length) {
                data.push(...responses[2]);
            }
            if (responses[3].length) {
                data.push(...responses[3]);
            }
         });

         return resolve(data);

        })
        .catch(function (err) {

            let response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
            };
            return resolve(response);
        });
    })
}

//Function to get data from druid
const getDataFromDruid = async function (bodyParam, responseType) {

    return new Promise(async function (resolve, reject) {

        try {

            bodyParam.filter.fields[1].value = responseType;

            let options = config.druid.options;
            options.method = "POST";
            options.body = bodyParam;

            let data = await rp(options);

            return resolve(data);
        }
        catch (err) {
            return reject(err);
        }
    })
}



const getDataOFChartTypeQuestions = async function (req) {

    return new Promise(async function (resolve, reject) {

    model.MyModel.findOneAsync({ qid: "survey_solution_chart_report_query" }, { allow_filtering: true })
    .then(async function (result) {

        let bodyParam = JSON.parse(result.query);

        if (config.druid.survey_datasource_name) {
            bodyParam.dataSource = config.druid.survey_datasource_name;
        }

        bodyParam.filter.fields[1].value = req.query.solutionId;

         //if filter is given
         if (req.body.filter && req.body.filter.questionId && req.body.filter.questionId.length > 0) {
            let filter = { "type": "in", "dimension": "questionExternalId", "values": req.body.filter.questionId };
            bodyParam.filter.fields.push(filter);
        }

        let options = config.druid.options;
        options.method = "POST";
        options.body = bodyParam;

        let data = await rp(options);

        return resolve(data);

        })
        .catch(function (err) {

            let response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
            };
            return resolve(response);
        });
    })
}

/**
  * @api {post} /dhiti/api/v1/surveys/getAllResponsesOfQuestion Get all responses for the given questionId
  * List all responses
  * @apiVersion 1.0.0
  * @apiGroup Surveys
  * @apiHeader {String} x-auth-token Authenticity token  
  * @apiSampleRequest /dhiti/api/v1/surveys/getAllResponsesOfQuestion
  * @apiParamExample {json} Request-Body:
  * {
    "solutionId": "",
    "questionExternalId": "",
    "completedDate": ""
  * }
  * @apiSuccessExample {json} Success-Response:
  * {  
  *   "question" : "",
      "answers": [],
      "completedDate": ""
  * }
  * @apiUse errorBody
  */

exports.getAllResponsesOfQuestion = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        let response;

        if (!req.body.solutionId) {
            response = {
                result: false,
                message: 'solutionId is a required field'
            }
            res.send(response);
        }

        if (!req.body.questionExternalId) {
            response = {
                result: false,
                message: 'questionExternalId is a required field'
            }
            res.send(response);
        }

        model.MyModel.findOneAsync({ qid: "list_all_responses" }, { allow_filtering: true })
            .then(async function (result) {

                let bodyParam = JSON.parse(result.query);

                if (config.druid.survey_datasource_name) {
                    bodyParam.dataSource = config.druid.survey_datasource_name;
                }

                bodyParam.filter.fields[0].value = req.body.solutionId;
                bodyParam.filter.fields[1].value = req.body.questionExternalId;
                bodyParam.limit = numberOfResponsesLimit;
                if (req.body.completedDate) {
                    let timeFilter = { "type": "bound","dimension": "completedDate","lower": req.body.completedDate,"lowerStrict": true,"ordering": "numeric" }
                    bodyParam.filter.fields.push(timeFilter);
                }

                //pass the query as body param and get the resul from druid
                let options = config.druid.options;
                options.method = "POST";
                options.body = bodyParam;
                let data = await rp(options);

                if (!data.length) {
                    res.send({
                        "result": false,
                        "data": "DATA_NOT_FOUND"
                    });

                } else {

                    response = await helperFunc.listALLAnswers(data);
                    res.send(response);
                }
            })
            .catch(err => {
                response = {
                    result: false,
                    message: 'INTERNAL_SERVER_ERROR'
                };
                res.send(response);
            })

    })
}


   /**
   * @api {get} /dhiti/api/v1/surveys/submissionReport?submissionId=:submissionId submission report
   * Survey submission report
   * @apiVersion 1.0.0
   * @apiGroup Surveys
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiSampleRequest /dhiti/api/v1/surveys/submissionReport?submissionId=5f58b0b8894a0928fc8aa9b3
   * @apiSuccessExample {json} Success-Response:
   * {
   *   "solutionName": "",
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
   * }
   * @apiUse errorBody
   */

   exports.submissionReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        if (!req.query.submissionId) {

            let response = {
                result: false,
                message: 'submissionId is a required field'
            };
            res.send(response);

        } else {

            model.MyModel.findOneAsync({ qid: "survey_submission_report_query" }, { allow_filtering: true })
                .then(async function (result) {

                    let bodyParam = JSON.parse(result.query);

                    if (config.druid.survey_datasource_name) {
                        bodyParam.dataSource = config.druid.survey_datasource_name;
                    }

                    bodyParam.filter.fields[0].value = req.query.submissionId;

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
                    let options = config.druid.options;
                    options.method = "POST";
                    options.body = bodyParam;
                    let data = await rp(options);

                    if (!data.length) {

                        let message;
                        let getSubmissionStatusResponse = await assessmentService.getSurveySubmissionStatusById
                        (
                            req.query.submissionId,
                            req.headers["x-auth-token"]
                        )

                        if (getSubmissionStatusResponse.result && 
                            getSubmissionStatusResponse.result.status == filesHelper.submission_status_completed) {
                            message = "Your report generation is in progress. Please check back after a few minutes."
                        }
                        else {
                            message = "SUBMISSION_ID_NOT_FOUND";
                        }

                        res.send({
                            result: false,
                            message: message
                        });

                    } else {

                        let chartData = await helperFunc.instanceReportChart(data,filesHelper.survey);

                        //Get evidence data from evidence datasource
                        let evidenceData = await getEvidenceData(
                             { submissionId: req.query.submissionId }
                        );

                        let responseObj;

                        if (evidenceData.result) {
                            responseObj = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
                        } else {
                            responseObj = chartData;
                        }

                        res.send(responseObj);
                    }
                })
                .catch(function (err) {

                    let response = {
                        result: false,
                        message: 'INTERNAL_SERVER_ERROR'
                    };
                    res.send(response);
                });
            }
        });
    };


   /**
   * @api {post} /dhiti/api/v1/surveys/listAllEvidences
   * List all evidences
   * @apiVersion 1.0.0
   * @apiGroup Surveys
   * @apiHeader {String} x-auth-token Authenticity token
   * @apiParamExample {json} Request-Body:
   * {
     "submissionId": "",
     "solutionId": "",
     "questionId": ""
   * }
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *  {
       "result": true,
       "data": [{
          "images":[{"url":"", "extension":""}],
          "videos":[{"url":"", "extension":""}],
          "documents":[{"url":"", "extension":""}],
          "remarks":[]
        }]
   *  }
   * @apiUse errorBody
   */

   exports.listAllEvidences = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        if (!req.body.solutionId && !req.body.submissionId) {
            let response = {
              result: false,
              message: 'submissionId/solutionId is a required field'
            }
            res.send(response);
        }
        
        if (!req.body.questionId) {
            let response = {
              result: false,
              message: 'questionId is a required field'
            }
            res.send(response);
        }

        model.MyModel.findOneAsync({ qid: "list_all_evidence_query" }, { allow_filtering: true })
        .then(async function (result) {

            let bodyParam = JSON.parse(result.query);
  
            if (config.druid.survey_evidence_datasource_name) {
              bodyParam.dataSource = config.druid.survey_evidence_datasource_name;
            }

            let filter = {};
  
            if (req.body.submissionId && req.body.questionId) {
              filter = { "type": "and", fields: [{ "type": "selector", "dimension": "surveySubmissionId", "value": req.body.submissionId }, { "type": "selector", "dimension": "questionExternalId", "value": req.body.questionId }] };
            }
            else if (req.body.solutionId && req.body.questionId) {
              filter = { "type": "and", fields: [{ "type": "selector", "dimension": "solutionId", "value": req.body.solutionId }, { "type": "selector", "dimension": "questionExternalId", "value": req.body.questionId }] };
            }
  
            bodyParam.filter = filter;

             //pass the query as body param and get the resul from druid
             let options = config.druid.options;
             options.method = "POST";
             options.body = bodyParam;
             let data = await rp(options);
   
             if (!data.length) {
               res.send({
                 result: false,
                 message: "Evidence_NOT_FOUND"
               });
             } else {

                let evidenceList = await helperFunc.getEvidenceList(data);
  
                let downloadableUrl = await kendraService.getDownloadableUrl(evidenceList[0], req.headers["x-auth-token"]);
    
                let response = await helperFunc.evidenceResponseCreateFunc(downloadableUrl.result);
    
                response.remarks = evidenceList[1];
                
                res.send({result: true, data: response});
              }
    
            })
            .catch(err => {
              let response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
              };
              res.send(response);
    
            })
        })
    };
  
  
    // Get the evidence data
    async function getEvidenceData(inputObj) {

    return new Promise(async function (resolve, reject) {

        model.MyModel.findOneAsync({ qid: "get_survey_evidence_query" }, { allow_filtering: true })
            .then(async function (result) {

                let bodyParam = JSON.parse(result.query);

                if (config.druid.survey_evidence_datasource_name) {
                    bodyParam.dataSource = config.druid.survey_evidence_datasource_name;
                }

                if (inputObj.submissionId) {
                   bodyParam.filter.fields[0].dimension = "surveySubmissionId";
                   bodyParam.filter.fields[0].value = inputObj.submissionId;
                } else if (inputObj.solutionId) {
                   bodyParam.filter.fields[0].dimension = "solutionId";
                   bodyParam.filter.fields[0].value = inputObj.solutionId;
                } else {
                    resolve({
                        "result": false,
                        "message": "INVALID_INPUT"
                    });
                }
                
                //pass the query as body param and get the result from druid
                let options = config.druid.options;
                options.method = "POST";
                let data = [];
                 
                if (inputObj.questionExternalIds && inputObj.questionExternalIds.length > 0) {

                    bodyParam.limitSpec = {"type":"default","limit":evidenceLimit,"columns":[{"dimension":"questionExternalId","direction":"descending"}]};
                    let questionFilter = {"type":"selector","dimension":"questionExternalId","value": ""};

                    await Promise.all(questionExternalIds.map(async questionExternalId => {
                        questionFilter.value = questionExternalId;
                        bodyParam.filter.fields.push(questionFilter);
                        options.body = bodyParam;
                        let evidenceData = await rp(options);
                        data.push(...evidenceData);
                    }))
                }
                else {
                    options.body = bodyParam;
                    data = await rp(options);
                }
                 
                if (!data.length) {
                    resolve({
                        "result": false,
                        "message": "EVIDENCE_NOT_FOUND",
                        "data": []
                    });
                } else {
                    resolve({ "result": true, "data": data });
                }
            })
            .catch(function (err) {
                let response = {
                    result: false,
                    message: "INTERNAL_SERVER_ERROR"
                };
                resolve(response);
            });
        })
    }


