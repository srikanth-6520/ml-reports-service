var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({ contactPoints: [config.cassandra.host], keyspace: config.cassandra.keyspace, localDataCenter: 'datacenter1' });
var model = require('../../db')
var helperFunc = require('../../helper/chartData');
var commonCassandraFunc = require('../../common/cassandraFunc');


exports.instanceReport = async function(req,res){
  if(!req.body.submissionId){
    res.status(400);
    var response = {
      result: false,
      message: 'submissionId is a required field'
    }
    res.send(response);
  }
  else {
    bodyData = req.body
    var dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(bodyData)
    if (dataReportIndexes == undefined) {
      model.MyModel.findOneAsync({ qid: "instance_report_query" }, { allow_filtering: true })
        .then(async function (result) {
          var bodyParam = JSON.parse(result.query);
          bodyParam.filter.value = req.body.submissionId;
          //pass the query as body param and get the resul from druid
          var options = config.options;
          options.method = "POST";
          options.body = bodyParam;
          var data = await rp(options);
          if(!data.length){
            res.send({"data":"Not observerd"})
          }
          else{
          var responseObj = helperFunc.instanceReportChart(data)
          if(req.body.download){
            console.log("download");
            responseObj.pdfUrl = "http://www.africau.edu/images/default/sample.pdf"
          }
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
