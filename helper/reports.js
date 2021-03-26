const rp = require('request-promise');
const request = require('request');
const assessmentService = require('./assessment_service');
const helperFunc = require('./chart_data_v2');
const pdfHandler = require('./common_handler_v2');
const filesHelper = require('../common/files_helper');
const surveysHelper = require('./surveys');

// Instance observation report
exports.instaceObservationReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        try {

        let bodyParam = gen.utils.getDruidQuery("instance_observation_query");

        if (process.env.OBSERVATION_DATASOURCE_NAME) {
            bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
        }

        //Apply submissionId filter
        bodyParam.filter.fields[0].value = req.body.submissionId;

        //Push criteriaId or questionId filter based on the report Type (question wise and criteria wise)
        if (req.body.criteriaWise == false && req.body.filter && req.body.filter.questionId && req.body.filter.questionId.length > 0) {
            bodyParam.filter.fields.push({ "type": "in", "dimension": "questionExternalId", "values": req.body.filter.questionId });
            bodyParam.filter.fields.push({ "type": "not", "field": { "type": "selector", "dimension": "questionAnswer", "value": "" } });
        }

        if (req.body.criteriaWise == true && req.body.filter && req.body.filter.criteria && req.body.filter.criteria.length > 0) {
            bodyParam.filter.fields.push({ "type": "in", "dimension": "criteriaId", "values": req.body.filter.criteria });
            bodyParam.filter.fields.push({ "type": "not", "field": { "type": "selector", "dimension": "questionAnswer", "value": "" } });
        }

        let criteriaLevelReport = false;

        if (req.body.scores == true) {

            let getReportType = await getCriteriaLevelReportKey({ submissionId: req.body.submissionId});

            if (!getReportType.length) {
                return resolve({
                    "data": filesHelper.submission_not_found_message
                });
            } else {
                criteriaLevelReport = getReportType[0].event.criteriaLevelReport;
            }
        }

        bodyParam.dimensions = [];

        //Push dimensions to the query based on report type
        if (req.body.scores == false && req.body.criteriaWise == false) {
            bodyParam.dimensions.push("questionName", "questionAnswer", "school", "districtName", "schoolName", "remarks", "entityType", "observationName", "observationId", "questionResponseType", "questionResponseLabel", "questionId", "questionExternalId", "instanceId", "instanceParentQuestion", "instanceParentResponsetype", "instanceParentId", "questionSequenceByEcm", "instanceParentExternalId", "instanceParentEcmSequence");
        }

        if (req.body.scores == true && req.body.criteriaWise == false && criteriaLevelReport == false) {
            bodyParam.dimensions.push("questionName", "questionAnswer", "questionExternalId", "questionResponseType", "minScore", "maxScore", "totalScore", "scoreAchieved", "observationName");
            bodyParam.filter.fields.push({"type":"or","fields":[{"type":"selector","dimension":"questionResponseType","value":"radio"},{"type":"selector","dimension":"questionResponseType","value":"multiselect"},{"type":"selector","dimension":"questionResponseType","value":"slider"}]})
        }

        if (req.body.scores == false && req.body.criteriaWise == true) {
            bodyParam.dimensions.push("questionName", "questionAnswer", "school", "districtName", "schoolName", "remarks", "entityType", "observationName", "observationId", "questionResponseType", "questionResponseLabel", "questionId", "questionExternalId", "instanceId", "instanceParentQuestion", "instanceParentResponsetype", "instanceParentId", "questionSequenceByEcm", "instanceParentExternalId", "instanceParentEcmSequence", "criteriaName", "criteriaId", "instanceParentCriteriaName", "instanceParentCriteriaId");
        }

        if (req.body.scores == true && req.body.criteriaWise == true && criteriaLevelReport == false) {
            bodyParam.dimensions.push("questionName", "schoolName", "districtName", "questionAnswer", "questionExternalId", "questionResponseType", "minScore", "maxScore", "totalScore", "scoreAchieved", "observationName", "criteriaName", "criteriaId");
            bodyParam.filter.fields.push({"type":"or","fields":[{"type":"selector","dimension":"questionResponseType","value":"radio"},{"type":"selector","dimension":"questionResponseType","value":"multiselect"},{"type":"selector","dimension":"questionResponseType","value":"slider"}]})
        }

        if (req.body.scores == true && criteriaLevelReport == true) {
            bodyParam.filter.fields.push({"type":"selector","dimension":"childType","value":"criteria"})
            bodyParam.dimensions.push("observationSubmissionId", "completedDate", "domainName", "criteriaDescription", "level", "label", "programName", "solutionName", "childExternalid", "childName", "childType");
        }

        //pass the query get the result from druid
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

            return resolve({
                "data": message
            });
        }
        else {

            let response;
            let chartData;
            let pdfReportUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=";

            let evidenceData = await getEvidenceData({ submissionId: req.body.submissionId });

            //Send report based on input
            if (req.body.scores == false && req.body.criteriaWise == false) {

                chartData = await helperFunc.instanceReportChart(data);

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
                } else {
                    response = chartData;
                }

                if (req.body.pdf) {
                    let pdfReport = await pdfHandler.instanceObservationPdfGeneration(response, storeReportsToS3 = false);
                    if (pdfReport.status && pdfReport.status == "success") {
                        pdfReport.pdfUrl = pdfReportUrl + pdfReport.pdfUrl
                        return resolve(pdfReport);
                    } else {
                        return resolve(pdfReport);
                    }
                } else {
                    return resolve(response);
                }
            }

            if (req.body.scores == true && req.body.criteriaWise == false && criteriaLevelReport == false) {

                chartData = await helperFunc.instanceScoreReportChartObjectCreation(data);

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
                } else {
                    response = chartData;
                }

                if (req.body.pdf) {
                    let pdfHeaderInput = {
                        totalScore: response.totalScore,
                        scoreAchieved: response.scoreAchieved
                    }
                    let pdfReport = await pdfHandler.instanceObservationScorePdfGeneration(response, storeReportsToS3 = false, pdfHeaderInput);
                    if (pdfReport.status && pdfReport.status == "success") {
                        pdfReport.pdfUrl = pdfReportUrl + pdfReport.pdfUrl
                        return resolve(pdfReport);
                    } else {
                        return resolve(pdfReport);
                    }
                } else {
                    return resolve(response);
                }
            }

            if (req.body.scores == false && req.body.criteriaWise == true) {

                let reportType = "criteria";
                chartData = await helperFunc.instanceReportChart(data, reportType);

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
                } else {
                    response = chartData;
                }

                response = await helperFunc.getCriteriawiseReport(response);

                if (req.body.pdf) {
                    let pdfReport = await pdfHandler.instanceCriteriaReportPdfGeneration(response, storeReportsToS3 = false);
                    if (pdfReport.status && pdfReport.status == "success") {
                        pdfReport.pdfUrl = pdfReportUrl + pdfReport.pdfUrl
                        return resolve(pdfReport);
                    } else {
                        return resolve(pdfReport);
                    }

                } else {
                    return resolve(response);
                }
            }

            if (req.body.scores == true && req.body.criteriaWise == true && criteriaLevelReport == false) {

                let reportType = "criteria";
                chartData = await helperFunc.instanceScoreReportChartObjectCreation(data, reportType);

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
                } else {
                    response = chartData;
                }

                response = await helperFunc.getCriteriawiseReport(response);

                if (req.body.pdf) {
                    let pdfHeaderInput = {
                        totalScore: response.totalScore,
                        scoreAchieved: response.scoreAchieved
                    }

                    let pdfReport = await pdfHandler.instanceScoreCriteriaPdfGeneration(response, storeReportsToS3 = false, pdfHeaderInput);
                    if (pdfReport.status && pdfReport.status == "success") {
                        pdfReport.pdfUrl = pdfReportUrl + pdfReport.pdfUrl
                        return resolve(pdfReport);
                    } else {
                        return resolve(pdfReport);
                    }

                } else {
                    return resolve(response);
                }
            }

            if (req.body.scores == true && criteriaLevelReport == true) {
                let response = {
                    "result": true,
                    "programName": data[0].event.programName,
                    "solutionName": data[0].event.solutionName,
                };

                chartData = await helperFunc.entityLevelReportData(data);

                response.reportSections = chartData.result;

                if (response.reportSections.length == 0) {
                    return resolve({
                        result: false,
                        message: "Report can't be generated since Score values does not exists for the submission"
                    })
                }

  
                if (response.reportSections[1].chart.totalSubmissions == 1) {
                    response.reportSections[0].chart.submissionDateArray = [];
                }

                if (req.body.pdf) {
                    let pdfReport = await pdfHandler.assessmentAgainPdfReport(response, storeReportsToS3 = false);
                    pdfReport.pdfUrl = pdfReportUrl + pdfReport.pdfUrl
                    return resolve(pdfReport);
                } else {
                   return resolve(response);
                }
            }

        }
    }
    catch(err) {
        return resolve({
            result: false,
            message: err.message
        });
    }
    })

}

// Entity Observation Report
exports.entityObservationReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        try {

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
       

        // Push criteriaId or questionId filter based on the report Type (question wise and criteria wise)
        if (req.body.filter && req.body.filter.questionId && req.body.filter.questionId.length > 0) {
            bodyParam.filter.fields.push({ "type": "in", "dimension": "questionExternalId", "values": req.body.filter.questionId });
            bodyParam.filter.fields.push({ "type": "not", "field": { "type": "selector", "dimension": "questionAnswer", "value": "" } });
        }

        if (req.body.filter && req.body.filter.criteria && req.body.filter.criteria.length > 0) {
            bodyParam.filter.fields.push({ "type": "in", "dimension": "criteriaId", "values": req.body.filter.criteria });
            bodyParam.filter.fields.push({ "type": "not", "field": { "type": "selector", "dimension": "questionAnswer", "value": "" } });
        }

        let criteriaLevelReport = false;

        if (req.body.scores == true) {
            let getReportType = await getCriteriaLevelReportKey({
                entityId: req.body.entityId,
                observationId: req.body.observationId,
                entityType: req.body.entityType
            });

            if (!getReportType.length) {
                return resolve({
                    "data": filesHelper.submission_not_found_message
                });
            } else {
                criteriaLevelReport = getReportType[0].event.criteriaLevelReport;
            }
        }

        bodyParam.dimensions = [];

        //Push dimensions to the query based on report type
        if (req.body.scores == false && req.body.criteriaWise == false) {
            bodyParam.dimensions.push("completedDate", "questionName", "questionAnswer", "school", "schoolName", "entityType", "observationName", "observationId", "questionResponseType", "questionResponseLabel", "observationSubmissionId", "questionId", "questionExternalId", "instanceId", "instanceParentQuestion", "instanceParentResponsetype", "instanceParentId", "instanceParentEcmSequence", "instanceParentExternalId");
        }

        if (req.body.scores == true && req.body.criteriaWise == false && criteriaLevelReport == false) {
            bodyParam.dimensions.push("questionName", "questionExternalId", "questionResponseType", "minScore", "maxScore", "observationSubmissionId", "school", "schoolName", "districtName", "questionId", "completedDate", "observationName");
            bodyParam.filter.fields.push({ "type": "or", "fields": [{ "type": "selector", "dimension": "questionResponseType", "value": "radio" }, { "type": "selector", "dimension": "questionResponseType", "value": "multiselect" }, { "type": "selector", "dimension": "questionResponseType", "value": "slider" }] })
        }

        if (req.body.scores == false && req.body.criteriaWise == true) {
            bodyParam.dimensions.push("completedDate", "questionName", "questionAnswer", "school", "schoolName", "entityType", "observationName", "observationId", "questionResponseType", "questionResponseLabel", "observationSubmissionId", "questionId", "questionExternalId", "instanceId", "instanceParentQuestion", "instanceParentResponsetype", "instanceParentId", "instanceParentEcmSequence", "instanceParentExternalId", "criteriaName", "criteriaId", "instanceParentCriteriaName", "instanceParentCriteriaId");
        }

        if (req.body.scores == true && req.body.criteriaWise == true && criteriaLevelReport == false) {
            bodyParam.dimensions.push("questionName", "questionExternalId", "questionResponseType", "minScore", "maxScore", "observationSubmissionId", "school", "schoolName", "districtName", "questionId", "completedDate", "observationName", "criteriaName", "criteriaId");
            bodyParam.filter.fields.push({ "type": "or", "fields": [{ "type": "selector", "dimension": "questionResponseType", "value": "radio" }, { "type": "selector", "dimension": "questionResponseType", "value": "multiselect" }, { "type": "selector", "dimension": "questionResponseType", "value": "slider" }] })
        }

        if (req.body.scores == true && criteriaLevelReport == true) {
            bodyParam.filter.fields.push({"type":"selector","dimension":"childType","value":"criteria"});
            bodyParam.filter.fields.push({"type":"selector","dimension":"createdBy","value": req.userDetails.userId});
            bodyParam.dimensions.push("observationSubmissionId", "submissionTitle", "completedDate", "domainName", "criteriaDescription", "level", "label", "programName", "solutionName", "childExternalid", "childName", "childType");
        }

        //pass the query get the result from druid
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

            return resolve({
                "data": message
            });
        }
        else {

            let response;
            let chartData;
            let pdfReportUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=";

            let evidenceData = await getEvidenceData(
                {
                    entityId: req.body.entityId,
                    observationId: req.body.observationId,
                    entityType: req.body.entityType
                });

            if (req.body.scores == false && req.body.criteriaWise == false) {

                chartData = await helperFunc.entityReportChart(data, req.body.entityId, req.body.entityType);

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
                } else {
                    response = chartData;
                }

                if (req.body.pdf) {
                    let pdfReport = await pdfHandler.pdfGeneration(response, storeReportsToS3 = false);
                    if (pdfReport.status && pdfReport.status == "success") {
                        pdfReport.pdfUrl = pdfReportUrl + pdfReport.pdfUrl
                        return resolve(pdfReport);
                    } else {
                        return resolve(pdfReport);
                    }
                } else {
                    return resolve(response);
                }
            }


            if (req.body.scores == true && req.body.criteriaWise == false && criteriaLevelReport == false) {

                chartData = await helperFunc.entityScoreReportChartObjectCreation(data);
                chartData.entityName = data[0].event[req.body.entityType + "Name"];

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
                } else {
                    response = chartData;
                }

                if (req.body.pdf) {
                    let pdfHeaderInput = {
                        entityName: response.entityName,
                        totalObservations: response.totalObservations
                    }
                    let pdfReport = await pdfHandler.instanceObservationScorePdfGeneration(response, storeReportsToS3 = false, pdfHeaderInput);
                    if (pdfReport.status && pdfReport.status == "success") {
                        pdfReport.pdfUrl = pdfReportUrl + pdfReport.pdfUrl
                        return resolve(pdfReport);
                    } else {
                        return resolve(pdfReport);
                    }
                } else {
                    return resolve(response);
                }
            }

            if (req.body.scores == false && req.body.criteriaWise == true) {

                let reportType = "criteria";
                chartData = await helperFunc.entityReportChart(data, req.body.entityId, req.body.entityType, reportType);

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
                } else {
                    response = chartData;
                }

                response = await helperFunc.getCriteriawiseReport(response);

                if (req.body.pdf) {
                    let pdfReport = await pdfHandler.entityCriteriaPdfReportGeneration(response, storeReportsToS3 = false);
                    if (pdfReport.status && pdfReport.status == "success") {
                        pdfReport.pdfUrl = pdfReportUrl + pdfReport.pdfUrl
                        return resolve(pdfReport);
                    } else {
                        return resolve(pdfReport);
                    }
                } else {
                    return resolve(response);
                }
            }

            if (req.body.scores == true && req.body.criteriaWise == true && criteriaLevelReport == false) {

                let reportType = "criteria";
                chartData = await helperFunc.entityScoreReportChartObjectCreation(data, reportType);
                chartData.entityName = data[0].event[req.body.entityType + "Name"];

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-auth-token"]);
                } else {
                    response = chartData;
                }

                response = await helperFunc.getCriteriawiseReport(response);

                if (req.body.pdf) {
                    let pdfHeaderInput = {
                        entityName: response.entityName,
                        totalObservations: response.totalObservations
                    }

                    let pdfReport = await pdfHandler.instanceScoreCriteriaPdfGeneration(response, storeReportsToS3 = false, pdfHeaderInput);
                    if (pdfReport.status && pdfReport.status == "success") {
                        pdfReport.pdfUrl = pdfReportUrl + pdfReport.pdfUrl
                        return resolve(pdfReport);
                    } else {
                        return resolve(pdfReport);
                    }

                } else {
                    return resolve(response);
                }
            }

            if (req.body.scores == true && criteriaLevelReport == true) {

                let response = {
                    "result": true,
                    "programName": data[0].event.programName,
                    "solutionName": data[0].event.solutionName,
                };

                chartData = await helperFunc.entityLevelReportData(data);

                response.reportSections = chartData.result; 
                response.filters = chartData.filters;

                if (response.reportSections.length == 0) {
                    return resolve({
                        result: false,
                        message: "Report can't be generated since Score values does not exists for the submissions"
                    })
                }

                if (response.reportSections[1].chart.totalSubmissions == 1) {
                    response.reportSections[0].chart.submissionDateArray = [];
                }

                if (req.body.pdf) {

                    let pdfReport = await pdfHandler.assessmentAgainPdfReport(response, storeReportsToS3 = false);
                    pdfReport.pdfUrl = pdfReportUrl + pdfReport.pdfUrl
                    return resolve(pdfReport);

                } else {
                    return resolve(response);
                }
            }

        }
        }
        catch(err) {
            return resolve({
                result: false,
                message: err.message
            });
        }
    })
}


//Survey report
exports.surveyReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        if (req.body.submissionId) {
            let response = await surveysHelper.surveySubmissionReport(req, res);
            return resolve(response);

        } else if (req.body.solutionId) {
            let response = await surveysHelper.surveySolutionReport(req, res);
            return resolve(response);

        } else {
            return resolve({
                result: false,
                message: "Report can't be generated for invalid request"
            })
        }

    })
}


// Get criteriaLevelReport key value
const getCriteriaLevelReportKey = async function (inputData) {

    return new Promise(async function (resolve, reject) {

        let query = {};

        if (inputData.submissionId) {
            query = { "queryType": "groupBy", "dataSource": process.env.OBSERVATION_DATASOURCE_NAME, "granularity": "all", "dimensions": ["criteriaLevelReport"], "filter": { "type": "and", "fields": [{"type": "selector", "dimension": "observationSubmissionId", "value": inputData.submissionId },{ "type": "not", "field": { "type": "selector", "dimension": "criteriaLevelReport", "value": "" }}]}, "aggregations": [], "postAggregations": [], "limitSpec": {}, "intervals": ["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"] }
        }

        if (inputData.entityId && inputData.observationId && inputData.entityType) {
            query = { "queryType": "groupBy", "dataSource": process.env.OBSERVATION_DATASOURCE_NAME, "granularity": "all", "dimensions": ["criteriaLevelReport"], "filter": { "type": "and", "fields": [{ "type": "selector", "dimension": inputData.entityType, "value": inputData.entityId }, { "type": "selector", "dimension": "observationId", "value": inputData.observationId },{ "type": "not", "field": { "type": "selector", "dimension": "criteriaLevelReport", "value": "" } }] }, "aggregations": [], "postAggregations": [], "limitSpec": {}, "intervals": ["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"] }
        }

        //pass the query get the result from druid
        let options = gen.utils.getDruidConnection();
        options.method = "POST";
        options.body = query;
        let data = await rp(options);

        return resolve(data);

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