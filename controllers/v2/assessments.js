const rp = require('request-promise');
const request = require('request');
const helperFunc = require('../../helper/chart_data');
const pdfHandler = require('../../helper/common_handler');
const assessmentService = require('../../helper/assessment_service');
const storePdfReportsToS3 = (!process.env.STORE_PDF_REPORTS_IN_AWS_ON_OFF || process.env.STORE_PDF_REPORTS_IN_AWS_ON_OFF != "OFF") ? "ON" : "OFF"


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
*       "title": "",
*       "reportSections":[
        {
          "order": "",
          "chart": {
             "type": "",
             "nextChildEntityType": "",
             "stacking": "",
             "title": "",
             "xAxis": {
               "categories": [],
               "title": "",
             },
             "yAxis": {
                "title": {
                    "text": ""
                }
             },
             "data": [{
                 "name": "",
                 "data": []
             }]
          }
        },
        {
         "order": "",
         "chart": {
            "type": "",
            "title": "",
            "entities": [{
                "entityName": "",
                "entityId": "",
                "domains": [{
                    "domainName": "",
                    "domainId": "",
                    "criterias":[{
                        "name": "",
                        "level": ""
                    }]
                }]
            }]
         }
        }
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
                let response = {
                    result: false,
                    message: 'entityId,entityType,programId and solutionId are required fields'
                }
                resolve(response);
            }
            else {

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
                        let responseObj = await helperFunc.entityAssessmentChart(inputObj);

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
                    let responseObj = await helperFunc.entityAssessmentChart(inputObj);

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
                message: 'INTERNAL_SERVER_ERROR'
            }
            resolve(response);
        }
    });
}


//Function to generate PDF for entity assessment API
exports.pdfReports = async function (req, res) {

    if (!req.body.entityId || !req.body.entityType || !req.body.programId || !req.body.solutionId) {
        res.status(400);
        var response = {
            result: false,
            message: 'entityId,entityType,programId,solutionId and immediateChildEntityType are required fields'
        }
        res.send(response);
    }
    else {
       
            let assessmentRes = await assessmentReportGetChartData(req, res);
         
            if (assessmentRes.result == true) {

               let resData = await pdfHandler.assessmentPdfGeneration(assessmentRes, storeReportsToS3=false);

                resData.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
                res.send(resData);
            }
            else {
                res.send(assessmentRes);
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
        "type": "bar",
        "title": "",
        "xAxis": [
            {
                "categories": []
            },
            {
                "opposite": true,
                "reversed": false,
                "categories": [],
                "linkedTo": 0
            }
        ],
        "yAxis": {
            "min": 0,
            "title": {
                "text": ""
            }
        },
        "legend": {
            "reversed": true
        },
        "plotOptions": {
            "series": {
                "stacking": "percent"
            }
        },
        "data": [
            {
                "name": "Level 1",
                "data": []
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
                "domainName": "",
                "criterias": [{
                   "criteriaName": "",
                   "levels": []
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
                let response = {
                    result: false,
                    message: 'entityId,entityType,programId,solutionId are required fields'
                }
                resolve(response);
            }
            else {

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

                    let reportData = await helperFunc.entityLevelReportData(data);

                    response.reportSections = reportData;

                    return resolve(response);
                }
            }
        }
        catch (err) {
            let response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR',
                err: err
            }
            resolve(response);
        }

    })
}
