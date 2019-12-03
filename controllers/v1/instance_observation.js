var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var model = require('../../db');
var helperFunc = require('../../helper/chart_data');
var commonCassandraFunc = require('../../common/cassandra_func');
var pdfHandler = require('../../helper/common_handler');
var ejs = require('ejs');
var fs = require('fs');
var uuidv4 = require('uuid/v4');
var rimraf = require("rimraf");
const AWS = require('aws-sdk');
const util = require('util');
const readFile = util.promisify(fs.readFile);
var async = require('async');
var omit = require('object.omit');


// Controller for instance observation report
exports.instanceReport = async function (req, res) {
  if (!req.body.submissionId) {
    res.status(400);
    var response = {
      result: false,
      message: 'submissionId is a required field'
    };
    res.send(response);
  } else {
    bodyData = req.body;
    var dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(bodyData);

    if (dataReportIndexes == undefined) {
      model.MyModel.findOneAsync({ qid: "instance_observation_query" }, { allow_filtering: true })
        .then(async function (result) {
          var bodyParam = JSON.parse(result.query);
          if (config.druid.observation_datasource_name) {
            bodyParam.dataSource = config.druid.observation_datasource_name;
          }
          bodyParam.filter.value = req.body.submissionId;
          //pass the query as body param and get the resul from druid
          var options = config.druid.options;
          options.method = "POST";
          options.body = bodyParam;
          var data = await rp(options);

          if (!data.length) {
            res.send({
              "data": "SUBMISSION_ID_NOT_FOUND"
            });
          } else {
            var responseObj = await helperFunc.instanceReportChart(data);
            res.send(responseObj);
            commonCassandraFunc.insertReqAndResInCassandra(bodyData, responseObj);
          }
        })
        .catch(function (err) {
          res.status(400);
          var response = {
            result: false,
            message: 'Data not found'
          };
          res.send(response);
        });
    } else {
      res.send(JSON.parse(dataReportIndexes['apiresponse']));
    }
  }
};


// Function for instance observation PDF generation
async function instancePdfFunc(req) {
  return new Promise(function (resolve, reject) {
    model.MyModel.findOneAsync({
      qid: "instance_observation_query"
    }, {
        allow_filtering: true
      })
      .then(async function (result) {

        var bodyParam = JSON.parse(result.query);
        //bodyParam.dataSource = "sl_observation_dev";
        if (config.druid.observation_datasource_name) {
          bodyParam.dataSource = config.druid.observation_datasource_name;
        }
        bodyParam.filter.value = req.submissionId;
        var query = {
          submissionId: req.submissionId
        }

        //pass the query as body param and get the resul from druid
        var options = config.druid.options;
        options.method = "POST";
        options.body = bodyParam;
        var data = await rp(options);

        if (!data.length) {
          resolve({
            "status": "failed",
            "error": "SUBMISSION_ID_NOT_FOUND"
          });
        } else {

          // console.log("data======",data);
          var responseObj = await helperFunc.instanceReportChart(data)
          resolve(responseObj);
        }
      })
      .catch(function (err) {
        reject(err);
      });
  });
}

exports.instancePdfReport = async function (req, res) {
  if (!req.query.submissionId) {
    res.status(400);
    var response = {
      result: false,
      message: 'submissionId is a required field'
    };
    res.send(response);
  } else {
    reqData = req.query;
    var dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(reqData);
    // if(dataReportIndexes){

    // }
    // dataReportIndexes.downloadpdfpath = "instanceLevelPdfReports/instanceLevelReport.pdf";

    // console.log("dataReportIndexes", dataReportIndexes);
    // dataReportIndexes.downloadpdfpath = "";
    if (dataReportIndexes && dataReportIndexes.downloadpdfpath) {
      // var instaRes = await instancePdfFunc(reqData);

      console.log(dataReportIndexes.downloadpdfpath, "dataReportIndexes", dataReportIndexes.id);
      dataReportIndexes.downloadpdfpath = dataReportIndexes.downloadpdfpath.replace(/^"(.*)"$/, '$1');
      let signedUlr = await pdfHandler.getSignedUrl(dataReportIndexes.downloadpdfpath);

      var response = {
        status: "success",
        message: 'Observation Pdf Generated successfully',
        pdfUrl: signedUlr
      };
      res.send(response);

    } else {
      var instaRes = await instancePdfFunc(reqData);

      if (("observationName" in instaRes) == true) {
        let resData = await pdfHandler.instanceObservationPdfGeneration(instaRes);

        if (dataReportIndexes) {
          var reqOptions = {
            query: dataReportIndexes.id,
            downloadPath: resData.downloadPath
          }
          commonCassandraFunc.updateInstanceDownloadPath(reqOptions);
        } else {
          let dataInsert = commonCassandraFunc.insertReqAndResInCassandra(reqData, instaRes, resData.downloadPath);
        }

        // res.send(resData);
        res.send(omit(resData, 'downloadPath'));
      }

      else {
        res.send(instaRes);
      }
    }
  }
};






//<======================== Instance observation score report ========================================>

// Controller for instance observation score report query
exports.entityRepinstanceObservationScoreReportort = async function (req, res) {

  let data = await instanceScoreReport(req, res);

  res.send(data);
}


// Controller for instance observation score report chart object creation
async function instanceScoreReport(req, res) {

  return new Promise(async function (resolve, reject) {

    if (!req.body.submissionId) {
      var response = {
        result: false,
        message: 'submissionId is a required field'
      };

      resolve(response);

    } else {

      bodyData = req.body;
      var dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(bodyData);

      if (dataReportIndexes == undefined) {

        model.MyModel.findOneAsync({ qid: "instance_observation_score_query" }, { allow_filtering: true })
          .then(async function (result) {

            var bodyParam = JSON.parse(result.query);

            if (config.druid.observation_datasource_name) {
              bodyParam.dataSource = config.druid.observation_datasource_name;
            }

            bodyParam.filter.fields[0].value = req.body.submissionId;

            //pass the query as body param and get the resul from druid
            var options = config.druid.options;
            options.method = "POST";
            options.body = bodyParam;
            var data = await rp(options);

            if (!data.length) {
              res.send({
                "data": "SUBMISSION_ID_NOT_FOUND"
              });
            } else {

              var responseObj = await helperFunc.instanceScoreReportChartObjectCreation(data);
              res.send(responseObj);
              commonCassandraFunc.insertReqAndResInCassandra(bodyData, responseObj);

            }
          })
          .catch(function (err) {
            res.status(400);
            var response = {
              result: false,
              message: 'Data not found'
            };
            res.send(response);
          });
      } else {
        res.send(JSON.parse(dataReportIndexes['apiresponse']));
      }
    }
  })
};




//<=================== instance observation score pdf generation =============================
exports.instanceObservationScorePdfFunc = async function (req, res) {
  if (!req.body.submissionId) {
    res.status(400);
    var response = {
      result: false,
      message: 'submissionId is a required field'
    };
    res.send(response);
  } else {

    reqData = req.body;
   
      var instaRes = await instanceScoreReport(reqData);

      if (instaRes.result== true) {
        
        let resData = await pdfHandler.instanceObservationScorePdfGeneration(instaRes);
        
        // res.send(resData);
        res.send(omit(resData, 'downloadPath'));
      }

      else {
        res.send(instaRes);
      }
    
  }
};
