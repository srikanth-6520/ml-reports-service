var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({ contactPoints: [config.cassandra.host], keyspace: config.cassandra.keyspace, localDataCenter: 'datacenter1' });
var model = require('../../db')
var helperFunc = require('../../helper/chartData');
var commonCassandraFunc = require('../../common/cassandraFunc');

exports.entityReport = async function (req, res) {
  if (!req.body.entityId && !req.body.observationId) {
    res.status(400);
    var response = {
      result: false,
      message: 'entityId and observationId are required fields'
    }
    res.send(response);
  }
  else {
    bodyData = req.body
    var dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(bodyData)
    if (dataReportIndexes == undefined) {
      model.MyModel.findOneAsync({ qid: "entity_observation_query" }, { allow_filtering: true })
        .then(async function (result) {
          var bodyParam = JSON.parse(result.query);
          if(config.druid.datasource_name){
          bodyParam.dataSource = config.druid.datasource_name;
          }
          bodyParam.filter.fields[0].value = req.body.entityId;
          bodyParam.filter.fields[1].value = req.body.observationId;
          //pass the query as body param and get the resul from druid
          var options = config.druid.options;
          options.method = "POST";
          options.body = bodyParam;
          var data = await rp(options);
          if (!data.length) {
            res.send({ "data": "No observations made for the entity" })
          }
          else {
            var responseObj = helperFunc.entityReportChart(data)
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

exports.observationsByEntity = async function (req, res) {

  if (!req.body && !req.body) {
    res.status(400);
    var response = {
      result: false,
      message: 'entityId and observationId are required fields'
    }
    res.send(response);
  }
  else {
    model.MyModel.findOneAsync({
      qid: "observations_by_entity"
    }, {
      allow_filtering: true
    })
      .then(async function (result) {
        var bodyParam = JSON.parse(result.query);
        var query = bodyParam;
        var fieldsArray = [];
        await Promise.all(req.body.entityIds.map(async ele => {
          let objSelecter = { "type": "selector", "dimension": "entityId", "value": ele };
          fieldsArray.push(objSelecter);
        }
        ));
        // console.log("fields",fieldsArray);
        query.filter.fields.push(...fieldsArray);
        // console.log("query",query);
        var options = config.options;
        options.method = "POST";
        options.body = query;
        var data = await rp(options);
        res.send(data);
      });
  }

}
