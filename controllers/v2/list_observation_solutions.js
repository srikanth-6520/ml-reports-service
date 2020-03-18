const config = require('../../config/config');
const rp = require('request-promise');
const request = require('request');
const model = require('../../db');
const helperFunc = require('../../helper/chart_data');
const authService = require('../../services/authentication_service');


//Controller for listing solution Names
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

        let query;

        if (req.body.reportType == "my") {
            query = "list_my_solutions_query";
        } else {
            query = "list_observation_solutions_query";
        }

        //get query from cassandra
        model.MyModel.findOneAsync({ qid: query }, { allow_filtering: true })
            .then(async function (result) {

                var bodyParam = JSON.parse(result.query);

                if (config.druid.observation_datasource_name) {
                    bodyParam.dataSource = config.druid.observation_datasource_name;
                }

                if (req.body.reportType == "my") {
                    let createdBy = await getCreatedByField(req, res);
                    bodyParam.filter.fields[0].dimension = req.body.entityType;
                    bodyParam.filter.fields[0].value = req.body.entityId;
                    bodyParam.filter.fields[1].value = createdBy;
                }
                else {
                    bodyParam.filter.dimension = req.body.entityType;
                    bodyParam.filter.value = req.body.entityId;
                }

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
                res.status(500);
                var response = {
                    result: false,
                    message: 'Internal server error'
                }
                res.send(response);
            })
    }
}


// Function for getting createdBy field from header access token
async function getCreatedByField(req, res) {

    return new Promise(async function (resolve, reject) {

        let token = await authService.validateToken(req, res);

        console.log("fetched token");

        resolve(token.userId);

    })
}