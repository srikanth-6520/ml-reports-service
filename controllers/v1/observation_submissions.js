var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var model = require('../../db')
var helperFunc = require('../../helper/chart_data');


//Controller for listing observation Names
exports.observationSubmissionsCount = async function (req, res) {
    if (!req.body.entityId && !req.body.observationId) {
        res.status(400);
        var response = {
            result: false,
            message: 'entityId and observationId are required fields'
        }
        res.send(response);
    } else if(!req.body.observationId) {
        res.status(400);
        var response = {
            result: false,
            message: 'observationId is a required fields'
        }
        res.send(response);
    }
    else {

        let query = "";
        if(req.body.entityId && req.body.observationId){
            query = "entity_observation_query";
        }
        else if (req.body.observationId){
            query = "observation_report_query";
        }

        //get quey from cassandra
        model.MyModel.findOneAsync({ qid: query }, { allow_filtering: true })

            .then(async function (result) {

                var bodyParam = JSON.parse(result.query);

                if (config.druid.observation_datasource_name) {
                    bodyParam.dataSource = config.druid.observation_datasource_name;
                }

                if(query == "entity_observation_query"){

                    bodyParam.filter.fields[0].value = req.body.entityId;
                    bodyParam.filter.fields[1].value = req.body.observationId;

                } else if(query == "observation_report_query"){
                    
                    bodyParam.filter.value = req.body.observationId;
                }

                //pass the query as body param and get the result from druid
                var options = config.druid.options;
                options.method = "POST";
                options.body = bodyParam;
                var data = await rp(options);

                if (!data.length) {
                    res.send({ "result": false, "data": {"noOfSubmissions" : 0} })
                }
                else {

                    var noOfSubmissions = await countNumberOfSubmissions(data);
                    res.send({ "result": true, "data": { "noOfSubmissions" : noOfSubmissions} });
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


async function countNumberOfSubmissions(data){

    let noOfSubmissions = [];

    await Promise.all(data.map(element => {

        if(!noOfSubmissions.includes(element.event.observationSubmissionId)){
             
            noOfSubmissions.push(element.event.observationSubmissionId);
        }


    }))

    return noOfSubmissions.length;
}