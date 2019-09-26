var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({ contactPoints: [config.cassandra.host], keyspace: config.cassandra.keyspace, localDataCenter: 'datacenter1' });
var model = require('../../db')
var helperFunc = require('../../helper/chartData');
var commonCassandraFunc = require('../../common/cassandraFunc');

var instance = require('./instance_observation');
var entityObserv = require('./entity_observations');
var pdfHandler = require('../../helper/commonHandler');


exports.observationReport = async function (req, res) {
    return new Promise(async function(resolve,reject){
        let data = await observationReportManuplate(req, res);
        resolve(data);
    })

    
}

async function observationReportManuplate(req, res){
    return new Promise(async function(resolve,reject){

    if (!req.body.observationId) {
        res.status(400);
        var response = {
            result: false,
            message: 'observationId is a required field'
        }
        resolve(response);
    }
    else {
        // bodyData = req.body
        // var dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(bodyData)
        // if (dataReportIndexes == undefined) {
        model.MyModel.findOneAsync({ qid: "observation_report_query" }, { allow_filtering: true })
            .then(async function (result) {

                // console.log("result", result);
                var bodyParam = JSON.parse(result.query);
                if (config.druid.observation_datasource_name) {
                    bodyParam.dataSource = config.druid.observation_datasource_name;
                }
                bodyParam.filter.value = req.body.observationId;
                //pass the query as body param and get the resul from druid
                var options = config.druid.options;
                options.method = "POST";
                options.body = bodyParam;
                var data = await rp(options);
                //if no data throw error message
                if (!data.length) {
                    resolve({ "data": "No entities are observed" })
                }
                else {
                    var responseObj = await helperFunc.entityReportChart(data)
                    //send the response as API output
                    resolve(responseObj);
                    // commonCassandraFunc.insertReqAndResInCassandra(bodyData, responseObj)
                }
            })
            .catch(function (err) {

                console.log("err", err);
                res.status(400);
                var response = {
                    result: false,
                    message: 'Data not found'
                }
                resolve(response);
            })
        // } else {
        //     res.send(JSON.parse(dataReportIndexes['apiresponse']))
        //   }
    }
});
}

exports.pdfReports = async function (req, res) {

    console.log("enty");

    return new Promise(async function (resolve, reject) {
        // var bodyParam = JSON.parse(req);
        // console.log("body", req.query);
        if(req.query && req.query.observationId && req.query.entityId) {

            let resObj = await entityObservationPdf(req, res)
            res.send(resObj);

        }else if (req.query && req.query.submissionId) {
            let resObj = await instance.instancePdfReport(req, res)
            res.send(resObj);
    
          
        } else if(req.query && req.query.observationId) {

            let resObj = await observationGenerateReport(req, res)
            res.send(resObj);
        }else {
            resolve({
                status: "success",
                res: resObj
            });
        }
    })

}

async function observationGenerateReport(req, res){
    return new Promise(async function(resolve,reject){

        if (!req.query.observationId) {
            // res.status(400);
            var response = {
              result: false,
              message: 'observationSubmissionId is a required field'
            };
            resolve(response);
          }else{

            req.body.observationId= req.query.observationId;
           let responseData = await observationReportManuplate(req, res);

        //    console.log("responseData",responseData);
           let resData = await pdfHandler.pdfGeneration(responseData);
        //    console.log("responseData",resData);

           resolve(resData);
          } 

    });
}
async function entityObservationPdf(req, res){
    return new Promise(async function(resolve,reject){
        if (!req.query.observationId) {
            // res.status(400);
            var response = {
              result: false,
              message: 'observationId is a required field'
            };
            resolve(response);
          }if(!req.query.entityId){
            var response = {
                result: false,
                message: 'entityId is a required field'
              };
              resolve(response);
        }else{

            req.body.observationId= req.query.observationId;
            req.body.entityId= req.query.entityId;
           let responseData = await entityObserv.entityReport(req, res);

        // //    console.log("responseData",responseData);
           let resData = await pdfHandler.pdfGeneration(responseData);
        //    console.log("responseData",resData);
           resolve(resData);
          } 

    });
}