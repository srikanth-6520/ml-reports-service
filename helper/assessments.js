const rp = require('request-promise');
const request = require('request');
const assessmentService = require('./assessment_service');
const helperFunc = require('./chart_data_v2');


exports.assessmentReportGetChartData = async function(req, res) {
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

                let childType = req.body.immediateChildEntityType;

                let bodyParam = gen.utils.getDruidQuery("entity_assessment_query");
                
                if (req.body.dataSource) {
                    bodyParam.dataSource = req.body.dataSource
                } else {
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
                message: err.message
            }
            resolve(response);
        }
    });
}



exports.entityReportChartCreateFunction = async function (req, res) {
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
