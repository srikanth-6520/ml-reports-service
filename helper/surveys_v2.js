const rp = require('request-promise');
const request = require('request');
const assessmentService = require('./assessment_service');
const filesHelper = require('../common/files_helper');
const helperFunc = require('./chart_data_v3');
const solutionReportTextResponseLimit = 10;
const evidenceLimit = 3;


//Survey submission report
exports.surveySubmissionReport = async function (req, res) {
    return new Promise(async function (resolve, reject) {
        try {

            let bodyParam = gen.utils.getDruidQuery("survey_submission_report_query");

            if (process.env.SURVEY_DATASOURCE_NAME) {
                bodyParam.dataSource = process.env.SURVEY_DATASOURCE_NAME;
            }

            let submissionId = req.query.submissionId ? req.query.submissionId : req.body.submissionId;

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
            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;
            let data = await rp(options);

            if (!data.length) {

                let message;
                let getSubmissionStatusResponse = await assessmentService.getSurveySubmissionStatusById
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

                return resolve({
                    result: false,
                    message: message
                });

            } else {

                let chartData = await helperFunc.instanceReportChart(data, filesHelper.survey);

                //Get evidence data from evidence datasource
                let evidenceData = await getEvidenceData(
                    { submissionId: submissionId }
                );

                let responseObj;

                if (evidenceData.result) {
                    responseObj = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
                } else {
                    responseObj = chartData;
                }

                return resolve(responseObj);
            }
        }
        catch (err) {
            let response = {
                result: false,
                message: err.message
            };
            resolve(response);
        }

    })

}

//Survey solution report
exports.surveySolutionReport = async function (req, res) {
    return new Promise(async function (resolve, reject) {
        try {
            
            let solutionId = req.query.solutionId ? req.query.solutionId : req.body.solutionId;
            let data = [];
            let submissionCount = 0;

            let getSolutionData = [
                getDataOFTextTypeQuestions(req),
                getDataOFChartTypeQuestions(req),
                getSubmissionIdCount(solutionId)
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
                return resolve({
                    result: false,
                    message: "SUBMISSIONS_NOT_FOUND"
                })
            } else {

                let chartData = await helperFunc.getSurveySolutionReport(data, submissionCount);

                //Get evidence data from evidence datasource
                let evidenceData = await getEvidenceData(
                    {
                        solutionId: solutionId,
                        questionExternalIds: chartData.questionExternalIds
                    }
                );

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
                } else {
                    response = chartData;
                }

                return resolve(response);
            }
        }
        catch (err) {
            let response = {
                result: false,
                message: err.message
            };
            resolve(response);
        }

    })

}


const getDataOFTextTypeQuestions = async function (req) {

    return new Promise(async function (resolve, reject) {
        try {
            
            let solutionId = req.query.solutionId ? req.query.solutionId : req.body.solutionId;

            let bodyParam = gen.utils.getDruidQuery("survey_solutions_report_query");

            if (process.env.SURVEY_DATASOURCE_NAME) {
                bodyParam.dataSource = process.env.SURVEY_DATASOURCE_NAME;
            }

            bodyParam.filter.fields[0].value = solutionId;
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
                message: err.message
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

            let solutionId = req.query.solutionId ? req.query.solutionId : req.body.solutionId;

            let bodyParam = gen.utils.getDruidQuery("survey_solution_chart_report_query");

            if (process.env.SURVEY_DATASOURCE_NAME) {
                bodyParam.dataSource = process.env.SURVEY_DATASOURCE_NAME;
            }

            bodyParam.filter.fields[1].value = solutionId;

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
                message: err.message
            };
            return resolve(response);
        }
    })
}


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

