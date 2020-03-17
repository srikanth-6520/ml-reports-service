var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var model = require('../../db')
var helperFunc = require('../../helper/chart_data');


/**
   * @api {post} /dhiti/api/v1/assessments/listPrograms
   * @apiVersion 1.0.0
   * @apiGroup assessments
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "entityId": "",
* "entityType":""
* "immediateChildType":""
* }
   * @apiUse successBody
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
                    
                    if(!programData.length){
                   
                    res.send({ "data": []})
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
