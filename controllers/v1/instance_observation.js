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
          if(config.druid.observation_datasource_name){
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

    console.log("reqdata");
    // console.log("report");
    model.MyModel.findOneAsync({
      qid: "instance_observation_query"
    }, {
      allow_filtering: true
    })
      .then(async function (result) {
        console.log("result", result);

        var bodyParam = JSON.parse(result.query);
       //bodyParam.dataSource = "sl_observation_dev";
        if(config.druid.observation_datasource_name){
             bodyParam.dataSource = config.druid.observation_datasource_name;
        }
        bodyParam.filter.value = req.submissionId;


        var query = {
          submissionId: req.submissionId
        }
        console.log("reqdata");
        //pass the query as body param and get the resul from druid
        var options = config.druid.options;
        options.method = "POST";
        options.body = bodyParam;
        var data = await rp(options);



        if (!data.length) {
          resolve({
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
      message: 'observationSubmissionId is a required field'
    };
    res.send(response);
  } else {
    reqData = req.query;
    // console.log(reqData)
    var dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(reqData);



    // if(dataReportIndexes){

    // }


    // 

    // dataReportIndexes.downloadpdfpath = "instanceLevelPdfReports/instanceLevelReport.pdf";

    console.log("dataReportIndexes", dataReportIndexes);
    // dataReportIndexes.downloadpdfpath ="";
    if (dataReportIndexes && dataReportIndexes.downloadpdfpath) {
      // var instaRes = await instancePdfFunc(reqData);

      console.log("dataReportIndexes", dataReportIndexes.id);
      dataReportIndexes.downloadpdfpath = dataReportIndexes.downloadpdfpath.replace(/^"(.*)"$/, '$1');
      let signedUlr = await pdfHandler.getSignedUrl(dataReportIndexes.downloadpdfpath);
        
      // call to get SignedUrl 
      console.log("instaRes=======", signedUlr);

      var response = {
        result: "success",
        message: 'Observation Pdf Generated successfully',
        pdfUrl: signedUlr
      };
      res.send(response);

    } else {

      // console.log("reqData",reqData);

      var instaRes = await instancePdfFunc(reqData);

      if (instaRes && instaRes.error) {
        res.send(instaRes);

      } else {



        if (dataReportIndexes) {

        } else {

        }

        // console.log("instaRes",instaRes);
        var multiSelectData = await getSelectedData(instaRes.response, "multiselect");
        var imgPath = __dirname + '/../../tmp/' + uuidv4();
        if (!fs.existsSync(imgPath)) {
          fs.mkdirSync(imgPath);
        }

        let bootstrapStream = await copyBootStrapFile(__dirname + '/../../public/css/bootstrap.min.css', imgPath + '/style.css');
        var radioQuestIons = await getSelectedData(instaRes.response, "radio");
        let FormData = [];
        let formDataMultiSelect = await apiCallToHighChart(multiSelectData, imgPath, "multiselect");
        let radioFormData = await apiCallToHighChart(radioQuestIons, imgPath, "radio");
        FormData.push(...formDataMultiSelect);
        FormData.push(...radioFormData);
        var obj = {
          path: formDataMultiSelect,
          instaRes: instaRes.response,
          sliderData: instaRes.response,
          radioOptionsData: radioFormData
        };
        ejs.renderFile(__dirname + '/../../views/mainTemplate.ejs', {
          data: obj
        })
          .then(function (dataEjsRender) {
            // console.log("dataEjsRender",imgPath);
            var dir = imgPath;
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir);
            }
            fs.writeFile(dir + '/index.html', dataEjsRender, function (errWriteFile, dataWriteFile) {
              if (errWriteFile) {
                throw errWriteFile;
              } else {

                var optionsHtmlToPdf = config.optionsHtmlToPdf;
                optionsHtmlToPdf.formData = {
                  files: [
                  ]
                };
                FormData.push({
                  value: fs.createReadStream(dir + '/index.html'),
                  options: {
                    filename: 'index.html'
                  }
                });
                FormData.push({
                  value: fs.createReadStream(dir + '/style.css'),
                  options: {
                    filename: 'style.css'
                  }
                });
                optionsHtmlToPdf.formData.files = FormData;
                console.log("formData ===", optionsHtmlToPdf.formData.files);
                // optionsHtmlToPdf.formData.files.push(formDataMultiSelect);
                rp(optionsHtmlToPdf)
                  .then(function (responseHtmlToPdf) {

                    console.log("optionsHtmlToPdf", optionsHtmlToPdf.formData.files);
                    var pdfBuffer = Buffer.from(responseHtmlToPdf.body);
                    if (responseHtmlToPdf.statusCode == 200) {
                      fs.writeFile(dir + '/instanceLevelReport.pdf', pdfBuffer, 'binary', function (err) {
                        if (err) {
                          return console.log(err);
                        }
                        console.log("The PDF was saved!");
                        const s3 = new AWS.S3(config.s3_credentials);
                        const uploadFile = () => {
                          fs.readFile(dir + '/instanceLevelReport.pdf', (err, data) => {
                            if (err) throw err;
                            const params = {
                              Bucket: config.s3_bucketName, // pass your bucket name
                              Key: 'instanceLevelPdfReports/' + uuidv4() + 'instanceLevelReport.pdf', // file will be saved as testBucket/contacts.csv
                              Body: Buffer.from(data, null, 2)
                            };
                            s3.upload(params, function (s3Err, data) {
                              if (s3Err) throw s3Err;

                              console.log("data", data);
                              console.log(`File uploaded successfully at ${data.Location}`);

                              pdfHandler.getSignedUrl(data.key).then(function (signedRes) {
                                // console.log("signedRes", apiRequestId);

                                // apiRequestId = apiRequestId.replace(/^"(.*)"$/, '$1');
                                // apiRequestId = apiRequestId.replace("^\"|\"$", "");





                                // console.log("dataReportIndexes inserted", dataReportIndexes);

                                if (dataReportIndexes) {

                                  var reqOptions = {

                                    query: dataReportIndexes.id,

                                    downloadPath: data.key

                                  }
                                  commonCassandraFunc.updateInstanceDownloadPath(reqOptions);
                                } else {
                                  let dataInsert = commonCassandraFunc.insertReqAndResInCassandra(reqData, instaRes, data.key);
                                }



                                var response = {
                                  result: "success",
                                  message: 'report generated',
                                  pdfUrl: signedRes
                                };
                                res.send(response);
                              })
                            });
                          });
                        };
                        uploadFile();
                      });
                    }
                  })
                  .catch(function (err) {
                    console.log("error in converting HtmlToPdf", err);
                    throw err;
                  });
              }
            });
          })
          .catch(function (errEjsRender) {
            console.log(errEjsRender);
          });
      }
    }
  }
};

async function getSelectedData(items, type) {
  return new Promise(async function (resolve, reject) {

    var ArrayOfChartData = [];
    await Promise.all(items.map(async ele => {
      // const response = await fetch(`/api/users/${userId}`);
      // const user = await response.json();
      // console.log(user);
      if (ele.responseType && ele.responseType == type) {
        // console.log("ele---",ele.chart);

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
          }
        };
        // return resolve(obj);

        ArrayOfChartData.push(obj);
      }
    }));

    return resolve(ArrayOfChartData);



  });
}

async function convertChartDataTofile(radioFilePath, options) {


  console.log("options===", options);
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
  // return promise;
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
      console.log("err--", err);
      return resolve(err)

    });


  });
}

async function apiCallToHighChart(chartData, imgPath, type) {
  return new Promise(async function (resolve, reject) {
    let loop = 0;
    var formData = [];
    try {

      console.log(chartData.length, "type", type);
      await Promise.all(chartData.map(async ele => {
        console.log("type", type);
        console.log("ele======", ele);
        var options = config.high_chart;
        var chartImage = "instanceMultiSelectFile_" + loop + "_" + uuidv4() + "_.png";
        options.method = "POST";
        options.body = JSON.stringify(ele);
        let imgFilePath = imgPath + "/" + chartImage;
        loop = loop + 1;
        //  var renderImage = await rp(options).pipe(fs.createWriteStream(imgFilePath));
        let renderImage = await convertChartDataTofile(imgFilePath, options);

        let fileDat = {
          value: fs.createReadStream(imgFilePath),
          options: {
            filename: chartImage
          }
        }

        console.log("fileDat", fileDat);

        formData.push(fileDat);

      }));
      console.log("response return");

      return resolve(formData);

    } catch (err) {

      console.log("error while calling", err);

    }
  });


}


