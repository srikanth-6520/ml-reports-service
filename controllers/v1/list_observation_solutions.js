var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var model = require('../../db')
var helperFunc = require('../../helper/chart_data');


//Controller for listing observation Names
exports.listObservationSolutions = async function (req, res) {
    if (!req.body.entityId || !req.body.entityType) {
        res.status(400);
        var response = {
            result: false,
            message: 'entityId,entityType are required fields'
        }
        res.send(response);
    }
    else {

        //get query from cassandra
        model.MyModel.findOneAsync({ qid: "list_observation_solutions_query" }, { allow_filtering: true })
            .then(async function (result) {
                var bodyParam = JSON.parse(result.query);
                if (config.druid.observation_datasource_name) {
                    bodyParam.dataSource = config.druid.observation_datasource_name;
                }

                bodyParam.filter.dimension = req.body.entityType;
                bodyParam.filter.value = req.body.entityId;

                //pass the query as body param and get the result from druid
                var options = config.druid.options;
                options.method = "POST";
                options.body = bodyParam;
                var data = await rp(options);

                if (!data.length) {
                    res.send({ "result": false, "data": [] })
                }
                else {
                    //call the function listObservationNamesObjectCreate to create response object
                    var responseObj = await helperFunc.listSolutionNamesObjectCreate(data);
                    res.send({ "result": true, "data": responseObj });
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
