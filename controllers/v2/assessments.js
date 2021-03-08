const pdfHandler = require('../../helper/common_handler_v2');
const assessmentsHelper =  require('../../helper/assessments.js');

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

        let data = await assessmentsHelper.assessmentReportGetChartData(req, res);
        res.send(data);

    })
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

            let assessmentRes = await assessmentsHelper.entityReportChartCreateFunction(req, res);

            if (assessmentRes.result == true) {

                let response = await pdfHandler.assessmentAgainPdfReport(assessmentRes, storeReportsToS3 = false);

                response.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + response.pdfUrl
                res.send(response);
            }
            else {
                res.send(assessmentRes);
            }
        } else {
            let assessmentRes = await assessmentsHelper.assessmentReportGetChartData(req, res);

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

    let data = await assessmentsHelper.entityReportChartCreateFunction(req, res);
    res.send(data);
}

