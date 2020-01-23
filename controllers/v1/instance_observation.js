var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var model = require('../../db');
var helperFunc = require('../../helper/chart_data');
var commonCassandraFunc = require('../../common/cassandra_func');
var pdfHandler = require('../../helper/common_handler');
var omit = require('object.omit');

//Controller for instance observation report
exports.instanceReport = async function (req, res) {

  let data = await instanceObservationData(req, res);

  res.send(data);
}


async function instanceObservationData(req, res) {

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
              resolve({
                "data": "SUBMISSION_ID_NOT_FOUND"
              });
            } else {
              var responseObj = await helperFunc.instanceReportChart(data);
              resolve(responseObj);
              commonCassandraFunc.insertReqAndResInCassandra(bodyData, responseObj);
            }
          })
          .catch(function (err) {
            var response = {
              result: false,
              message: 'Data not found'
            };
            resolve(response);
          });
      } else {
        resolve(JSON.parse(dataReportIndexes['apiresponse']));
      }
    }
  });
};


//Funcion for instance observation pdf generation
exports.instancePdfReport = async function (req, res) {

  return new Promise (async function (resolve,reject){

    let reqData = req.query;
    var dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(reqData);
   
    if (dataReportIndexes && dataReportIndexes.downloadpdfpath) {

      dataReportIndexes.downloadpdfpath = dataReportIndexes.downloadpdfpath.replace(/^"(.*)"$/, '$1');
      let signedUlr = await pdfHandler.getSignedUrl(dataReportIndexes.downloadpdfpath);

      var response = {
        status: "success",
        message: 'Observation Pdf Generated successfully',
        pdfUrl: signedUlr
      };

      resolve(response);

    } else {
      
      req.body.submissionId = req.query.submissionId;

      var instaRes = await instanceObservationData(req,res);

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
        resolve(omit(resData, 'downloadPath'));
      }

      else {
        resolve(instaRes);
      }
    }
  });
};


//<======================== Instance observation score report ========================================>

//Controller for instance observation score report query
exports.instanceObservationScoreReport = async function (req, res) {

  let data = await instanceScoreReport(req, res);

  res.send(data);
}


//Controller for instance observation score report chart object creation
async function instanceScoreReport(req, res) {

  return new Promise(async function (resolve, reject) {

    if (!req.body.submissionId) {
      var response = {
        result: false,
        message: 'submissionId is a required field'
      };

      resolve(response);

    } else {

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
            resolve({
              "data": "SUBMISSION_ID_NOT_FOUND"
            });
          } else {

            var responseObj = await helperFunc.instanceScoreReportChartObjectCreation(data);
            resolve(responseObj);
          }
        })
        .catch(function (err) {
          var response = {
            result: false,
            message: 'Data not found'
          };
          resolve(response);
        });

    }
  })
};




//Instance observation score pdf generation
exports.instanceObservationScorePdfFunc = async function (req, res) {

  return new Promise(async function (resolve, reject) {

    var instaRes = await instanceScoreReport(req, res);

    if (instaRes.result == true) {

      let obj = {
        totalScore: instaRes.totalScore,
        scoreAchieved: instaRes.scoreAchieved
      }

      let resData = await pdfHandler.instanceObservationScorePdfGeneration(instaRes, true, obj);

      let hostname = req.headers.host;

      resData.pdfUrl = "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl

      resolve(resData);
    }

    else {
      resolve(instaRes);
    }

  });

};
