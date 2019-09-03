var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var model = require('../../db')
var helperFunc = require('../../helper/chartData');
var commonCassandraFunc = require('../../common/cassandraFunc');

exports.entityAssessment = async function (req, res) {
  if (!req.body.entityId) {
    res.status(400);
    var response = {
      result: false,
      message: 'entityId is a required field'
    }
    res.send(response);
  }
  else {
    reqBody = req.body
    var dataAssessIndexes = await commonCassandraFunc.checkAssessmentReqInCassandra(reqBody)
    if (dataAssessIndexes == undefined) {
      //get domainName and level info
      model.MyModel.findOneAsync({ qid: "entity_assessment_query" }, { allow_filtering: true })
        .then(async function (result) {
          var bodyParam = JSON.parse(result.query);
          bodyParam.filter.value = req.body.entityId;
          //pass the query as body param and get the resul from druid
          var options = config.options;
          options.method = "POST";
          options.body = bodyParam;
          var data = await rp(options);
          if (!data.length) {
            res.send({ "data": "No assessment data found for the entity" })
          }
          //call the function entityAssessmentChart to get the data for stacked bar chart 
          var responseObj = helperFunc.entityAssessmentChart(data)

          //get crieria name, and level
          model.MyModel.findOneAsync({ qid: "entity_assessment_table_view_query" }, { allow_filtering: true })
            .then(async function (response) {
              var bodyData = JSON.parse(response.query);
              bodyData.filter.value = req.body.entityId;

              //pass the query as body param and get the resul from druid
              var options = config.options;
              options.method = "POST";
              options.body = bodyData;
              var entityData = await rp(options);
              var tableObj = helperFunc.entityTableViewFunc(entityData)
              responseObj.reportSections.push(tableObj);
              responseObj = JSON.parse(responseObj)
              res.send(responseObj);
              commonCassandraFunc.insertAssessmentReqAndResInCassandra(reqBody, responseObj)
            })
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
      res.send(JSON.parse(dataAssessIndexes['apiresponse']))
    }
  }
}
