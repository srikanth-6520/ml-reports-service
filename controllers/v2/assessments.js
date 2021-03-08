const rp = require('request-promise');
const request = require('request');
const pdfHandler = require('../../helper/common_handler_v2');
const assessmentService = require('../../helper/assessment_service');
const helperFunc = require('../../helper/chart_data_v2');

/**
   * @api {post} /dhiti/api/v2/assessments/entity
   * Entity assessment
   * @apiVersion 1.0.0
   * @apiGroup Assessments
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
* "entityId": "",
* "entityType": ""
* "progarmId": ""
* "solutionId": ""
* "immediateChildEntityType": ""
* }
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "result": true,
*       "title": "DCPCR program",
*       "reportSections":[
        {
          "order": 1,
          "chart": {
            "type": "horizontalBar",
            "data": {
                "datasets": [
                    {
                        "label": "L1",
                        "data": [
                            2,
                            5,
                            9
                        ]
                    },
                    {
                        "label": "L2",
                        "data": [
                            4,
                            9,
                            5
                        ]
                    }]
                },
                "options": {
                    "title": {
                        "display": true,
                        "text": "Criteria vs level mapping aggregated at Entity level"
                    },
                    "scales": {
                        "xAxes": [
                            {
                                "stacked": true,
                                "gridLines": {
                                    "display": false
                                },
                                "scaleLabel": {
                                    "display": true,
                                    "labelString": "Criteria"
                                }
                            }
                        ],
                        "yAxes": [
                            {
                                "stacked": true
                            }
                        ]
                    },
                    "legend": {
                        "display": true
                    }
                }
            }
        },
        {
         "order": 2,
         "chart": {
            "type": "expansion",
            "title": "Descriptive view",
            "entities": [{
                "entityName": "Nigam Pratibha Vidyalaya (Girls), Jauna Pur, New Delhi",
                "entityId": "5c0bbab881bdbe330655da7f",
                "domains": [{
                    "domainName": "Community Participation and EWS/DG Integration ",
                    "criterias":[{
                        "name": "Entitlement Provisioning",
                        "level": "L1"
                    }]
                }]
            }]
         }
        }]
*    }
   * @apiUse errorBody
   */

//Controller for entity assessment report
exports.entity = async function (req, res) {
    return new Promise(async function (resolve, reject) {

        let data = await assessmentReportGetChartData(req, res);
        res.send(data);

    })
}

async function assessmentReportGetChartData(req, res) {
    return new Promise(async function (resolve, reject) {

        try {

            if (!req.body.entityId || !req.body.entityType || !req.body.programId || !req.body.solutionId) {
                res.status(400);
                let response = {
                    result: false,
                    message: 'entityId,entityType,programId and solutionId are required fields'
                }
                resolve(response);
            }
            else {

                let requestToPdf = req.body.requestToPdf ? req.body.requestToPdf : false;
                let childType = req.body.immediateChildEntityType;

                let bodyParam = gen.utils.getDruidQuery("entity_assessment_query");

                if (process.env.ASSESSMENT_DATASOURCE_NAME) {
                    bodyParam.dataSource = process.env.ASSESSMENT_DATASOURCE_NAME;
                }

                //dynamically appending values to filter
                bodyParam.filter.fields[0].dimension = req.body.entityType;
                bodyParam.filter.fields[0].value = req.body.entityId;
                bodyParam.filter.fields[1].value = req.body.programId;
                bodyParam.filter.fields[2].value = req.body.solutionId;

                if (req.body.immediateChildEntityType == "") {
                    bodyParam.dimensions.push(req.body.entityType, req.body.entityType + "Name");
                }
                else {
                    let entityName = req.body.immediateChildEntityType + "Name";
                    bodyParam.dimensions.push(req.body.immediateChildEntityType, entityName);
                }
                //pass the query as body param and get the resul from druid
                let druidOptions = gen.utils.getDruidConnection();
                druidOptions.method = "POST";
                druidOptions.body = bodyParam;
                let data = await rp(druidOptions);

                if (!data.length) {

                    //==========Production hotfix code============================

                    //dynamically appending values to filter
                    bodyParam.filter.fields[0].dimension = "school";
                    childType = "";

                    //pass the query as body param and get the resul from druid
                    // let druidOptions = gen.utils.getDruidConnection();
                    druidOptions.method = "POST";
                    druidOptions.body = bodyParam;
                    let assessData = await rp(druidOptions);

                    if (!assessData.length) {
                        resolve({ "result": false, "data": {} })
                    }
                    else {

                        let inputObj = {
                            data: assessData,
                            entityName: "domainName",
                            childEntity: "",
                        }

                        //call the function entityAssessmentChart to get the data for stacked bar chart 
                        let responseObj = await helperFunc.entityAssessmentChart(inputObj, requestToPdf);

                        if (Object.keys(responseObj).length === 0) {
                            return resolve({ "reportSections": [] });
                        }

                        responseObj.title = "Performance Report";
                        responseObj.reportSections[0].chart.grandChildEntityType = "";
                        resolve(responseObj);
                    }
                }
                else {

                    let inputObj = {
                        data: data,
                        parentEntity: req.body.entityType,
                        entityName: req.body.immediateChildEntityType ? req.body.immediateChildEntityType + "Name" : "domainName",
                        childEntity: req.body.immediateChildEntityType,
                    }

                    //call the function entityAssessmentChart to get the data for stacked bar chart 
                    let responseObj = await helperFunc.entityAssessmentChart(inputObj, requestToPdf);

                    if (Object.keys(responseObj).length === 0) {
                        return resolve({ "reportSections": [] });
                    }

                    if (childType) {

                        //call samiksha entity list assessment API to get the grandchildEntity type.
                        let grandChildEntityType = await assessmentService.getEntityList(req.body.entityId, childType, req.headers["x-auth-token"]);

                        if (grandChildEntityType.status == 200 && grandChildEntityType.result[0].subEntityGroups.length > 0) {

                            responseObj.reportSections[0].chart.grandChildEntityType = grandChildEntityType.result[0].immediateSubEntityType

                        }
                        else {
                            responseObj.reportSections[0].chart.grandChildEntityType = "";
                        }
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
    });
}

//Function to generate PDF for entity assessment API
exports.pdfReports = async function (req, res) {

    if (!req.body.entityId || !req.body.entityType || !req.body.programId || !req.body.solutionId) {
        res.status(400);
        let response = {
            result: false,
            message: 'entityId,entityType,programId,solutionId and immediateChildEntityType are required fields'
        }
        res.send(response);
    }
    else {

        req.body.requestToPdf = true;

        if (req.body.isAssessAgain) {

            let assessmentRes = await entityReportChartCreateFunction(req, res);

            if (assessmentRes.result == true) {

                let response = await pdfHandler.assessmentAgainPdfReport(assessmentRes, storeReportsToS3 = false);

                response.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + response.pdfUrl
                res.send(response);
            }
            else {
                res.send(assessmentRes);
            }
        } else {
            let assessmentRes = await assessmentReportGetChartData(req, res);

            if (assessmentRes.result == true) {

                let response = await pdfHandler.assessmentPdfGeneration(assessmentRes, storeReportsToS3 = false);

                response.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + response.pdfUrl
                res.send(response);
            }
            else {
                res.send(assessmentRes);
            }
        }
    }
};


/**
   * @api {post} /dhiti/api/v2/assessments/entityReport
   * entity level assessment report
   * @apiVersion 1.0.0
   * @apiGroup Assessments
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
* "entityId": "",
* "entityType": "",
* "programId": "",
* "solutionId": ""
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*   {
    "result": true,
    "programName": "",
    "solutionName": "",
    "reportSections": [{
        "order": 1,
        "chart": {
            "type": "horizontalBar",
            "title": "",
            "submissionDateArray": [
                "26 September 2019",
                "26 September 2019",
                "26 September 2019"
            ],
            "data": {
                "labels": [
                    "Community Participation and EWS/DG Integration ",
                    "Safety and Security",
                    "Teaching and Learning",
                ],
                "datasets": [
                    {
                        "label": "L1",
                        "data": [
                            2,
                            2,
                            5
                        ]
                    },
                    {
                        "label": "L2",
                        "data": [
                            4,
                            3,
                            9
                        ]
                    }
                ]
            }
        },
    {
       "order": 2,
       "chart": {
            "type": "expansion",
            "title": "Descriptive view",
            "heading": ["Assess. 1","Assess. 2"],
            "domains": [{
                "domainName": "Community Participation and EWS/DG Integration",
                "criterias": [{
                   "criteriaName": "Academic Integration",
                   "levels": [ "Level 4"]
                }]
            }]
        }
    }]
}
   * @apiUse errorBody
   */
exports.entityReport = async function(req,res){

    let data = await entityReportChartCreateFunction(req, res);
    res.send(data);
}


async function entityReportChartCreateFunction(req, res) {
    return new Promise(async function (resolve, reject) {
        try {
            if (!req.body.entityId || !req.body.entityType || !req.body.programId || !req.body.solutionId) {
                res.status(400);
                let response = {
                    result: false,
                    message: 'entityId,entityType,programId,solutionId are required fields'
                }
                resolve(response);
            }
            else {
                
                let requestToPdf = req.body.requestToPdf ? req.body.requestToPdf : false;

                let bodyParam = gen.utils.getDruidQuery("entity_level_assessment_report_query");

                if (process.env.ASSESSMENT_DATASOURCE_NAME) {
                    bodyParam.dataSource = process.env.ASSESSMENT_DATASOURCE_NAME;
                }

                //dynamically appending values to filter
                bodyParam.filter.fields[0].dimension = req.body.entityType;
                bodyParam.filter.fields[0].value = req.body.entityId;
                bodyParam.filter.fields[1].value = req.body.programId;
                bodyParam.filter.fields[2].value = req.body.solutionId;
                if (req.body.submissionId) {
                    bodyParam.filter.fields.push({ "type": "selector", "dimension": "submissionId", "value": req.body.submissionId });
                }

                let options = gen.utils.getDruidConnection();
                options.method = "POST";
                options.body = bodyParam;

                let data = await rp(options);

                if (!data.length) {
                    resolve({ "result": false, "data": "NO_ASSESSMENT_MADE_FOR_THE_ENTITY" })
                }
                else {

                    let response = {
                        "result": true,
                        "programName": data[0].event.programName,
                        "solutionName": data[0].event.solutionName,
                    };

                     let reportData = await helperFunc.entityLevelReportData(data, requestToPdf);

                    response.reportSections = reportData;

                    if(req.body.submissionId) {
                      response.reportSections[0].chart.submissionDateArray = [];
                    }

                    return resolve(response);
                }
            }
        }
        catch (err) {
            let response = {
                result: false,
                message: err.message,
                err: err
            }
            resolve(response);
        }

    })
}
