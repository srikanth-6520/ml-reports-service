var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var model = require('../../db')
var helperFunc = require('../../helper/chartData');


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
                if (config.druid.datasource_name) {
                    bodyParam.dataSource = config.druid.datasource_name;
                }
                bodyParam.filter.dimension = req.body.entityType;
                bodyParam.filter.value = req.body.entityId;
                //pass the query as body param and get the result from druid
                var options = config.druid.options;
                options.method = "POST";
                options.body = bodyParam;
                var data = await rp(options);
                if (!data.length) {
                    res.send({ "data": "No programs found for the entityId" })
                }
                else {
                  //call the function entityAssessmentChart to get the data for stacked bar chart 
                   var responseObj = helperFunc.listProgramsObjectCreate(data);
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
