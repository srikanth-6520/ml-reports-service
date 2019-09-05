var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({ contactPoints: [config.cassandra.host], keyspace: config.cassandra.keyspace, localDataCenter: 'datacenter1' });
var model = require('../../db')
var helperFunc = require('../../helper/chartData');
var commonCassandraFunc = require('../../common/cassandraFunc');
var ejs = require('ejs')
var fs = require('fs')
var uuidv4 = require('uuid/v4');
var rimraf = require("rimraf");
const AWS = require('aws-sdk');

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
          if(!data.length){
            res.send({"data":"Not observerd"})
          }
          else{
          var responseObj = helperFunc.instanceReportChart(data)
          if (req.body.download) {
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

async function instancePdfFunc(req) {
  return new Promise(function (resolve, reject) {
    model.MyModel.findOneAsync({ qid: "instance_report_query_staging" }, { allow_filtering: true })
      .then(async function (result) {
        var bodyParam = JSON.parse(result.query);
        bodyParam.filter.value = req.query.submissionId;
        //pass the query as body param and get the resul from druid
        var options = config.options;
        options.method = "POST";
        options.body = bodyParam;
        var data = await rp(options);
        var responseObj = helperFunc.instanceReportChart(data)
        // await commonCassandraFunc.insertReqAndResInCassandra(bodyData, responseObj)
        // console.log(responseObj)
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
    // console.log(reqData)
    // var dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(reqData)
    // if (dataReportIndexes == undefined) {
    //   var instaRes = instancePdfFunc(req)
    //   console.log(instaRes)
    // } else {
    //   console.log('test')
    //   // res.send(JSON.parse(dataReportIndexes['apiresponse']))
    // }
    ejs.renderFile(__dirname + '/../../views/textReport.ejs', { instaRes: instaRes['response'] })
      .then(function (dataEjsRender) {
        var dir = __dirname + '/../../tmp/' + uuidv4()
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }
        fs.writeFile(dir + '/index.html', dataEjsRender, function (errWriteFile, dataWriteFile) {
          if (errWriteFile) {
            throw errWriteFile
          } else {
            var optionsHtmlToPdf = config.optionsHtmlToPdf
            optionsHtmlToPdf.formData = {
              files: {
                value: fs.createReadStream(dir + '/index.html'),
                options: {
                  filename: 'index.html'
                }
              }
            }
            rp(optionsHtmlToPdf)
              .then(function (responseHtmlToPdf) {
                var pdfBuffer = Buffer.from(responseHtmlToPdf.body)
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
                          Key: 'instanceLevelPdfReports/instanceLevelReport.pdf', // file will be saved as testBucket/contacts.csv
                          Body: JSON.stringify(data, null, 2)
                        };
                        s3.upload(params, function (s3Err, data) {
                          if (s3Err) throw s3Err
                          console.log(`File uploaded successfully at ${data.Location}`)
                        });
                      });
                    };

                    uploadFile();
                  });
                }
              })
              .catch(function (err) {
                console.log("error in converting HtmlToPdf")
                throw err;
              });
          }
        })
        //delete the directory once stored into s3
        // rimraf.sync(dir);
      })
      .catch(function (errEjsRender) {
        console.log(errEjsRender)
      })
    //call instancePdfFunc to get the pdf report
    // console.log(instaRes['response'].length)
    // res.render('textReport',{instaRes:instaRes['response']})
    // res.render('index')
    res.send({ "status":"success", "pdfUrl": "http://www.africau.edu/images/default/sample.pdf" }
    )
  }
}
