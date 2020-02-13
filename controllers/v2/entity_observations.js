var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var model = require('../../db')
var helperFunc = require('../../helper/chart_data');
var pdfHandler = require('../../helper/common_handler');
var omit = require('object.omit');
var url = require("url");


//Controller for entity solution report (cluster/block/zone/district)
exports.entitySolutionReport = async function entitySolutionReport(req, res) {

    return new Promise(async function (resolve, reject) {
  
      let responseData = await entitySolutionReportGeneration(req, res);
      res.send(responseData);
  
    })
  
  };
  
  // Function for entity observation report generation 
  async function entitySolutionReportGeneration(req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      if (!req.body.entityId && !req.body.entityType && !req.body.solutionId) {
        var response = {
          result: false,
          message: 'entityId, entityType, immediateChildEntityType and solution are required fields'
        }
        resolve(response);
      }
  
      else {

        entityType = req.body.entityType;
        entityId = req.body.entityId;
        immediateChildEntityType = req.body.immediateChildEntityType;

        // Fetch query from cassandra
        model.MyModel.findOneAsync({ qid: "entity_solution_report_query" }, { allow_filtering: true })
          .then(async function (result) {
  
            var bodyParam = JSON.parse(result.query);
  
            if (config.druid.observation_datasource_name) {
              bodyParam.dataSource = config.druid.observation_datasource_name;
            }
  
            //Assign values to the query filter object 
            bodyParam.filter.fields[0].dimension = req.body.entityType;
            bodyParam.filter.fields[0].value = req.body.entityId;
            bodyParam.filter.fields[1].value = req.body.solutionId;

            //Push column names dynamically to the query dimensions array 
            if (!req.body.immediateChildEntityType) {
            bodyParam.dimensions.push(entityType, entityType + "Name");
            }
            else if (req.body.immediateChildEntityType == "school") {
            bodyParam.dimensions.push(entityType, entityType + "Name", immediateChildEntityType, immediateChildEntityType + "Name");
            }
            else {
            bodyParam.dimensions.push(entityType, entityType + "Name", immediateChildEntityType, immediateChildEntityType + "Name", "school", "schoolName");
            }
  
            //pass the query as body param and get the result from druid
            var options = config.druid.options;
            options.method = "POST";
            options.body = bodyParam;
            var data = await rp(options);
  
            if (!data.length) {
              resolve({ "data": "No observations made for the entity" })
            }
            else {
              var responseObj = await helperFunc.entityReportChart(data,req.body.entityId,req.body.entityType)
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
  
    })
  
  }



//Function for entity solution report PDF generation
exports.entitySolutionReportPdfGeneration = async function (req, res) {

  return new Promise (async function (resolve,reject){

    req.body = req.query;
    var entityResponse = await entitySolutionReportGeneration(req, res);

    if (("solutionName" in entityResponse) == true) {

      let obj = {
        solutionName: entityResponse.solutionName
      }

      let resData = await pdfHandler.pdfGeneration(entityResponse, true, obj);
      let hostname = req.headers.host;

      var responseObject = {
        "status": "success",
        "message": "report generated",
        pdfUrl: "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
      }
      resolve(responseObject);
    }

    else {
      resolve(entityResponse);
    }
  });
  
};




//Controller for Entity Observation Score Report
exports.entityObservationScoreReport = async function (req, res) {

  let data = await entityScoreReport(req, res);

  res.send(data);

}

async function entityScoreReport(req, res) {

  return new Promise(async function (resolve, reject) {

    if (!req.body.entityId && !req.body.observationId) {
      var response = {
        result: false,
        message: 'entityId and observationId are required fields'
      }
      resolve(response);
    }

    else {

      model.MyModel.findOneAsync({ qid: "entity_observation_score_query" }, { allow_filtering: true })
        .then(async function (result) {

          var bodyParam = JSON.parse(result.query);

          if (config.druid.observation_datasource_name) {
            bodyParam.dataSource = config.druid.observation_datasource_name;
          }

          bodyParam.filter.fields[1].fields[0].value = req.body.entityId;
          bodyParam.filter.fields[1].fields[1].value = req.body.observationId;

          //pass the query as body param and get the resul from druid
          var options = config.druid.options;
          options.method = "POST";
          options.body = bodyParam;

          var data = await rp(options);

          if (!data.length) {
            resolve({ "data": "No observations made for the entity" })
          }

          else {

            var responseObj = await helperFunc.entityScoreReportChartObjectCreation(data,"v2")
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

//Entity observation score pdf generation
exports.entityObservationScorePdfFunc = async function (req, res) {

  return new Promise(async function (resolve, reject) {

    var entityRes = await entityScoreReport(req, res);

    if (entityRes.result == true) {

      let obj = {
        schoolName: entityRes.schoolName,
        totalObservations: entityRes.totalObservations
      }

      let resData = await pdfHandler.instanceObservationScorePdfGeneration(entityRes, true, obj);

      let hostname = req.headers.host;

      resData.pdfUrl = "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + resData.pdfUrl

      resolve(resData);
    }

    else {
      resolve(entityRes);
    }

  });

};
