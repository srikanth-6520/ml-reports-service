const rp = require('request-promise');
const request = require('request');
const assessmentService = require('./assessment_service');
const helperFunc = require('./chart_data_v3');
const pdfHandler = require('./common_handler_v2');
const filesHelper = require('../common/files_helper');
const surveysHelper = require('./surveys_v2');

// Instance observation report
exports.instaceObservationReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        try {

        let bodyParam = gen.utils.getDruidQuery("instance_observation_query");
            console.log({DruidQuery: bodyParam});
        if (process.env.OBSERVATION_DATASOURCE_NAME) {
            bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
        }

        //Apply submissionId filter
        bodyParam.filter.fields[0].value = req.body.submissionId;

        //Push criteriaId or questionId filter based on the report Type (question wise and criteria wise)
        if (req.body.criteriaWise == false && req.body.filter && req.body.filter.questionId && req.body.filter.questionId.length > 0) {
            bodyParam.filter.fields.push({ "type": "in", "dimension": "questionExternalId", "values": req.body.filter.questionId });
        }

        if (req.body.criteriaWise == true && req.body.filter && req.body.filter.criteria && req.body.filter.criteria.length > 0) {
            bodyParam.filter.fields.push({ "type": "in", "dimension": "criteriaId", "values": req.body.filter.criteria });
        }

        let criteriaLevelReport = false;
        if (req.body.scores == true) {
            
            let getReportType = await getCriteriaLevelReportKey({ submissionId: req.body.submissionId});
            if (!getReportType.length) {
                console.log({getReportType: 'NotFound'})
                return resolve({
                    result: false,
                    message: filesHelper.submission_not_found_message
                });
            } else {
                criteriaLevelReport = getReportType[0].event.criteriaLevelReport == "true";
            }
        }
        console.log({criteriaLevelReport});

        if (criteriaLevelReport == false) {
            bodyParam.filter.fields.push({ "type": "not", "field": { "type": "selector", "dimension": "questionAnswer", "value": "" } });
        }

        bodyParam.dimensions = ["programName", "solutionName", req.body.entityType + "Name"];
        if (!bodyParam.dimensions.includes("districtName")) {
            bodyParam.dimensions.push("districtName");
        }

        //Push dimensions to the query based on report type
        if (req.body.scores == false && req.body.criteriaWise == false) {
            bodyParam.dimensions.push("questionName", "questionAnswer", "school", "remarks", "entityType", "observationName", "observationId", "questionResponseType", "questionResponseLabel", "questionId", "questionExternalId", "instanceId", "instanceParentQuestion", "instanceParentResponsetype", "instanceParentId", "questionSequenceByEcm", "instanceParentExternalId", "instanceParentEcmSequence","completedDate");
        }

        if (req.body.scores == true && req.body.criteriaWise == false && criteriaLevelReport == false) {
            bodyParam.dimensions.push("questionName", "questionAnswer", "questionExternalId", "questionResponseType", "minScore", "maxScore", "totalScore", "scoreAchieved", "observationName", "completedDate");
            bodyParam.filter.fields.push({"type":"or","fields":[{"type":"selector","dimension":"questionResponseType","value":"radio"},{"type":"selector","dimension":"questionResponseType","value":"multiselect"},{"type":"selector","dimension":"questionResponseType","value":"slider"}]})
        }

        if (req.body.scores == false && req.body.criteriaWise == true) {
            bodyParam.dimensions.push("questionName", "questionAnswer", "school", "remarks", "entityType", "observationName", "observationId", "questionResponseType", "questionResponseLabel", "questionId", "questionExternalId", "instanceId", "instanceParentQuestion", "instanceParentResponsetype", "instanceParentId", "questionSequenceByEcm", "instanceParentExternalId", "instanceParentEcmSequence", "criteriaName", "criteriaId", "instanceParentCriteriaName", "instanceParentCriteriaId", "completedDate");
        }

        if (req.body.scores == true && req.body.criteriaWise == true && criteriaLevelReport == false) {
            bodyParam.dimensions.push("questionName", "questionAnswer", "questionExternalId", "questionResponseType", "minScore", "maxScore", "totalScore", "scoreAchieved", "observationName", "criteriaName", "criteriaId", "completedDate");
            bodyParam.filter.fields.push({"type":"or","fields":[{"type":"selector","dimension":"questionResponseType","value":"radio"},{"type":"selector","dimension":"questionResponseType","value":"multiselect"},{"type":"selector","dimension":"questionResponseType","value":"slider"}]})
        }

        if (req.body.scores == true && criteriaLevelReport == true) {
            bodyParam.filter.fields.push({"type":"selector","dimension":"childType","value":"criteria"})
            bodyParam.dimensions.push("observationSubmissionId", "completedDate", "domainName", "criteriaDescription", "level", "label", "childExternalid", "childName", "childType", "solutionId","criteriaScore");
        }

        if (!bodyParam.dimensions.includes('completedDate')) {
            bodyParam.dimensions.push('completedDate');
        }

        //pass the query get the result from druid
        let options = gen.utils.getDruidConnection();
        options.method = "POST";
        options.body = bodyParam;
        console.log({druidConnection: options});
        let data = await rp(options);

        if (!data.length) {
            let message;
            let getSubmissionStatusResponse = await assessmentService.getObservationSubmissionStatusById
                (
                    req.body.submissionId,
                    req.headers["x-authenticated-user-token"]
                )
            console.log({getSubmissionStatusResponse})    

            if (getSubmissionStatusResponse.result &&
                getSubmissionStatusResponse.result.status == filesHelper.submission_status_completed) {
                message = filesHelper.submission_not_found_message
            }
            else {
                message = "SUBMISSION_ID_NOT_FOUND";
            }

            return resolve({
                result: false,
                message: message
            });
        }
        else {

            let response;
            let chartData;

            let evidenceData = await getEvidenceData({ submissionId: req.body.submissionId });
            console.log({getEvidenceData: true});
            //Send report based on input
            console.log({ scores: req.body.scores, criteriaWise: req.body.criteriaWise, criteriaLevelReport })
            if (req.body.scores == false && req.body.criteriaWise == false) {
                chartData = await helperFunc.instanceReportChart(data);
                chartData.entityName = data[0].event[req.body.entityType + "Name"];

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-authenticated-user-token"]);
                } else {
                    response = chartData;
                }

                if (req.body.pdf) {
                    let pdfReport = await pdfHandler.instanceObservationPdfGeneration(response);
                    return resolve(pdfReport);
                } else {
                    return resolve(response);
                }
            }

            if (req.body.scores == true && req.body.criteriaWise == false && criteriaLevelReport == false) {

                chartData = await helperFunc.instanceScoreReportChartObjectCreation(data);
                chartData.entityName = data[0].event[req.body.entityType + "Name"];

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-authenticated-user-token"]);
                } else {
                    response = chartData;
                }

                if (req.body.pdf) {
                    let pdfHeaderInput = {
                        totalScore: response.totalScore,
                        scoreAchieved: response.scoreAchieved
                    }
                    let pdfReport = await pdfHandler.instanceObservationScorePdfGeneration(response, pdfHeaderInput);
                    return resolve(pdfReport);
                    
                } else {
                    return resolve(response);
                }
            }

            if (req.body.scores == false && req.body.criteriaWise == true) {

                let reportType = "criteria";
                chartData = await helperFunc.instanceReportChart(data, reportType);
                chartData.entityName = data[0].event[req.body.entityType + "Name"];

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-authenticated-user-token"]);
                } else {
                    response = chartData;
                }

                response = await helperFunc.getCriteriawiseReport(response);

                if (req.body.pdf) {
                    let pdfReport = await pdfHandler.instanceCriteriaReportPdfGeneration(response);
                    return resolve(pdfReport);
                } else {
                    return resolve(response);
                }
            }

            if (req.body.scores == true && req.body.criteriaWise == true && criteriaLevelReport == false) {

                let reportType = "criteria";
                chartData = await helperFunc.instanceScoreReportChartObjectCreation(data, reportType);
                chartData.entityName = data[0].event[req.body.entityType + "Name"];

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-authenticated-user-token"]);
                } else {
                    response = chartData;
                }

                response = await helperFunc.getCriteriawiseReport(response);

                if (req.body.pdf) {
                    let pdfHeaderInput = {
                        totalScore: response.totalScore,
                        scoreAchieved: response.scoreAchieved
                    }

                    let pdfReport = await pdfHandler.instanceScoreCriteriaPdfGeneration(response, pdfHeaderInput);
                    return resolve(pdfReport);
                } else {
                    return resolve(response);
                }
            }

            if (req.body.scores == true && criteriaLevelReport == true) {
                let response = {
                    "result": true,
                    "programName": data[0].event.programName,
                    "solutionName": data[0].event.solutionName,
                    "solutionId": data[0].event.solutionId,
                    "completedDate": data[0].event.completedDate,
                    "entityName": data[0].event[req.body.entityType + "Name"]
                };

                chartData = await helperFunc.entityLevelReportData(data);

                for (const element of data) {
                    if (response.completedDate) {
                        if (new Date(element.event.completedDate) > new Date(response.completedDate)) {
                            response.completedDate = element.event.completedDate;
                        }
                    }
                }

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
                    let pdfReport = await pdfHandler.assessmentAgainPdfReport(response);
                    console.log({pdfReport})
                    return resolve(pdfReport);
                } else {

                   response.improvementProjectSuggestions = [];
                   let impSuggestions = await checkIfImpSuggesionExists(req.body.submissionId);

                   if (impSuggestions.length > 0) {
                    response.improvementProjectSuggestions = await helperFunc.improvementProjectsObjectCreate(impSuggestions);
                  }
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
        }

        if (req.body.filter && req.body.filter.criteria && req.body.filter.criteria.length > 0) {
            bodyParam.filter.fields.push({ "type": "in", "dimension": "criteriaId", "values": req.body.filter.criteria });
        }

        let criteriaLevelReport = false;

        if (req.body.scores == true) {
            let getReportType = await getCriteriaLevelReportKey({
                entityId: req.body.entityId,
                observationId: req.body.observationId,
                entityType: req.body.entityType
            });

            if (!getReportType.length) {
                console.log({getReportTypeInEntityObservationReport: 'NotFound'})
                return resolve({
                    result: false,
                    message: filesHelper.submission_not_found_message
                });
            } else {
                criteriaLevelReport = getReportType[0].event.criteriaLevelReport == "true";
            }
        }

        if (criteriaLevelReport == false) {
            bodyParam.filter.fields.push({ "type": "not", "field": { "type": "selector", "dimension": "questionAnswer", "value": "" } });
        }

        console.log({criteriaLevelReport});

        bodyParam.dimensions = ["programName","solutionName","submissionTitle",entityType + "Name"];
        if (!bodyParam.dimensions.includes("districtName")) {
            bodyParam.dimensions.push("districtName");
        }

        //Push dimensions to the query based on report type
        if (req.body.scores == false && req.body.criteriaWise == false) {
            bodyParam.dimensions.push("completedDate", "questionName", "questionAnswer", "school", "entityType", "observationName", "observationId", "questionResponseType", "questionResponseLabel", "observationSubmissionId", "questionId", "questionExternalId", "instanceId", "instanceParentQuestion", "instanceParentResponsetype", "instanceParentId", "instanceParentEcmSequence", "instanceParentExternalId");
        }

        if (req.body.scores == true && req.body.criteriaWise == false && criteriaLevelReport == false) {
            bodyParam.dimensions.push("questionName", "questionExternalId", "questionResponseType", "minScore", "maxScore", "observationSubmissionId", "school", "questionId", "completedDate", "observationName");
            bodyParam.filter.fields.push({ "type": "or", "fields": [{ "type": "selector", "dimension": "questionResponseType", "value": "radio" }, { "type": "selector", "dimension": "questionResponseType", "value": "multiselect" }, { "type": "selector", "dimension": "questionResponseType", "value": "slider" }] })
        }

        if (req.body.scores == false && req.body.criteriaWise == true) {
            bodyParam.dimensions.push("completedDate", "questionName", "questionAnswer", "school", "entityType", "observationName", "observationId", "questionResponseType", "questionResponseLabel", "observationSubmissionId", "questionId", "questionExternalId", "instanceId", "instanceParentQuestion", "instanceParentResponsetype", "instanceParentId", "instanceParentEcmSequence", "instanceParentExternalId", "criteriaName", "criteriaId", "instanceParentCriteriaName", "instanceParentCriteriaId");
        }

        if (req.body.scores == true && req.body.criteriaWise == true && criteriaLevelReport == false) {
            bodyParam.dimensions.push("questionName", "questionExternalId", "questionResponseType", "minScore", "maxScore", "observationSubmissionId", "school", "questionId", "completedDate", "observationName", "criteriaName", "criteriaId");
            bodyParam.filter.fields.push({ "type": "or", "fields": [{ "type": "selector", "dimension": "questionResponseType", "value": "radio" }, { "type": "selector", "dimension": "questionResponseType", "value": "multiselect" }, { "type": "selector", "dimension": "questionResponseType", "value": "slider" }] })
        }

        if (req.body.scores == true && criteriaLevelReport == true) {
            bodyParam.filter.fields.push({"type":"selector","dimension":"childType","value":"criteria"});
            bodyParam.filter.fields.push({"type":"selector","dimension":"createdBy","value": req.userDetails.userId});
            bodyParam.dimensions.push("observationSubmissionId", "completedDate", "domainName", "criteriaDescription", "level", "label", "childExternalid", "childName", "childType", "solutionId","criteriaScore");
        }

        if (!bodyParam.dimensions.includes('completedDate')) {
            bodyParam.dimensions.push('completedDate');
        }

        console.log({druidQuery: JSON.stringify(bodyParam)});

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
                    req.headers["x-authenticated-user-token"]
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
                result: false,
                message: message
            });
        }
        else {

            let response;
            let chartData;

            let evidenceData = await getEvidenceData(
                {
                    entityId: req.body.entityId,
                    observationId: req.body.observationId,
                    entityType: req.body.entityType
                });

            if (req.body.scores == false && req.body.criteriaWise == false) {

                chartData = await helperFunc.entityReportChart(data, req.body.entityId, req.body.entityType);
                chartData.entityName = data[0].event[req.body.entityType + "Name"];

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-authenticated-user-token"]);
                } else {
                    response = chartData;
                }

                if (req.body.pdf) {
                    let pdfReport = await pdfHandler.pdfGeneration(response);
                    return resolve(pdfReport);
                    
                } else {
                    return resolve(response);
                }
            }


            if (req.body.scores == true && req.body.criteriaWise == false && criteriaLevelReport == false) {

                chartData = await helperFunc.entityScoreReportChartObjectCreation(data);
                chartData.entityName = data[0].event[req.body.entityType + "Name"];

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-authenticated-user-token"]);
                } else {
                    response = chartData;
                }

                if (req.body.pdf) {
                    let pdfHeaderInput = {
                        entityName: response.entityName,
                        totalObservations: response.totalObservations
                    }
                    let pdfReport = await pdfHandler.instanceObservationScorePdfGeneration(response, pdfHeaderInput);
                    return resolve(pdfReport);
                    
                } else {
                    return resolve(response);
                }
            }

            if (req.body.scores == false && req.body.criteriaWise == true) {

                let reportType = "criteria";
                chartData = await helperFunc.entityReportChart(data, req.body.entityId, req.body.entityType, reportType);
                chartData.entityName = data[0].event[req.body.entityType + "Name"];

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-authenticated-user-token"]);
                } else {
                    response = chartData;
                }

                response = await helperFunc.getCriteriawiseReport(response);

                if (req.body.pdf) {
                    let pdfReport = await pdfHandler.entityCriteriaPdfReportGeneration(response);
                    return resolve(pdfReport);
                } else {
                    return resolve(response);
                }
            }

            if (req.body.scores == true && req.body.criteriaWise == true && criteriaLevelReport == false) {

                let reportType = "criteria";
                chartData = await helperFunc.entityScoreReportChartObjectCreation(data, reportType);
                chartData.entityName = data[0].event[req.body.entityType + "Name"];

                if (evidenceData.result) {
                    response = await helperFunc.evidenceChartObjectCreation(chartData, evidenceData.data, req.headers["x-authenticated-user-token"]);
                } else {
                    response = chartData;
                }

                response = await helperFunc.getCriteriawiseReport(response);

                if (req.body.pdf) {
                    let pdfHeaderInput = {
                        entityName: response.entityName,
                        totalObservations: response.totalObservations
                    }

                    let pdfReport = await pdfHandler.instanceScoreCriteriaPdfGeneration(response, pdfHeaderInput);
                    return resolve(pdfReport);
                } else {
                    return resolve(response);
                }
            }

            if (req.body.scores == true && criteriaLevelReport == true) {

                let response = {
                    "result": true,
                    "programName": data[0].event.programName,
                    "solutionName": data[0].event.solutionName,
                    "solutionId": data[0].event.solutionId,
                    "completedDate": data[0].event.completedDate,
                    "entityName": data[0].event[req.body.entityType + "Name"]
                };

                chartData = await helperFunc.entityLevelReportData(data);
                chartData.entityName = data[0].event[req.body.entityType + "Name"];

                for (const element of data) {
                    if (response.completedDate) {
                        if (new Date(element.event.completedDate) > new Date(response.completedDate)) {
                            response.completedDate = element.event.completedDate;
                        }
                    }
                }

                response.reportSections = chartData.result; 
                response.filters = chartData.filters;
                let submissionId = chartData.submissionId;

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

                    let pdfReport = await pdfHandler.assessmentAgainPdfReport(response);
                    return resolve(pdfReport);

                } else {

                    response.improvementProjectSuggestions = [];
                    let impSuggestions = await checkIfImpSuggesionExists(submissionId);
 
                    if (impSuggestions.length > 0) {
                     response.improvementProjectSuggestions = await helperFunc.improvementProjectsObjectCreate(impSuggestions);
                   }

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
        console.log({getCriteriaLevelReportKeyQuery: JSON.stringify(query)});
        //pass the query get the result from druid
        let options = gen.utils.getDruidConnection();
        options.method = "POST";
        options.body = query;
        let data = await rp(options);
        console.log({ DruidDataLength: data.length })
        return resolve(data);

    })
}


//Check if impSuggestion exists or not
const checkIfImpSuggesionExists = async function(submissionId) {
    return new Promise(async function (resolve, reject) {

        let query = { "queryType": "groupBy", "dataSource": process.env.OBSERVATION_DATASOURCE_NAME, "granularity": "all", "dimensions": ["imp_project_id","imp_project_title","imp_project_externalId","imp_project_goal","criteriaName","level","label","criteriaId"], "filter": { "type": "and", "fields": [{"type": "selector", "dimension": "observationSubmissionId", "value": submissionId },{ "type": "not", "field": { "type": "selector", "dimension": "imp_project_id", "value": "" }}]}, "aggregations": [], "postAggregations": [], "limitSpec": {}, "intervals": ["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"] };
        
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
        let entityId = inputObj.entityId;
        let observationId = inputObj.observationId;
        let entityType = inputObj.entityType;
  
        // let bodyParam = JSON.parse(result.query);
        let bodyParam = gen.utils.getDruidQuery("get_evidence_query");
  
        //based on the given input change the filter
        let filter = {};
  
        if (submissionId) {
          filter = { "type": "selector", "dimension": "observationSubmissionId", "value": submissionId }
        } else if (entityId && observationId && entityType) {
          filter = { "type": "and", "fields": [{ "type": "selector", "dimension": "entity", "value": entityId }, { "type": "selector", "dimension": "observationId", "value": observationId }] }
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
          message: err.message
        };
        resolve(response);
      };
    })
}

//generate question response report
exports.questionResponseReport = async function ( req ,res ) {
    try {
        //get druid query for question response report
        const bodyParams = gen.utils.getDruidQuery('question_response_query');
      
        //Apply program id and solution id filters to druid query
        bodyParams.filter.fields.push(
            {
                "type": "selector",
                "dimension": "solutionId",
                "value": req.params._id
            }
        );
        bodyParams.columns.push( "solutionId");  
       
        //Apply optional filters if they are provided by the user { programId, organization, district, block or school }
        if( req.query.programId && req.query.programId != "" ) {
            bodyParams.filter.fields.push(
                {
                    "type": "selector",
                    "dimension": "programId",
                    "value": req.query.programId
                }
            );          
        }

        if( req.body.organization && req.body.organization != "" ) {
            bodyParams.filter.fields.push(
                {
                    "type": "search",
                    "dimension": "organisation_name",
                    "query": {
                        "type": "insensitive_contains",
                        "value": req.body.organization
                    }
                }
            );
            bodyParams.columns.push( "organisation_name");           
        }
       
        if( req.body.block && req.body.block != "" ) {
            bodyParams.filter.fields.push(
                {
                    "type": "selector",
                    "dimension": "block_externalId",
                    "value":  req.body.block
                }
            );   
            bodyParams.columns.push( "user_blockName");    
        }
        
        if( req.body.district && req.body.district != "" ) {
            bodyParams.filter.fields.push(
                {
                    "type": "selector",
                    "dimension": "district_externalId",
                    "value": req.body.district
                }
            );   
            bodyParams.columns.push( "user_districtName");           
        }
        let datefilter = {};
        if ( req.body.from && req.body.from !="" && req.body.to && req.body.to !="" ) {

            let from = await utils.getDruidIntervalDate(req.body.from);
            let to = await utils.getDruidIntervalDate(req.body.to);
            let druidInterval = from + '/' + to;
            bodyParams.intervals = druidInterval;
            datefilter.from = req.body.from;
            datefilter.to = req.body.to;

        } else {

            bodyParams.intervals = "1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00";

        }
        
        //pass the query get the result from druid
        const options = gen.utils.getDruidConnection();
        options.method = "POST";
        options.body = bodyParams;
        const data = await rp(options);

        //check data from druid
        if( data.length ) {
            //send data for processing
            const response = await helperFunc.questionResponseReportDataObjectCreation(data, datefilter);
            const result = await pdfHandler.questionResponseReportPdf(response);
            return result;
        } else {
            return {
                "result" : false,
                "data" : "QUESTION_RESPONSE_NOT_FOUND"
            }
        }

    } catch(error) {
        let response = {
            result: false,
            message: error.message
          };
          return response;
    }
}