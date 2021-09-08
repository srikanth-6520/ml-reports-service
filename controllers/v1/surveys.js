const rp = require('request-promise');
const request = require('request');
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
* @apiHeader {String} x-authenticated-user-token Authenticity token  
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
                    {
                        solutionId: req.query.solutionId,
                        questionExternalIds: chartData.questionExternalIds
                    }
                );

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-authenticated-user-token"]);
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
        try {

            let bodyParam = gen.utils.getDruidQuery("get_submissionId_count_query");

            if (process.env.SURVEY_DATASOURCE_NAME) {
                bodyParam.dataSource = process.env.SURVEY_DATASOURCE_NAME;
            }

            bodyParam.filter.value = solutionId;

            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;

            let data = await rp(options);

            let submissionIdCount = 0;
            if (data.length > 0) {
                submissionIdCount = parseInt(data[0].event.submissionIdCount);
            }

            return resolve({ submissionCount: submissionIdCount });
        }
        catch (err) {

            let response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
            };
            return resolve(response);
        }
    })
}

const getDataOFTextTypeQuestions = async function (req) {

    return new Promise(async function (resolve, reject) {
        try {
            
            let bodyParam = gen.utils.getDruidQuery("survey_solutions_report_query");

            if (process.env.SURVEY_DATASOURCE_NAME) {
                bodyParam.dataSource = process.env.SURVEY_DATASOURCE_NAME;
            }

            bodyParam.filter.fields[0].value = req.query.solutionId;
            bodyParam.limitSpec = { "type": "default", "limit": solutionReportTextResponseLimit, "columns": [{ "dimension": "questionExternalId", "direction": "descending" }] };

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
        }
        catch (err) {

            let response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
            };
            return resolve(response);
        };
    })
}

//Function to get data from druid
const getDataFromDruid = async function (bodyParam, responseType) {

    return new Promise(async function (resolve, reject) {

        try {

            bodyParam.filter.fields[1].value = responseType;

            let options = gen.utils.getDruidConnection();
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
        try {

            let bodyParam = gen.utils.getDruidQuery("survey_solution_chart_report_query");

            if (process.env.SURVEY_DATASOURCE_NAME) {
                bodyParam.dataSource = process.env.SURVEY_DATASOURCE_NAME;
            }

            bodyParam.filter.fields[1].value = req.query.solutionId;

            //if filter is given
            if (req.body.filter && req.body.filter.questionId && req.body.filter.questionId.length > 0) {
                let filter = { "type": "in", "dimension": "questionExternalId", "values": req.body.filter.questionId };
                bodyParam.filter.fields.push(filter);
            }

            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;

            let data = await rp(options);

            return resolve(data);

        }
        catch (err) {

            let response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
            };
            return resolve(response);
        }
    })
}

/**
  * @api {post} /dhiti/api/v1/surveys/getAllResponsesOfQuestion Get all responses for the given questionId
  * List all responses
  * @apiVersion 1.0.0
  * @apiGroup Surveys
  * @apiHeader {String} x-authenticated-user-token Authenticity token  
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

        try {

            let response;

            if (!req.body.solutionId) {
                response = {
                    result: false,
                    message: 'solutionId is a required field'
                }
                console.log("Response:",{ resp: response });
                res.send(response);
            }

            if (!req.body.questionExternalId) {
                response = {
                    result: false,
                    message: 'questionExternalId is a required field'
                }
                console.log("Response:",{ resp: response });
                res.send(response);
            }

            let bodyParam = gen.utils.getDruidQuery("list_all_responses");

            if (process.env.SURVEY_DATASOURCE_NAME) {
                bodyParam.dataSource = process.env.SURVEY_DATASOURCE_NAME;
            }

            bodyParam.filter.fields[0].value = req.body.solutionId;
            bodyParam.filter.fields[1].value = req.body.questionExternalId;

            if (!(req.query.page && req.query.limit)) {
                bodyParam.limit = numberOfResponsesLimit;
            }

            if (req.body.completedDate) {
                let timeFilter = { "type": "bound", "dimension": "completedDate", "lower": req.body.completedDate, "lowerStrict": true, "ordering": "numeric" }
                bodyParam.filter.fields.push(timeFilter);
            }

            //pass the query as body param and get the resul from druid
            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;
            let data = await rp(options);

            if (!data.length) {
                console.log("Response:",{ resp: "DATA_NOT_FOUND" });
                res.send({
                    "result": false,
                    "data": "DATA_NOT_FOUND"
                });

            } else {

                response = await helperFunc.listALLAnswers(data,req.pageNo,req.pageSize);
                console.log("Response:",{ resp: response });
                res.send(response);
            }
        }
        catch (err) {
            response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
            };
            console.log("Response:",{ resp: response });
            res.send(response);
        }
    })
}


/**
* @api {get} /dhiti/api/v1/surveys/submissionReport?submissionId=:submissionId submission report
* Survey submission report
* @apiVersion 1.0.0
* @apiGroup Surveys
* @apiHeader {String} x-authenticated-user-token Authenticity token  
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

        try {

            if (!req.query.submissionId) {

                let response = {
                    result: false,
                    message: 'submissionId is a required field'
                };
                res.send(response);

            } else {

                let bodyParam = gen.utils.getDruidQuery("survey_submission_report_query");

                if (process.env.SURVEY_DATASOURCE_NAME) {
                    bodyParam.dataSource = process.env.SURVEY_DATASOURCE_NAME;
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
                let options = gen.utils.getDruidConnection();
                options.method = "POST";
                options.body = bodyParam;
                let data = await rp(options);

                if (!data.length) {

                    let message;
                    let getSubmissionStatusResponse = await assessmentService.getSurveySubmissionStatusById
                        (
                            req.query.submissionId,
                            req.headers["x-authenticated-user-token"]
                        )

                    if (getSubmissionStatusResponse.result &&
                        getSubmissionStatusResponse.result.status == filesHelper.submission_status_completed) {
                        message = filesHelper.submission_not_found_message;
                    }
                    else {
                        message = "SUBMISSION_ID_NOT_FOUND";
                    }

                    res.send({
                        result: false,
                        message: message
                    });

                } else {

                    let chartData = await helperFunc.instanceReportChart(data, filesHelper.survey);

                    //Get evidence data from evidence datasource
                    let evidenceData = await getEvidenceData(
                        { submissionId: req.query.submissionId }
                    );

                    let responseObj;

                    if (evidenceData.result) {
                        responseObj = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-authenticated-user-token"]);
                    } else {
                        responseObj = chartData;
                    }

                    res.send(responseObj);
                }
            }
        }
        catch (err) {

            let response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
            };
            res.send(response);
        };

    });
};


/**
* @api {post} /dhiti/api/v1/surveys/listAllEvidences
* List all evidences
* @apiVersion 1.0.0
* @apiGroup Surveys
* @apiHeader {String} x-authenticated-user-token Authenticity token
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

        try {

            if (!req.body.solutionId && !req.body.submissionId) {
                let response = {
                    result: false,
                    message: 'submissionId/solutionId is a required field'
                }
                console.log("Response:",{ resp: response });
                res.send(response);
            }

            if (!req.body.questionId) {
                let response = {
                    result: false,
                    message: 'questionId is a required field'
                }
                console.log("Response:",{ resp: response });
                res.send(response);
            }

            let bodyParam = gen.utils.getDruidQuery("list_all_evidence_query");

            if (process.env.SURVEY_EVIDENCE_DATASOURCE_NAME) {
                bodyParam.dataSource = process.env.SURVEY_EVIDENCE_DATASOURCE_NAME;
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
            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;
            let data = await rp(options);

            if (!data.length) {
                console.log("Response:","Evidence_NOT_FOUND");
                res.send({
                    result: false,
                    message: "Evidence_NOT_FOUND"
                });
            } else {

                let evidenceList = await helperFunc.getEvidenceList(data);

                let downloadableUrl = await kendraService.getDownloadableUrl(evidenceList[0], req.headers["x-authenticated-user-token"]);

                let response = await helperFunc.evidenceResponseCreateFunc(downloadableUrl.result);

                response.remarks = evidenceList[1];

                console.log("Response:",{ resp: response });

                res.send({ result: true, data: response });
            }
        }
        catch (err) {
            let response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
            };
            console.log("Response:",{ resp: response });
            res.send(response);

        }
    })
};


// Get the evidence data
async function getEvidenceData(inputObj) {

    return new Promise(async function (resolve, reject) {

        try {

            let bodyParam = gen.utils.getDruidQuery("get_survey_evidence_query");

            if (process.env.SURVEY_EVIDENCE_DATASOURCE_NAME) {
                bodyParam.dataSource = process.env.SURVEY_EVIDENCE_DATASOURCE_NAME;
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
            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            let data = [];

            if (inputObj.questionExternalIds && inputObj.questionExternalIds.length > 0) {

                bodyParam.limitSpec = { "type": "default", "limit": evidenceLimit, "columns": [{ "dimension": "questionExternalId", "direction": "descending" }] };
                let questionFilter = { "type": "selector", "dimension": "questionExternalId", "value": "" };

                await Promise.all(inputObj.questionExternalIds.map(async questionExternalId => {
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
        }
        catch (err) {
            let response = {
                result: false,
                message: "INTERNAL_SERVER_ERROR"
            };
            resolve(response);
        }
    })
}


