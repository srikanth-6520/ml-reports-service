var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var model = require('../../db')
var helperFunc = require('../../helper/chart_data');
var commonCassandraFunc = require('../../common/cassandra_func');
var instance = require('./instance_observation');
var entityObserv = require('./entity_observations');
var pdfHandler = require('../../helper/common_handler');
var fs = require('fs');
var url = require('url');
var rimraf = require("rimraf");
const path = require('path');
var omit = require('object.omit');


exports.observationReport = async function (req, res) {
    return new Promise(async function (resolve, reject) {
        let data = await observationReportManipulate(req, res);
        res.send(data);
    })
}

async function observationReportManipulate(req, res) {
    return new Promise(async function (resolve, reject) {

        if (!req.body.observationId) {
            res.status(400);
            var response = {
                result: false,
                message: 'observationId is a required field'
            }
            resolve(response);
        }
        else {
            // bodyData = req.body
            // var dataReportIndexes = await commonCassandraFunc.checkReqInCassandra(bodyData)
            // if (dataReportIndexes == undefined) {
            model.MyModel.findOneAsync({ qid: "observation_report_query" }, { allow_filtering: true })
                .then(async function (result) {

                    // console.log("result", result);
                    var bodyParam = JSON.parse(result.query);
                    if (config.druid.observation_datasource_name) {
                        bodyParam.dataSource = config.druid.observation_datasource_name;
                    }
                    bodyParam.filter.value = req.body.observationId;
                    //pass the query as body param and get the resul from druid
                    var options = config.druid.options;
                    options.method = "POST";
                    options.body = bodyParam;
                    var data = await rp(options);
                    //if no data throw error message
                    if (!data.length) {
                        resolve({ "data": "No entities are observed" })
                    }
                    else {
                        var responseObj = await helperFunc.entityReportChart(data)
                        //send the response as API output
                        resolve(responseObj);
                        // commonCassandraFunc.insertReqAndResInCassandra(bodyData, responseObj)
                    }
                })
                .catch(function (err) {

                    console.log("err", err);
                    res.status(400);
                    var response = {
                        result: false,
                        message: 'Data not found'
                    }
                    resolve(response);
                })
            // } else {
            //     res.send(JSON.parse(dataReportIndexes['apiresponse']))
            //   }
        }
    });
}


exports.pdfReports = async function (req, res) {

    console.log("enty",req.query);

    return new Promise(async function (resolve, reject) {
        // var bodyParam = JSON.parse(req);
        // console.log("body", req);

        if (req.query.entityId && req.query.entityType && req.query.observationId) {
            let resObj = await entityObserv.entityObservationReportPdfGeneration(req, res)
            res.send(resObj);

        }
       
        else if (req.query.observationId && req.query.entityId) {
            let resObj = await entityObservationPdf(req, res);
            res.send(resObj);

        } else if (req.query.submissionId) {
            let resObj = await instance.instancePdfReport(req, res)
            res.send(resObj);

        }  else if (req.query.observationId) {
            let resObj = await observationGenerateReport(req, res)
            res.send(resObj);

        }  else {
            resolve({
                status: "success",
                res: resObj
            });
        }
    })

}

async function observationGenerateReport(req, res) {
    return new Promise(async function (resolve, reject) {

        if (!req.query.observationId) {
            // res.status(400);
            var response = {
                result: false,
                message: 'observationSubmissionId is a required field'
            };
            resolve(response);
        } else {

            req.body.observationId = req.query.observationId;
            let responseData = await observationReportManipulate(req, res);

            if(("observationName" in responseData) == true){

            let resData = await pdfHandler.pdfGeneration(responseData, true);
            //    console.log("responseData",resData);

            if (resData.status && resData.status == "success") {
                var hostname = req.headers.host;
                var pathname = url.parse(req.url).pathname;
                console.log(pathname, "responseData", hostname);
                var obj = {
                    status: "success",
                    message: 'Observation Pdf Generated successfully',
                    pdfUrl: "https://"+hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
                }
                //    console.log("responseData",resData);
                resolve(obj);
            } else {
                resolve(resData);
            }
           }
        else {
            resolve(responseData);   
          }
        }
        
    });
}


async function entityObservationPdf(req, res) {
    return new Promise(async function (resolve, reject) {
        if (!req.query.observationId) {
            // res.status(400);
            var response = {
                result: false,
                message: 'observationId is a required field'
            };
            resolve(response);
        } if (!req.query.entityId) {
            var response = {
                result: false,
                message: 'entityId is a required field'
            };
            resolve(response);
        } else {

            req.body.observationId = req.query.observationId;
            req.body.entityId = req.query.entityId;
            let responseData = await entityObserv.entityObservationDataExport(req, res);
            
            if(("observationName" in responseData) == true){
            //    console.log("responseData",responseData);
            let resData = await pdfHandler.pdfGeneration(responseData, true);

            if (resData.status && resData.status == "success") {
                var hostname = req.headers.host;
                var pathname = url.parse(req.url).pathname;
                console.log(pathname, "responseData", hostname);
                var obj = {
                    status: "success",
                    message: 'Observation Pdf Generated successfully',
                    pdfUrl: "https://"+hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
                }
                //    console.log("responseData",resData);
                resolve(obj);
            } else {
                resolve(resData);
            }
        }
        else {
            resolve(responseData);   
        }

        }

    });
}


exports.pdftempUrl = async function (req, response) {


    var folderPath = Buffer.from(req.query.id, 'base64').toString('ascii')
    console.log(folderPath, "req", __dirname + '../' + req.query.id);
    fs.readFile(__dirname + '/../../' + folderPath + '/pdfReport.pdf', function (err, data) {
        if (!err) {

            console.log('received data: ');
            response.writeHead(200, { 'Content-Type': 'application/pdf' });
            response.write(data);


            try{
                fs.readdir(__dirname + '/../../' + folderPath, (err, files) => {
                    if (err) throw err;
    
                    // console.log("files",files.length);
                    var i = 0;
                    for (const file of files) {
                        i = i +1;
                        fs.unlink(path.join(__dirname + '/../../' + folderPath, file), err => {
                            if (err) throw err;
                        });
                        if(i==files.length){
                            // fs.unlink(__dirname + '/../../'+folderPath);
                            // console.log("path.dirname(filename).split(path.sep).pop()",path.dirname(file).split(path.sep).pop());
                            // fs.unlink(path.join(imgPath, ""), err => {
                            //     if (err) throw err;
                            // });
                        }
                        
                    }
                });
                rimraf(__dirname + '/../../' + folderPath, function () { console.log("done"); });
    
            }catch(exp){

                console.log("error",exp)

            }
            response.end();
            // fs.unlink(__dirname+'/instanceLevelReport.pdf');
        } else {
            response.send("File Not Found");
            console.log(err);
        }

    });
};