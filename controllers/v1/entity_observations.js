var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({ contactPoints: [config.cassandra.host], keyspace: config.cassandra.keyspace, localDataCenter: 'datacenter1' });
var model = require('../../db')
var helperFunc = require('../../helper/chartData');


exports.entityReport = function(req,res){
  if(!req.body.entityId && !req.body.observationId) {
    res.status(400);
    var response = {
      result:false,
      message : 'entityId and observationId are required fields' 
    }
    res.send(response);
  }
  else {
  model.MyModel.findOneAsync({ qid: "entity_report_query" }, { allow_filtering: true })
  .then(async function (result) {
    var bodyParam = JSON.parse(result.query);
    bodyParam.filter.fields[0].value = req.body.entityId;
    bodyParam.filter.fields[1].value = req.body.observationId;
    //pass the query as body param and get the resul from druid
     var options = config.options;
     options.method = "POST";
     options.body = bodyParam;
     var data = await rp(options);
     var responseObj = helperFunc.entityReportChart(data)
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
