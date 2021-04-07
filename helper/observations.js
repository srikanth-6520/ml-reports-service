const rp = require('request-promise');
const request = require('request');
const helperFunc = require('./chart_data_v2');
const filesHelper = require('../common/files_helper');
const assessmentService = require('./assessment_service');


//Function for instance observation report generation
exports.instanceObservationData = async function (req, res) {

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
                        submissionId: submissionId
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
                message: 'INTERNAL_SERVER_ERROR'
            };
            resolve(response);
        }
    });
};


//Function for instance observation score report generation
exports.instanceScoreReport = async function(req, res) {

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
                        bodyParam.filter.fields.push({ "type": "in", "dimension": "questionExternalId", "values": req.body.filter.questionId });
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

                    let chartData = await helperFunc.instanceScoreReportChartObjectCreation(data);

                    //Get evidence data from evidence datasource
                    let inputObj = {
                        submissionId: req.body.submissionId
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
                message: 'INTERNAL_SERVER_ERROR'
            };
            resolve(response);
        }
    })
};


//Function for entity report generation
exports.entityObservationData = async function(req, res) {

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

                    let chartData = await helperFunc.entityReportChart(data, req.body.entityId, "school")

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
            res.status(400);
            let response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
            }
            resolve(response);
        }

    });
}

//Function for observation report generation
exports.observationReportData = async function(req, res) {
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
            }
        }
        catch (err) {
            let response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
            }
            resolve(response);
        }
    });
}

//Function for observation score report generation
exports.observationScoreReport = async function(req, res) {

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

                if (req.body.entityType) {
                    entityType = req.body.entityType;
                }

                bodyParam.dimensions.push(entityType, entityType + "Name");

                //if filter is given
                if (req.body.filter) {
                    if (req.body.filter.questionId && req.body.filter.questionId.length > 0) {
                        bodyParam.filter.fields[0].value = req.body.observationId;
                        bodyParam.filter.fields.push({ "type": "in", "dimension": "questionExternalId", "values": req.body.filter.questionId });
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

                    let chartData = await helperFunc.observationScoreReportChart(data, entityType);

                    //Call samiksha API to get total schools count for the given observationId
                    let totalEntities = await assessmentService.getTotalEntities(req.body.observationId, req.headers["x-auth-token"]);

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
                message: 'INTERNAL_SERVER_ERROR'
            }
            resolve(response);
        }
    })
}


//Function for entity solution report generation 
exports.entitySolutionScoreReportGeneration = async function(req, res) {

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
                    bodyParam.filter.fields[1].fields.push(filter);

                }
                else {
                    let filter = {
                        "type": "or", "fields": [{
                            "type": "and", "fields": [{ "type": "selector", "dimension": "createdBy", "value": req.userDetails.userId },
                            { "type": "selector", "dimension": "isAPrivateProgram", "value": true }]
                        },
                        { "type": "selector", "dimension": "isAPrivateProgram", "value": false }]
                    };

                    bodyParam.filter.fields[1].fields.push(filter);
                }

                //get the acl data from samiksha service
                let userProfile = await assessmentService.getUserProfile(req.userDetails.userId, req.headers["x-auth-token"]);
                let aclLength = Object.keys(userProfile.result.acl);
                if (userProfile.result && userProfile.result.acl && aclLength > 0) {
                    let tagsArray = await helperFunc.tagsArrayCreateFunc(userProfile.result.acl);

                    bodyParam.filter.fields[1].fields.push({
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
                    resolve({ "data": "No observations made for the entity" })
                }
                else {
                    let responseObj = await helperFuncV2.observationScoreReportChart(data)
                    responseObj.solutionId = req.body.solutionId;
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
    })

}


//School solution score report creation function
const schoolSolutionScoreReport = async function (req, res) {

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

                bodyParam.filter.fields[1].fields.push({
                    "type": "or", "fields": [{ "type": "in", "dimension": "schoolType", "values": tagsArray },
                    { "type": "in", "dimension": "administrationType", "values": tagsArray }]
                });
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
        catch (err) {
            let response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
            }
            resolve(response);
        }
    })
}


//Function for instance criteria report
exports.instanceCriteriaReportData = async function (req, res) {

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


//Function for instance observation score report chart object creation
exports.instanceScoreCriteriaReportData = async function (req, res) {

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
                bodyParam.filter.fields.push({ "type": "not", "field": { "type": "selector", "dimension": "questionAnswer", "value": "" } });

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
                    let chartData = await helperFunc.instanceScoreReportChartObjectCreation(data, reportType);

                    //Get evidence data from evidence datasource
                    let inputObj = {
                        submissionId: req.body.submissionId
                    }

                    let evidenceData = await getEvidenceData(inputObj);

                    let responseObj;

                    if (evidenceData.result) {
                        responseObj = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);

                    } else {
                        responseObj = chartData;
                    }

                    // get criteria wise report
                    responseObj = await helperFunc.getCriteriawiseReport(responseObj);

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


//Function for entity criteria report
exports.entityCriteriaReportData = async function (req, res) {

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

                if (req.body.entityType) {
                    entityType = req.body.entityType;
                }

                bodyParam.filter.fields[0].dimension = entityType;
                bodyParam.filter.fields[0].value = req.body.entityId;
                bodyParam.filter.fields[1].value = req.body.observationId;
                bodyParam.filter.fields.push({ "type": "not", "field": { "type": "selector", "dimension": "questionAnswer", "value": "" } });

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
                        message = "NO_OBSERVATIONS_MADE_FOR_THE_ENTITY";
                    }

                    resolve({
                        "result": false,
                        "data": message
                    })
                }
                else {

                    let reportType = "criteria";
                    let chartData = await helperFunc.entityReportChart(data, req.body.entityId, "school", reportType)

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

                    responseObj = await helperFunc.getCriteriawiseReport(responseObj);

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
    });
}


//Function for entity criteria score report
exports.entityScoreCriteriaReportData = async function (req, res) {

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

                if (req.body.entityType) {
                    entityType = req.body.entityType;
                }

                bodyParam.filter.fields[1].fields[0].dimension = entityType;
                bodyParam.filter.fields[1].fields[0].value = req.body.entityId;
                bodyParam.filter.fields[1].fields[1].value = req.body.observationId;
                bodyParam.filter.fields.push({ "type": "not", "field": { "type": "selector", "dimension": "questionAnswer", "value": "" } });

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
                    resolve({
                        "result": false,
                        "data": "NO_OBSERVATIONS_MADE_FOR_THE_ENTITY"
                    })
                }

                else {
                    let reportType = "criteria";
                    let chartData = await helperFunc.entityScoreReportChartObjectCreation(data, reportType);

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

                    responseObj = await helperFunc.getCriteriawiseReport(responseObj);
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


//Function for observation criteria report
exports.observationCriteriaReportData = async function(req, res) {
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

                bodyParam.filter = {
                    "type": "and", "fields": [{ "type": "selector", "dimension": "observationId", "value": req.body.observationId },
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

                //if no data throw error message
                if (!data.length) {
                    resolve({
                        "result": false,
                        "data": "NO_ENTITY_WAS_FOUND"
                    })
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
            }
        }
        catch (err) {
            let response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
            }
            resolve(response);
        }
    });
}

//Function for observation score criteria report
exports.observationScoreCriteriaReportData = async function(req, res) {

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

                if (req.body.entityType) {
                    entityType = req.body.entityType;
                }

                bodyParam.dimensions.push(entityType, entityType + "Name");
                bodyParam.filter.fields[0].value = req.body.observationId;
                bodyParam.filter.fields.push({ "type": "not", "field": { "type": "selector", "dimension": "questionAnswer", "value": "" } });

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
                    resolve({
                        "result": false,
                        "data": "NO_ENTITIES_FOUND"
                    })
                }

                else {
                    let reportType = "criteria";
                    let chartData = await helperFunc.observationScoreReportChart(data, entityType, reportType);

                    //Call samiksha API to get total schools count for the given observationId
                    let totalEntities = await assessmentService.getTotalEntities(req.body.observationId, req.headers["x-auth-token"]);


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
                        responseObj = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);

                    } else {
                        responseObj = chartData;
                    }

                    //get criteria wise report
                    responseObj = await helperFunc.getCriteriawiseReport(responseObj);
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


// Function for entity score report generation
exports.entityScoreReportGenerate = async function(req, res) {

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

                    let chartData = await helperFunc.entityScoreReportChartObjectCreation(data);

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
                message: err.message
            }
            resolve(response);
        }
    })

}
  

// Function for entity solution report generation 
exports.entitySolutionReportGeneration = async function (req, res) {

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


// Get the evidence data
async function getEvidenceData(inputObj) {

    return new Promise(async function (resolve, reject) {
        try {

            let submissionId = inputObj.submissionId;
            let entityId = inputObj.entityId;
            let observationId = inputObj.observationId;
            let entityType = inputObj.entityType;

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
            var options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;
            var data = await rp(options);

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
        }
    })
}