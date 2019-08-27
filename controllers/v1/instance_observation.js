var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({ contactPoints: [config.cassandra.host], keyspace: config.cassandra.keyspace, localDataCenter: 'datacenter1' });
var model = require('../../db')
var helperFunc = require('../../helper/chartData');


exports.slAssessment = function(req,res) {
    //Fetch query from cassandra 
    model.MyModel.findOneAsync({ qid: req.body.qid }, { allow_filtering: true })
        .then(async function (result) {
         var bodyParam = JSON.parse(result.query);
         bodyParam.filter.fields[0].value = req.body.entityId;
         //pass the query as body param and get the resul from druid
         var options = config.options;
         options.method = "POST";
         options.body = bodyParam;
         var data = await rp(options);
         var response = { result : true, response : data}
         res.send(response);
        })
       .catch(function(err){
          console.log(err);
        })
}

exports.instanceReport = function(req,res){
  if(!req.body.submissionId){
    res.status(400);
    var response = {
      result:false,
      message : 'submissionId is a required field' 
    }
    res.send(response);
  }
  else {
  model.MyModel.findOneAsync({ qid: "instance_report_query" }, { allow_filtering: true })
  .then(async function (result) {
    var bodyParam = JSON.parse(result.query);
    bodyParam.filter.value = req.body.submissionId;
    //pass the query as body param and get the resul from druid
     var options = config.options;
     options.method = "POST";
     options.body = bodyParam;
     var data = await rp(options);
<<<<<<< HEAD
=======
     //console.log(data);
>>>>>>> 7bdc63751257746b8245fa01c19849bb109ab08f
     var responseObj = helperFunc.instanceReportChart(data)
     res.send(responseObj);
   })
  .catch(function(err){
    res.status(400);
    var response = {
      result:false,
      message : 'Data not found' 
    }
    res.send(response);
   })
  }
}
