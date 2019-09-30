var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({
  contactPoints: [config.cassandra.host],
  keyspace: config.cassandra.keyspace,
  localDataCenter: 'datacenter1'
});
var model = require('../../db');
var helperFunc = require('../../helper/chartData');
var commonCassandraFunc = require('../../common/cassandraFunc');
var pdfHandler = require('../../helper/commonHandler');
var ejs = require('ejs');
var fs = require('fs');
var uuidv4 = require('uuid/v4');
var rimraf = require("rimraf");
const AWS = require('aws-sdk');
const util = require('util');
const readFile = util.promisify(fs.readFile);
var async = require('async');
var omit = require('object.omit');


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
              "data": "Not observerd"
            });
          } else {
            var responseObj = await helperFunc.instanceReportChart(data);
            if (req.body.download) {
              console.log("download");
              responseObj.pdfUrl = "http://www.africau.edu/images/default/sample.pdf";
            }
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

async function instancePdfFunc(req) {
  return new Promise(function (resolve, reject) {
    model.MyModel.findOneAsync({
      qid: "instance_observation_query"
    }, {
      allow_filtering: true
    })
      .then(async function (result) {

        console.log("result", result);

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
            "error": "Not observerd"
          });
        } else {

          // console.log("data======",data);
          var responseObj = await helperFunc.instanceReportChart(data)
          // var responseObj = dataResp;
          // console.log(responseObj)
          // await commonCassandraFunc.insertReqAndResInCassandra(query, responseObj)
          // console.log(responseObj)
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
    console.log("reqData",reqData)
    var dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(reqData);
    // if(dataReportIndexes){

    // }
    // dataReportIndexes.downloadpdfpath = "instanceLevelPdfReports/instanceLevelReport.pdf";

    // console.log("dataReportIndexes", dataReportIndexes);
    // dataReportIndexes.downloadpdfpath = "";
    if (dataReportIndexes && dataReportIndexes.downloadpdfpath) {
      // var instaRes = await instancePdfFunc(reqData);

      console.log(dataReportIndexes.downloadpdfpath,"dataReportIndexes", dataReportIndexes.id);
      dataReportIndexes.downloadpdfpath = dataReportIndexes.downloadpdfpath.replace(/^"(.*)"$/, '$1');
      let signedUlr = await pdfHandler.getSignedUrl(dataReportIndexes.downloadpdfpath);

      // call to get SignedUrl 
      console.log("instaRes=======", signedUlr);

      var response = {
        status: "success",
        message: 'Observation Pdf Generated successfully',
        pdfUrl: signedUlr
      };
      res.send(response);

    } else {
      var instaRes = await instancePdfFunc(reqData);


      let resData = await pdfHandler.pdfGeneration(instaRes);

      if (dataReportIndexes) {
        var reqOptions = {
          query: dataReportIndexes.id,
          downloadPath:resData.downloadPath
        }
        commonCassandraFunc.updateInstanceDownloadPath(reqOptions);
      } else {
        let dataInsert = commonCassandraFunc.insertReqAndResInCassandra(reqData, instaRes, resData.downloadPath);
      }

      // res.send(resData);
         res.send(omit(resData,'downloadPath'));
      }
  }
};

async function getSelectedData(items, type) {
  return new Promise(async function (resolve, reject) {
    var ArrayOfChartData = [];
    await Promise.all(items.map(async ele => {
      if (ele.responseType && ele.responseType == type) {
        let chartType = "bar";
        if (type == "radio") {
          chartType = "pie";
        } else {
        }
        var obj = {

          options: {
            chart: {
              type: chartType
            },
            xAxis: ele.chart.xAxis,
            yAxis: ele.chart.yAxis,
            series: ele.chart.data
          },
          question: ele.question
        };
        // return resolve(obj);
        ArrayOfChartData.push(obj);
      }
    }));
    return resolve(ArrayOfChartData);
  });
}

async function convertChartDataTofile(radioFilePath, options) {
  // console.log("options===", options);
  var fileInfo = await rp(options).pipe(fs.createWriteStream(radioFilePath))
  return new Promise(function (resolve, reject) {
    fileInfo.on('finish', function () {
      return resolve(fileInfo);
    });
    fileInfo.on('error', function (err) {
      // return resolve(fileInfo);
      console.log(err);
      return resolve(err)
    });
  });
}

async function copyBootStrapFile(from, to) {
  // var fileInfo = await rp(options).pipe(fs.createWriteStream(radioFilePath))
  var readCss = fs.createReadStream(from).pipe(fs.createWriteStream(to));
  return new Promise(function (resolve, reject) {
    readCss.on('finish', function () {
      // console.log("readCss", readCss);
      return resolve(readCss);
    });
    readCss.on('error', function (err) {
      // return resolve(fileInfo);
      // console.log("err--", err);
      return resolve(err)
    });
  });
}

async function apiCallToHighChart(chartData, imgPath, type) {
  return new Promise(async function (resolve, reject) {
    var formData = [];
    try {
      var carrent = 0;
      if (chartData && chartData.length > 0) {
        let dt = await callChartApiPreparation(chartData[0], imgPath, type, chartData, carrent, formData);
        return resolve(formData);
      } else {
        return resolve(formData);
      }
    } catch (err) {
      console.log("error while calling", err);
    }
  });
}


async function callChartApiPreparation(ele, imgPath, type, chartData, carrent, formData) {
  let loop = 0;
  var options = config.high_chart;
  var chartImage = "instanceMultiSelectFile_" + loop + "_" + uuidv4() + "_.png";
  options.method = "POST";
  options.body = JSON.stringify(ele);
  let imgFilePath = imgPath + "/" + chartImage;
  loop = loop + 1;
  let renderImage = await convertChartDataTofile(imgFilePath, options);
  let fileDat = {
    value: fs.createReadStream(imgFilePath),
    options: {
      filename: chartImage,
      question: ele.question
    }
  }
  formData.push(fileDat);
  carrent = carrent + 1;
  if (chartData.length > carrent) {
    try {
      let call = await callChartApiPreparation(chartData[carrent], imgPath, type, chartData, carrent, formData);
    } catch (err) {
      console.log("error while making api call to high chart docker", err);
    }
  } else {
    return (formData);
  }
}


