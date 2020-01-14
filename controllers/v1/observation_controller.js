var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var model = require('../../db');
var helperFunc = require('../../helper/chart_data');
var pdfHandler = require('../../helper/common_handler');
var url = require('url');

//Controller for observation report
exports.observationReport = async function (req, res) {
    return new Promise(async function (resolve, reject) {
        let data = await observationReportData(req, res);
        res.send(data);
    })
}

async function observationReportData(req, res) {
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

            model.MyModel.findOneAsync({ qid: "observation_report_query" }, { allow_filtering: true })
                .then(async function (result) {

                    var bodyParam = JSON.parse(result.query);
                    if (config.druid.observation_datasource_name) {
                        bodyParam.dataSource = config.druid.observation_datasource_name;
                    }
                    bodyParam.filter.fields[0].value = req.body.observationId;

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
                        entityId = "";
                        entityType = "";
                        var responseObj = await helperFunc.entityReportChart(data,entityId,entityType)
                        //send the responseObj as API output
                        resolve(responseObj);
                       
                    }
                })
                .catch(function (err) {
                    res.status(400);
                    var response = {
                        result: false,
                        message: 'Data not found'
                    }
                    resolve(response);
                })
        }
    });
}


//Controller for observation pdf report
exports.observationGenerateReport = async function(req, res) {

    return new Promise(async function (resolve, reject) {

        req.body.observationId = req.query.observationId;
        let responseData = await observationReportData(req, res);

        if (("observationName" in responseData) == true) {

            let resData = await pdfHandler.pdfGeneration(responseData, true);

            if (resData.status && resData.status == "success") {
                var hostname = req.headers.host;
                var pathname = url.parse(req.url).pathname;
                console.log(pathname, "responseData", hostname);
                var obj = {
                    status: "success",
                    message: 'Observation Pdf Generated successfully',
                    pdfUrl: "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
                }

                resolve(obj);
            } else {
                resolve(resData);
            }
        }
        else {
            resolve(responseData);
        }


    });
}


//<======================== Observation score report ========================================>

//Controller for observation Score report  
exports.scoreReport = async function (req , res){

    let data = await observationScoreReport(req, res);
  
    res.send(data);
  
  }
  
  
async function observationScoreReport(req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      if (!req.body.observationId) {
        var response = {
          result: false,
          message: 'observationId is a required fields'
        }
        resolve(response);
      }
  
      else {
  
        model.MyModel.findOneAsync({ qid: "observation_score_report_query" }, { allow_filtering: true })
          .then(async function (result) {
  
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
  
            if (!data.length) {
              resolve({ "data": "No entities found" })
            }
  
            else {

              var responseObj = await helperFunc.observationScoreReportChart(data);

                //Call samiksha API to get total schools count for the given observationId
                let totalSchools = await getTotalSchools(req.body.observationId,req.headers["x-auth-token"]);

                if (totalSchools.result) {
                    responseObj.totalSchools = totalSchools.result.count;
                }
                resolve(responseObj);

            }
          })
  
          .catch(function (err) {
            console.log(err);
            var response = {
              result: false,
              message: 'Data not found'
            }
            resolve(response);
          })
  
      }
  
    })
  
  }
  

//Function to make a call to samiksha assessment entities list API
async function getTotalSchools(observationId,token) {

    return new Promise(async function(resolve){
    var options = {
      method: "GET",
      json: true,
      headers: {
          "Content-Type": "application/json",
          "X-authenticated-user-token": token
      },
      uri: config.samiksha_api.observation_details_api + observationId
  }
  
    rp(options).then(function(resp){
      return resolve(resp);
  
    }).catch(function(err){
      return resolve(err);
    })
  
  });
}
  
  

//Observation score pdf generation 
exports.observationScorePdfFunc = async function (req, res) {

    return new Promise (async function (resolve,reject){
  
    let observationRes = await observationScoreReport(req, res);
  
    if (observationRes.result == true) {

      let obj = {
          totalSchools : observationRes.totalSchools,
          schoolsObserved : observationRes.schoolsObserved
      }

      let resData = await pdfHandler.instanceObservationScorePdfGeneration(observationRes, true, obj);
  
      let hostname = req.headers.host;
  
      resData.pdfUrl = "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
  
      res.send(resData);
    }
  
    else {
      res.send(observationRes);
    }
  });
};
  