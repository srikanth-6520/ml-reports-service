var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({ contactPoints: [config.cassandra.host], keyspace: config.cassandra.keyspace, localDataCenter: 'datacenter1' });
var model = require('../../db')
var helperFunc = require('../../helper/chartData');
var commonCassandraFunc = require('../../common/cassandraFunc');


exports.observationReport = async function (req, res) {
    if (!req.body.observationId) {
        res.status(400);
        var response = {
            result: false,
            message: 'observationId is a required field'
        }
        res.send(response);
    }
    else {
        bodyData = req.body
        var dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(bodyData)
        if (dataReportIndexes == undefined) {
            model.MyModel.findOneAsync({ qid: "observation_report_query" }, { allow_filtering: true })
                .then(async function (result) {
                    var bodyParam = JSON.parse(result.query);
                    bodyParam.filter.value = req.body.observationId;
                    //pass the query as body param and get the resul from druid
                    var options = config.options;
                    options.method = "POST";
                    options.body = bodyParam;
                    var data = await rp(options);
                    //if no data throw error message
                    if(!data.length){
                        res.send({"data":"No entities are observed"})
                      }
                    else{
                    var responseObj = helperFunc.entityReportChart(data)
                    //send the response as API output
                    res.send(responseObj);
                    commonCassandraFunc.insertReqAndResInCassandra(bodyData, responseObj)
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
            } else {
                res.send(JSON.parse(dataReportIndexes['apiresponse']))
              }
        }
    }
