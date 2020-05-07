const config = require('../../config/config');
const rp = require('request-promise');
const request = require('request');
const model = require('../../db')
const helperFunc = require('../../helper/chart_data');
const commonCassandraFunc = require('../../common/cassandra_func');
const pdfHandler = require('../../helper/common_handler');
const assessmentService = require('../../helper/assessment_service');
const authService = require('../../middleware/authentication_service');


/**
   * @api {post} /dhiti/api/v1/assessments/listPrograms
   * List assessment programs
   * @apiVersion 1.0.0
   * @apiGroup Assessments
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
* "entityId": "",
* "entityType":""
* "immediateChildType":""
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
        "programName": "",
        "programId": "",
        "programDescription": "",
        "programExternalId": "",
        "solutions": [{
          "solutionName": "",
          "solutionId": "",
          "solutionDescription": "",
          "solutionExternalId": ""
        }]
*     }
   * @apiUse errorBody
   */

// Function for listing assement programs
exports.listPrograms = async function (req, res) {
    if (!req.body.entityId || !req.body.entityType) {
        res.status(400);
        var response = {
            result: false,
            message: 'entityId,entityType and immediateChildType are required fields'
        }
        res.send(response);
    }
    else {
        //get quey from cassandra
        model.MyModel.findOneAsync({ qid: "list_assessment_programs_query" }, { allow_filtering: true })
            .then(async function (result) {
                var bodyParam = JSON.parse(result.query);
                if (config.druid.assessment_datasource_name) {
                    bodyParam.dataSource = config.druid.assessment_datasource_name;
                }
                bodyParam.filter.dimension = req.body.entityType;
                bodyParam.filter.value = req.body.entityId;
                //pass the query as body param and get the result from druid
                var options = config.druid.options;
                options.method = "POST";
                options.body = bodyParam;
                var data = await rp(options);
                if (!data.length) {

                    //==========Production hotfix code============================
                    bodyParam.filter.dimension = "school";
                    bodyParam.filter.value = req.body.entityId;

                    //pass the query as body param and get the result from druid
                    let optionsData = config.druid.options;
                    optionsData.method = "POST";
                    optionsData.body = bodyParam;
                    let programData = await rp(options);

                    if (!programData.length) {

                        res.send({ "data": [] })
                    }
                    else {

                        //call the function entityAssessmentChart to get the data for stacked bar chart 
                        var responseObj = await helperFunc.listProgramsObjectCreate(programData);
                        res.send(responseObj);

                    }
                }
                else {
                    //call the function entityAssessmentChart to get the data for stacked bar chart 
                    var responseObj = await helperFunc.listProgramsObjectCreate(data);
                    res.send(responseObj);
                }
            })
            .catch(function (err) {
                res.status(400);
                var response = {
                    result: false,
                    message: 'Data not found'
                }
                res.send(response);
            })
    }
}



/**
   * @api {post} /dhiti/api/v1/assessments/entity
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

        if (!req.body.entityId || !req.body.entityType || !req.body.programId || !req.body.solutionId) {
            res.status(400);
            var response = {
                result: false,
                message: 'entityId,entityType,programId,solutionId and immediateChildEntityType are required fields'
            }
            resolve(response);
        }
        else {

            childType = req.body.immediateChildEntityType;
            reqBody = req.body

            var dataAssessIndexes = await commonCassandraFunc.checkAssessmentReqInCassandra(reqBody)

            if (dataAssessIndexes == undefined) {

                //get domainName and level info
                model.MyModel.findOneAsync({ qid: "entity_assessment_query" }, { allow_filtering: true })
                    .then(async function (result) {

                        var bodyParam = JSON.parse(result.query);
                        if (config.druid.assessment_datasource_name) {
                            bodyParam.dataSource = config.druid.assessment_datasource_name;
                        }

                        //dynamically appending values to filter
                        bodyParam.filter.fields[0].dimension = req.body.entityType;
                        bodyParam.filter.fields[0].value = req.body.entityId;
                        bodyParam.filter.fields[1].value = req.body.programId;
                        bodyParam.filter.fields[2].value = req.body.solutionId;

                        if (req.body.immediateChildEntityType == "") {
                            // req.body.immediateChildEntityType = "domain"
                            bodyParam.dimensions.push("domainName", "level", "schoolName", "school", "programName");
                            bodyParam.aggregations[0].fieldName = "domainName";
                            bodyParam.aggregations[0].fieldNames.push("domainName");
                            bodyParam.aggregations[0].name = "domainNameCount";
                        }
                        else {
                            var entityName = req.body.immediateChildEntityType + "Name";
                            bodyParam.dimensions.push(req.body.immediateChildEntityType, entityName, "level", "programName");
                            bodyParam.aggregations[0].fieldName = entityName;
                            bodyParam.aggregations[0].fieldNames.push(entityName);
                            bodyParam.aggregations[0].name = entityName + "Count";
                        }
                        //pass the query as body param and get the resul from druid
                        let opt = config.druid.options;
                        opt.method = "POST";
                        opt.body = bodyParam;
                        var data = await rp(opt);

                        if (!data.length) {

                            //==========Production hotfix code============================

                            //dynamically appending values to filter
                            bodyParam.filter.fields[0].dimension = "school";
                            childType = "";

                            //pass the query as body param and get the resul from druid
                            let options = config.druid.options;
                            options.method = "POST";
                            options.body = bodyParam;
                            var assessData = await rp(options);

                            if (!assessData.length) {
                                resolve({ "result": false, "data": {} })
                            }
                            else {

                                let inputObj = {
                                    data: assessData,
                                    entityName: "domainName",
                                    childEntity: "",
                                    levelCount: "domainNameCount",
                                    entityType: "school"
                                }

                                //call the function entityAssessmentChart to get the data for stacked bar chart 
                                var responseObj = await helperFunc.entityAssessmentChart(inputObj);
                                responseObj.title = "Performance Report";
                                bodyParam.dimensions.push("childType", "childName", "domainExternalId");

                                if (!bodyParam.dimensions.includes("domainName")) {
                                    bodyParam.dimensions.push("domainName");
                                }

                                if (req.body.immediateChildEntityType == "") {
                                    req.body.immediateChildEntityType = "school"
                                }

                                //pass the query as body param and get the result from druid
                                let optionsData = config.druid.options;
                                optionsData.method = "POST";
                                optionsData.body = bodyParam;

                                let entityData = await rp(optionsData);

                                let dataObject = {
                                    entityData: entityData,
                                    childEntityType: req.body.immediateChildEntityType,
                                    entityType: "school"
                                }

                                //call the function to get the data for expansion view of domain and criteria
                                var tableObject = await helperFunc.entityTableViewFunc(dataObject)
                                tableObject.chart.title = "Descriptive View";
                                responseObj.reportSections.push(tableObject);

                                if (childType) {

                                    //call samiksha entity list assessment API to get the grandchildEntity type.
                                    var grandChildEntityType = await assessmentEntityList(req.body.entityId, childType, req.headers["x-auth-token"])
                                    if (grandChildEntityType.status == 200) {
                                        if (grandChildEntityType.result[0].subEntityGroups.length != 0) {
                                            responseObj.reportSections[0].chart.grandChildEntityType = grandChildEntityType.result[0].immediateSubEntityType;
                                            resolve(responseObj);
                                        }
                                        else {
                                            responseObj.reportSections[0].chart.grandChildEntityType = "";
                                            resolve(responseObj);
                                        }
                                    }
                                    else {
                                        responseObj.reportSections[0].chart.grandChildEntityType = "";
                                        resolve(responseObj);
                                    }
                                }
                                else {
                                    responseObj.reportSections[0].chart.grandChildEntityType = "";
                                    resolve(responseObj);
                                }
                                commonCassandraFunc.insertAssessmentReqAndResInCassandra(reqBody, responseObj)
                            }
                        }
                        else {

                            var inputObj = {
                                data: data,
                                entityName: bodyParam.aggregations[0].fieldName,
                                childEntity: req.body.immediateChildEntityType,
                                levelCount: bodyParam.aggregations[0].name,
                                entityType: req.body.entityType
                            }

                            //call the function entityAssessmentChart to get the data for stacked bar chart 
                            var responseObj = await helperFunc.entityAssessmentChart(inputObj);
                            bodyParam.dimensions.push("childType", "childName", "domainExternalId");

                            if (!bodyParam.dimensions.includes("domainName")) {
                                bodyParam.dimensions.push("domainName");
                            }

                            if (req.body.immediateChildEntityType == "") {
                                req.body.immediateChildEntityType = "school"
                            }

                            //pass the query as body param and get the result from druid
                            var options = config.druid.options;
                            options.method = "POST";
                            options.body = bodyParam;

                            var entityData = await rp(options);

                            var dataObj = {
                                entityData: entityData,
                                childEntityType: req.body.immediateChildEntityType,
                                entityType: req.body.entityType
                            }

                            //call the function to get the data for expansion view of domain and criteria
                            var tableObj = await helperFunc.entityTableViewFunc(dataObj)
                            responseObj.reportSections.push(tableObj);

                            if (childType) {

                                //call samiksha entity list assessment API to get the grandchildEntity type.
                                var grandChildEntityType = await assessmentEntityList(req.body.entityId, childType, req.headers["x-auth-token"])

                                if (grandChildEntityType.status == 200) {
                                    if (grandChildEntityType.result[0].subEntityGroups.length != 0) {
                                        responseObj.reportSections[0].chart.grandChildEntityType = grandChildEntityType.result[0].immediateSubEntityType;
                                        resolve(responseObj);
                                    }
                                    else {
                                        responseObj.reportSections[0].chart.grandChildEntityType = "";
                                        resolve(responseObj);
                                    }
                                }
                                else {
                                    responseObj.reportSections[0].chart.grandChildEntityType = "";
                                    resolve(responseObj);
                                }
                            }
                            else {
                                responseObj.reportSections[0].chart.grandChildEntityType = "";
                                resolve(responseObj);
                            }
                            commonCassandraFunc.insertAssessmentReqAndResInCassandra(reqBody, responseObj)
                        }
                    })
                    .catch(function (err) {
                        res.status(400);
                        var response = {
                            result: false,
                            message: 'Data not found'
                        }
                        resolve(response);
                    })
            } else {
                resolve(JSON.parse(dataAssessIndexes['apiresponse']))
            }
        }
    });
}



/**
   * @api {post} /dhiti/api/v1/assessments/listAssessmentPrograms
   * List assessment programs
   * @apiVersion 1.0.0
   * @apiGroup Assessments
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
   *   "result" : true,
   *   "data" : [{
   *    "programName": "",
        "programId": "",
   *    }]
*     }
   * @apiUse errorBody
   */

// Function for listing assement programs
exports.listAssessmentPrograms = async function (req, res) {

    let filter;

    let getUserProfile = await getUserProfileFunc(req, res);
    let userProfile = getUserProfile[0];
    let filterData = getUserProfile[1];

    let aclLength = Object.keys(userProfile.result.acl);
    if (userProfile.result.acl && aclLength > 0) {

        let tagsArray = await helperFunc.tagsArrayCreateFunc(userProfile.result.acl);

        filter = {
            "type": "and", "fields": [{
                "type": "or", "fields": [{ "type": "in", "dimension": "schoolType", "values": tagsArray },
                { "type": "in", "dimension": "administrationType", "values": tagsArray }]
            }]
        };

        //combine entity filter array with acl array
        filter.fields.push({ "type": "or", "fields": filterData });

    } else {
        filter = { "type": "or", "fields": filterData };
    }

    //get query from cassandra
    model.MyModel.findOneAsync({ qid: "list_assessment_programs_query" }, { allow_filtering: true })
        .then(async function (result) {

            let bodyParam = JSON.parse(result.query);

            if (config.druid.assessment_datasource_name) {
                bodyParam.dataSource = config.druid.assessment_datasource_name;
            }

            bodyParam.filter = filter;
            bodyParam.dimensions = ["programId", "programName"];

            //pass the query as body param and get the result from druid
            let options = config.druid.options;
            options.method = "POST";
            options.body = bodyParam;
            let data = await rp(options);

            if (!data.length) {
                res.send({ "result": false, "data": [] });
            }
            else {

                let responseObj = await helperFunc.listAssessmentProgramsObjectCreate(data);
                res.send(responseObj);
            }

        })
        .catch(function (err) {
            res.status(400);
            let response = {
                result: false,
                message: 'INTERNAL SERVER ERROR'
            }
            res.send(response);
        });
}



/**
   * @api {post} /dhiti/api/v1/assessments/listEntities
   * List entities 
   * @apiVersion 1.0.0
   * @apiGroup Assessments
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
   * {
   * "programId" : ""
   * }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
   *   "result" : true,
   *   "data" : [{
   *    "entityId": "",
        "entityName": "",
        "entityType": "",
        "solutions": [{
            "solutionId" : "",
            "solutionName" : ""
        }]
   *    }]
*     }
   * @apiUse errorBody
   */

// Function for listing assement programs
exports.listEntities = async function (req, res) {

    let filter;
    let dimensionArray = [];

    let getUserProfile = await getUserProfileFunc(req, res);
    let userProfile = getUserProfile[0];
    let filterData = getUserProfile[1];

    let aclLength = Object.keys(userProfile.result.acl);

    if (userProfile.result.acl && aclLength > 0) {

        let tagsArray = await helperFunc.tagsArrayCreateFunc(userProfile.result.acl);

        filter = {
            "type": "and", "fields": [
                { "type": "selector", "dimension": "programId", "values": req.body.programId },
                {
                    "type": "or", "fields": [{ "type": "in", "dimension": "schoolType", "values": tagsArray },
                    { "type": "in", "dimension": "administrationType", "values": tagsArray }]
                }]
        };

        //combine entity filter array with acl array
        filter.fields.push({ "type": "or", "fields": filterData });

    } else {
        filter = { "type": "and", "fields": [{ "type": "selector", "dimension": "programId", "value": req.body.programId }] };
        filter.fields.push({ "type": "or", "fields": filterData });
    }

    //get query from cassandra
    model.MyModel.findOneAsync({ qid: "list_entities_query" }, { allow_filtering: true })
        .then(async function (result) {

            let bodyParam = JSON.parse(result.query);

            if (config.druid.assessment_datasource_name) {
                bodyParam.dataSource = config.druid.assessment_datasource_name;
            }

            bodyParam.filter = filter;
            bodyParam.dimensions = [...bodyParam.dimensions, ...dimensionArray];
            bodyParam.dimensions = [...new Set(bodyParam.dimensions)];

            //pass the query as body param and get the result from druid
            let options = config.druid.options;
            options.method = "POST";
            options.body = bodyParam;
            let data = await rp(options);

            if (!data.length) {
                res.send({ "result": false, "data": [] });
            }
            else {

                let responseObj = await helperFunc.listEntitesObjectCreation(data);
                res.send(responseObj);
            }

        })
        .catch(function (err) {
            let response = {
                result: false,
                message: 'INTERNAL SERVER ERROR'
            }
            res.send(response);
        })
}



/**
   * @api {post} /dhiti/api/v1/assessments/listImprovementProjects
   * List improvement programs
   * @apiVersion 1.0.0
   * @apiGroup Assessments
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
*  {
*  "entityId": "",
*  "entityType":"",
*  "programId": "",
*  "solutionId": ""
*  }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "result" : true,
       "data" : [{
           "criteriaName" : "",
           "level" : "",
           "improvementProjects" : [{
               "projectName" : "",
               "projectId" : "",
               "projectGoal": "",
               "projectExternalId": ""
           }]
       }] 
*     }
   * @apiUse errorBody
   */

// Function for listing assement programs
exports.listImprovementProjects = async function (req, res) {
    if (!req.body.entityId || !req.body.entityType || !req.body.programId || !req.body.solutionId) {
        res.status(400);
        let response = {
            result: false,
            message: 'entityId,entityType,programId and solutionId are required fields'
        }
        res.send(response);
    }
    else {

        //get quey from cassandra
        model.MyModel.findOneAsync({ qid: "list_improvement_projects_query" }, { allow_filtering: true })
            .then(async function (result) {

                let bodyParam = JSON.parse(result.query);

                if (config.druid.assessment_datasource_name) {
                    bodyParam.dataSource = config.druid.assessment_datasource_name;
                }
                
                bodyParam.filter.fields.push({"type":"selector","dimension":req.body.entityType,"value":req.body.entityId},
                                             {"type":"selector","dimension":"programId","value":req.body.programId},
                                             {"type":"selector","dimension":"solutionId","value":req.body.solutionId});

                //get the createdBy field
                let createdBy = await getCreatedByField(req, res);

                //get the acl data from samiksha service
                let userProfile = await assessmentService.getUserProfile(createdBy, req.headers["x-auth-token"]);
                let aclLength = Object.keys(userProfile.result.acl);
                if (userProfile.result && userProfile.result.acl && aclLength > 0) {
                    let tagsArray = await helperFunc.tagsArrayCreateFunc(userProfile.result.acl);

                    bodyParam.filter.fields.push({"type":"or","fields":[{"type": "in", "dimension": "schoolType", "values": tagsArray },
                        { "type": "in", "dimension": "administrationType", "values": tagsArray }]});
                }

                //pass the query as body param and get the result from druid
                let options = config.druid.options;
                options.method = "POST";
                options.body = bodyParam;

                let data = await rp(options);
                if (!data.length) {
                    res.send({ "result": false, "data": [] });
                }
                else {
                    //call the function improvementProjectsObjectCreate to get the response object
                    let responseObj = await helperFunc.improvementProjectsObjectCreate(data);
                    res.send(responseObj);
                }
            })
            .catch(function (err) {
                let response = {
                    result: false,
                    message: 'INTERNAL SERVER ERROR'
                }
                res.send(response);
            })
    }
}




//function to make a call to samiksha assessment entities list API
async function assessmentEntityList(entityId, childType, token) {

    return new Promise(async function (resolve) {
        var options = {
            method: "GET",
            json: true,
            headers: {
                "Content-Type": "application/json",
                "X-authenticated-user-token": token
            },
            uri: config.samiksha_api.assessment_entity_list_api + entityId + "?type=" + childType
        }

        rp(options).then(function (resp) {
            return resolve(resp);

        }).catch(function (err) {
            return resolve(err);
        })

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
        reqData = req.body;
        var dataReportIndexes = await commonCassandraFunc.checkAssessmentReqInCassandra(reqData);

        if (dataReportIndexes && dataReportIndexes.downloadpdfpath) {


            dataReportIndexes.downloadpdfpath = dataReportIndexes.downloadpdfpath.replace(/^"(.*)"$/, '$1');
            let signedUlr = await pdfHandler.getSignedUrl(dataReportIndexes.downloadpdfpath);


            var response = {
                status: "success",
                message: 'Assessment Pdf Generated successfully',
                pdfUrl: signedUlr
            };
            res.send(response);

        } else {
            var assessmentRes;
            if (dataReportIndexes) {
                assessmentRes = JSON.parse(dataReportIndexes['apiresponse']);
            }
            else {
                assessmentRes = await assessmentReportGetChartData(req, res);
            }


            if (assessmentRes.result == true) {

                let resData = await pdfHandler.assessmentPdfGeneration(assessmentRes);

                if (dataReportIndexes) {
                    var reqOptions = {
                        query: dataReportIndexes.id,
                        downloadPath: resData.downloadPath
                    }
                    commonCassandraFunc.updateEntityAssessmentDownloadPath(reqOptions);
                } else {
                    //store download url in cassandra
                    let dataInsert = commonCassandraFunc.insertAssessmentReqAndResInCassandra(reqData, resData, resData.downloadPath);
                }

                res.send(resData);
                // res.send(omit(resData,'downloadPath'));
            }
            else {
                res.send(assessmentRes);
            }

        }
    }
};

// Function to get user profile data from assessment service
async function getUserProfileFunc(req,res){

  return new Promise(async function(resolve,reject){
    try {

    let filterData = [];

    //get userid from access token 
    let createdBy = await getCreatedByField(req, res);
  
    //make a call to samiksha and get user profile
    let userProfile = await assessmentService.getUserProfile(createdBy, req.headers["x-auth-token"]);
  
    if (userProfile.result && userProfile.result.roles && userProfile.result.roles.length > 0) {

        await Promise.all(userProfile.result.roles.map(async data => {

            await Promise.all(data.entities.map(entityData => {
                let filterField = { "type": "selector", "dimension": entityData.entityType, "value": entityData._id };
                filterData.push(filterField);
            }));

        }));

        return resolve([userProfile,filterData]);
    } else {
        res.send({"result":false,"data":[]});
    }
    } catch(err){
        return reject(err);
    }
 });
}

// Function for getting createdBy field from header access token
async function getCreatedByField(req, res) {
  
    return new Promise(async function (resolve, reject) {
  
        let token = await authService.validateToken(req, res);
  
        resolve(token.userId);
  
    })
}