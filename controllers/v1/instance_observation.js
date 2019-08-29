var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({ contactPoints: [config.cassandra.host], keyspace: config.cassandra.keyspace, localDataCenter: 'datacenter1' });
var model = require('../../db')
var helperFunc = require('../../helper/chartData');
var commonCassandraFunc = require('../../common/cassandraFunc');
var ejs = require('ejs')

exports.slAssessment = function (req, res) {
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
      var response = { result: true, response: data }
      res.send(response);
    })
    .catch(function (err) {
      console.log(err);
    })
}

exports.instanceReport = async function (req, res) {
  if (!req.body.submissionId) {
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
          //console.log(data);
          var responseObj = helperFunc.instanceReportChart(data)
          await commonCassandraFunc.insertReqAndResInCassandra(bodyData, responseObj)
          res.send(responseObj);
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

async function instancePdfFunc(req) {
  return new Promise(function (resolve, reject) {
  model.MyModel.findOneAsync({ qid: "instance_report_query_staging" }, { allow_filtering: true })
    .then(async function (result) {
      var bodyParam = JSON.parse(result.query);
      console.log(bodyParam)
      bodyParam.filter.value = req.query.submissionId;
      //pass the query as body param and get the resul from druid
      var options = config.options;
      options.method = "POST";
      options.body = bodyParam;
      var data = await rp(options);
      var responseObj = helperFunc.instanceReportChart(data)
      // await commonCassandraFunc.insertReqAndResInCassandra(bodyData, responseObj)
      console.log(responseObj)
      resolve(responseObj);
    })
    .catch(function (err) {
      reject(err);
    })
  })
}
exports.instancePdfReport = async function (req, res) {
  if (!req.query.submissionId) {
    res.status(400);
    var response = {
      result: false,
      message: 'observationSubmissionId is a required field'
    }
    res.send(response);
  } else {
    reqData = req.query
    console.log(reqData)
    // var dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(reqData)
    // if (dataReportIndexes == undefined) {
    //   var instaRes = instancePdfFunc(req)
    //   console.log(instaRes)
    // } else {
    //   console.log('test')
    //   // res.send(JSON.parse(dataReportIndexes['apiresponse']))
    // }
    var instaRes = await instancePdfFunc(req)
    console.log(instaRes['response'].length)
    res.render('textReport',{instaRes:instaRes['response']})
    // res.render('index')
  }
}
