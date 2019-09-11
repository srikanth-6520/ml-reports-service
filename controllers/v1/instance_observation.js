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
var pdfHandler = require('../../helper/commonPdfHandler');
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
      model.MyModel.findOneAsync({
          qid: "instance_report_query"
        }, {
          allow_filtering: true
        })
        .then(async function (result) {
          var bodyParam = JSON.parse(result.query);
          bodyParam.filter.value = req.body.submissionId;
          //pass the query as body param and get the resul from druid
          var options = config.options;
          options.method = "POST";
          options.body = bodyParam;
          var data = await rp(options);
          if (!data.length) {
            res.send({
              "data": "Not observerd"
            });
          } else {
            var responseObj = helperFunc.instanceReportChart(data);
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

    // console.log("report");
    model.MyModel.findOneAsync({
        qid: "instance_report_query"
      }, {
        allow_filtering: true
      })
      .then(async function (result) {
        console.log("result", result);
        var dataResp = {
          "entityName": "Tumkur School-20",
          "observationName": "Tumukuru Flash Visit-2019 By - Leader20",
          "observationId": "5d1a002d2dfd8135bc8e1654",
          "entityType": "school",
          "entityId": "5cf12e54c8baf753f2c77362",
          "response": [ {
            "question": "Teachers new Timetable",
            "responseType": "slider",
            "answers": null,
            "chart": {}
        },{
              "question": "Are they conducting any bridge-course?",
              "responseType": "radio1",
              "answers": [],
              "chart": {
                "type": "pie",
                "data": [{
                  "data": [{
                    "name": "YES",
                    "y": 100
                  }]
                }]
              }
            },
            {
              "question": "Comments by the visiting team",
              "responseType": "text",
              "answers": [
                "Hdkf"
              ],
              "chart": {}
            },
            {
              "question": "Comments on Prayer/news/news reading",
              "responseType": "text",
              "answers": [
                "Ghekd"
              ],
              "chart": {}
            },
            {
              "question": "Contact number",
              "responseType": "text",
              "answers": [
                "Bdndj"
              ],
              "chart": {}
            },
            {
              "question": "Details on school opening day",
              "responseType": "text",
              "answers": [
                "Bhsjsj"
              ],
              "chart": {}
            },
            {
              "question": "Did SDMC/Parents/Old students participate?",
              "responseType": "radio1",
              "answers": [],
              "chart": {
                "type": "pie",
                "data": [{
                  "data": [{
                    "name": "YES",
                    "y": 100
                  }]
                }]
              }
            },
            {
              "question": "Do all teachers have prepared Annual Action Plan?",
              "responseType": "radio1",
              "answers": [],
              "chart": {
                "type": "pie",
                "data": [{
                  "data": [{
                    "name": "YES",
                    "y": 100
                  }]
                }]
              }
            },
            {
              "question": "Do all teachers have prepared Annual Individual Plan?",
              "responseType": "radio1",
              "answers": [],
              "chart": {
                "type": "pie",
                "data": [{
                  "data": [{
                    "name": "YES",
                    "y": 100
                  }]
                }]
              }
            },
            {
              "question": "Do the boys and girls have separate toilets?",
              "responseType": "radio1",
              "answers": [],
              "chart": {
                "type": "pie",
                "data": [{
                  "data": [{
                    "name": "YES",
                    "y": 100
                  }]
                }]
              }
            },
            {
              "question": "Do they have school Institution Plan prepared?",
              "responseType": "radio1",
              "answers": [],
              "chart": {
                "type": "pie",
                "data": [{
                  "data": [{
                    "name": "YES",
                    "y": 100
                  }]
                }]
              }
            },
            {
              "question": "Do they have school timetable prepared?",
              "responseType": "radio1",
              "answers": [],
              "chart": {
                "type": "pie",
                "data": [{
                  "data": [{
                    "name": "YES",
                    "y": 100
                  }]
                }]
              }
            },
            {
              "question": "Has the cleanliness been maintained?",
              "responseType": "radio1",
              "answers": [],
              "chart": {
                "type": "pie",
                "data": [{
                  "data": [{
                    "name": "YES",
                    "y": 100
                  }]
                }]
              }
            },
            {
              "question": "Have all teachers been assigned duties?",
              "responseType": "radio1",
              "answers": [],
              "chart": {
                "type": "pie",
                "data": [{
                  "data": [{
                    "name": "YES",
                    "y": 100
                  }]
                }]
              }
            },
            {
              "question": "Have the teachers studied training manual?",
              "responseType": "radio1",
              "answers": [],
              "chart": {
                "type": "pie",
                "data": [{
                  "data": [{
                    "name": "YES",
                    "y": 100
                  }]
                }]
              }
            },
            {
              "question": "Have they distributed free text books for students?",
              "responseType": "radio1",
              "answers": [],
              "chart": {
                "type": "pie",
                "data": [{
                  "data": [{
                    "name": "YES",
                    "y": 100
                  }]
                }]
              }
            },
            {
              "question": "Have they distributed sweets to children?",
              "responseType": "radio1",
              "answers": [],
              "chart": {
                "type": "pie",
                "data": [{
                  "data": [{
                    "name": "YES",
                    "y": 100
                  }]
                }]
              }
            },
            {
              "question": "Have they distributed uniforms to students?",
              "responseType": "radio1",
              "answers": [],
              "chart": {
                "type": "pie",
                "data": [{
                  "data": [{
                    "name": "YES",
                    "y": 100
                  }]
                }]
              }
            },
            {
              "question": "If any dropouts, information on name of the child and class and steps taken to bring them back to school.",
              "responseType": "text",
              "answers": [
                "Hdkmf"
              ],
              "chart": {}
            },
            {
              "question": "Information on any special enrolment drive conducted",
              "responseType": "text",
              "answers": [
                "Hndmf"
              ],
              "chart": {}
            },
            {
              "question": "Is there a school calendar prepared?",
              "responseType": "radio",
              "answers": [],
              "chart": {
                "type": "pie",
                "data": [{
                  "data": [{
                    "name": "YES",
                    "y": 100
                  }]
                }]
              }
            },
            {
              "question": "Is there a timetable prepared for Teachers?",
              "responseType": "radio1",
              "answers": [],
              "chart": {
                "type": "pie",
                "data": [{
                  "data": [{
                    "name": "YES",
                    "y": 100
                  }]
                }]
              }
            },
            {
              "question": "Maintenance of drinking water facility",
              "responseType": "text",
              "answers": [
                "Tydjd"
              ],
              "chart": {}
            },
            {
              "question": "Mid-day meal program, hygiene, food materials",
              "responseType": "text",
              "answers": [
                "Gdkkd"
              ],
              "chart": {}
            },
            {
              "question": "Name of the Head Teacher",
              "responseType": "text",
              "answers": [
                "Bdjdj"
              ],
              "chart": {}
            },
            {
              "question": "Name of the officer visited school / designation",
              "responseType": "text",
              "answers": [
                "Bdjrm"
              ],
              "chart": {}
            },
            {
              "question": "Name of the school",
              "responseType": "text",
              "answers": [
                "Sgdh"
              ],
              "chart": {}
            },
            {
              "question": "Note on cleanliness of school physical environment",
              "responseType": "text",
              "answers": [
                "Gdjrk"
              ],
              "chart": {}
            },
            {
              "question": "Note on the way the children were welcomed/received",
              "responseType": "text",
              "answers": [
                "Hdjdk"
              ],
              "chart": {}
            },
            {
              "question": "Number of teachers prepared their Annual Action Plan",
              "responseType": "text",
              "answers": [
                "Hdjjd"
              ],
              "chart": {}
            },
            {
              "question": "Number of teachers prepared their Individual Plan",
              "responseType": "text",
              "answers": [
                "Gdjjd"
              ],
              "chart": {}
            },
            {
              "question": "Number of teachers present today",
              "responseType": "text",
              "answers": [
                "Hdkkf"
              ],
              "chart": {}
            },
            {
              "question": "Positions sanctioned",
              "responseType": "text",
              "answers": [
                "Hejdm"
              ],
              "chart": {}
            },
            {
              "question": "Total number of Co-teachers",
              "responseType": "text",
              "answers": [
                "HdmdK"
              ],
              "chart": {}
            },
            {
              "question": "Total number of Head Teachers(HT)",
              "responseType": "text",
              "answers": [
                "Hdkd"
              ],
              "chart": {}
            },
            {
              "question": "Verification of previous year’s records of F.A. and S.A.",
              "responseType": "radio1",
              "answers": [],
              "chart": {
                "type": "pie",
                "data": [{
                  "data": [{
                    "name": "YES",
                    "y": 100
                  }]
                }]
              }
            },
            {
              "question": "Visiting officer designation",
              "responseType": "text",
              "answers": [
                "Bhdkkd"
              ],
              "chart": {}
            },
            {
              "question": "Have they prepared Nali-Kali classroom?",
              "responseType": "multiselect",
              "answers": [],
              "chart": {
                "type": "bar",
                "data": [{
                  "data": [

                    100.00,
                  ]
                }],
                "xAxis": {
                  "categories": [
                    "Alphabet festoon"
                  ],
                  "title": {
                    "text": "Responses"
                  }
                },
                "yAxis": {
                  "title": {
                    "text": "Responses in percentage"
                  }
                }
              }
            }, {
              "question": "Have they prepared Nali-Kali classroom 2 ?",
              "responseType": "multiselect",
              "answers": [],
              "chart": {
                "type": "bar",
                "data": [{
                  "data": [

                    100.00,
                  ]
                }],
                "xAxis": {
                  "categories": [
                    "Alphabet festoon"
                  ],
                  "title": {
                    "text": "Responses"
                  }
                },
                "yAxis": {
                  "title": {
                    "text": "Responses in percentage"
                  }
                }
              }
            }
          ]
        };
        var bodyParam = JSON.parse(result.query);
        bodyParam.filter.value = req.submissionId;
        //pass the query as body param and get the resul from druid
        var options = config.options;
        options.method = "POST";
        options.body = bodyParam;
        // var data = await rp(options);
        // var responseObj = helperFunc.instanceReportChart(data)
        var responseObj = dataResp;
        // console.log(responseObj)
        await commonCassandraFunc.insertReqAndResInCassandra(req.query, responseObj)
        // console.log(responseObj)
        resolve(responseObj);
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

    console.log("dataReportIndexes", dataReportIndexes.downloadpdfpath);
    if (dataReportIndexes.downloadpdfpath) {
      // var instaRes = await instancePdfFunc(reqData);

      let signedUlr = await pdfHandler.getSignedUrl(dataReportIndexes.downloadpdfpath);

      // call to get SignedUrl 
      console.log("instaRes=======", signedUlr);

      var response = {
        result: "success",
        message: 'observationSubmissionId is a required field',
        pdfUrl: signedUlr
      };
      res.send(response);

    } else {

      var instaRes = await instancePdfFunc(reqData);
      // console.log('test')
      // res.send(JSON.parse(dataReportIndexes['apiresponse']))





      var multiSelectData = await getSelectedData(instaRes.response, "multiselect");

      // console.log("multiSelectData",multiSelectData);
      var imgPath = __dirname + '/../../tmp/' + uuidv4();
      if (!fs.existsSync(imgPath)) {
        fs.mkdirSync(imgPath);
      }





      // console.log("multiSelectData",multiSelectData);




      let bootstrapStream = await copyBootStrapFile(__dirname + '/../../public/css/bootstrap.min.css', imgPath + '/style.css');



      // var options = config.high_chart;
      // var pieChartImage = "instanceMultiSelectFile.png";
      // options.method = "POST";
      // options.body = JSON.stringify(multiSelectData);
      // let imgFilePath = imgPath + "/" + pieChartImage;
      //  var renderImage = await rp(options).pipe(fs.createWriteStream(imgFilePath));
      // let renderImage = await convertChartDataTofile(imgFilePath, options);



      //  var awaitrenderImage.on

      var radioQuestIons = await getSelectedData(instaRes.response, "radio");
      // let radioQuestionImage = "instanceRadioFile.png";
      // let radioFilePath = imgPath + "/" + radioQuestionImage;
      // options.body = JSON.stringify(radioQuestIons);
      // console.log(" before wait", radioQuestIons);
      // var renderImageOfRadio = await rp(options).pipe(fs.createWriteStream(radioFilePath))

      // let renderImageOfRadio = await convertChartDataTofile(radioFilePath, options);
      // var imgcr  = await renderImageOfRadio.on('finish', function () { });

      let FormData = [];

      let formDataMultiSelect = await apiCallToHighChart(multiSelectData, imgPath,"multiselect");
      let radioFormData = await apiCallToHighChart(radioQuestIons, imgPath,"radio");

      FormData.push(...formDataMultiSelect);
      FormData.push(...radioFormData);

      // let Slider = instaRes.response.reduce((r, a) => {
      //   if( a.responseType=='slider' ){
      //     r[a.question] = [...r[a.question] || [], a];
      //   }
      //   return r;
      //  }, {});

      //  let textData = instaRes.response.reduce((r, a) => {
      //   if( a.responseType=='text' ){
      //     r[a.question] = [...r[a.question] || [], a];
      //   }
      //   return r;
      //  }, {});

      //  console.log("group", group);
      // console.log("textData====",Object.keys(textData));

      // let textArray = Object.keys(textData);
      // for(var i=0; i < textArray.length; i++) {

      //   console.log("===",textData[textArray[i]][0].answers,"extArray[j]",textArray[i]);
      //   // for(var j=0; j < textData.textArray[i].length; j++) {

      //   //   console.log("textData.textArray[j]",textData.textArray[i]);

      //   // }
      // }

      var obj = {
        path: formDataMultiSelect,
        instaRes: instaRes.response,
        sliderData:instaRes.response,
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
              // formDataMultiSelect.push( {
              //   value: fs.createReadStream(radioFilePath),
              //   options: {
              //     filename: radioQuestionImage
              //   }
              // });
             

              optionsHtmlToPdf.formData.files = FormData;
              console.log("formData ===", optionsHtmlToPdf.formData.files);
              // optionsHtmlToPdf.formData.files.push(formDataMultiSelect);
              rp(optionsHtmlToPdf)
                .then(function (responseHtmlToPdf) {

                  console.log("optionsHtmlToPdf",optionsHtmlToPdf.formData.files);
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
                            Key: 'instanceLevelPdfReports/instanceLevelReport.pdf', // file will be saved as testBucket/contacts.csv
                            Body: Buffer.from(data, null, 2)
                          };
                          s3.upload(params, function (s3Err, data) {
                            if (s3Err) throw s3Err;

                            console.log("data", data);
                            console.log(`File uploaded successfully at ${data.Location}`);

                            pdfHandler.getSignedUrl(data.key).then(function (signedRes) {
                              console.log("signedRes", signedRes);

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
          // delete the directory once stored into s3
          // rimraf.sync(dir);
        })
        .catch(function (errEjsRender) {
          console.log(errEjsRender);
        });
      //call instancePdfFunc to get the pdf report
      // console.log(instaRes['response'].length)
      // res.render('textReport',{instaRes:instaRes['response']})
      // res.render('index')
      // res.send({ "status":"success", "pdfUrl": "http://www.africau.edu/images/default/sample.pdf" }
      // )

      // });

      // });
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


  console.log("options===",options);
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
      console.log("readCss", readCss);
      return resolve(readCss);

    });

    readCss.on('error', function (err) {
      // return resolve(fileInfo);
      console.log("err--", err);
      return resolve(err)

    });


  });
}

async function apiCallToHighChart(chartData, imgPath,type) {
  return new Promise(async function(resolve, reject) {
    let loop = 0;
    var formData = [];
    try{

    console.log(chartData.length,"type",type);
    await Promise.all(chartData.map(async ele => {
      console.log("type",type);
      console.log("ele======", ele);
      var options = config.high_chart;
      var chartImage = "instanceMultiSelectFile_" + loop +"_"+uuidv4()+"_.png";
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

  }catch(err){

    console.log("error while calling",err);

  }
  });


}


