const config = require('../../config/config');
const rp = require('request-promise');
const request = require('request');
const model = require('../../db')
const helperFunc = require('../../helper/chart_data');
const pdfHandler = require('../../helper/common_handler');
const omit = require('object.omit');
const url = require("url");
const authService = require('../../services/authentication_service')

//Controller for entity observation report
exports.entityReport = async function (req, res) {

  let data = await entityObservationData(req, res);

  res.send(data);
}


async function entityObservationData(req, res) {

  return new Promise(async function (resolve, reject) {

    if (!req.body.entityId && !req.body.observationId) {
      var response = {
        result: false,
        message: 'entityId and observationId are required fields'
      }
      resolve(response);
    }
    else {

      model.MyModel.findOneAsync({ qid: "entity_observation_query" }, { allow_filtering: true })
        .then(async function (result) {

          var bodyParam = JSON.parse(result.query);

          if (config.druid.observation_datasource_name) {
            bodyParam.dataSource = config.druid.observation_datasource_name;
          }

          bodyParam.filter.fields[0].value = req.body.entityId;
          bodyParam.filter.fields[1].value = req.body.observationId;

          //pass the query as body param and get the resul from druid
          var options = config.druid.options;
          options.method = "POST";
          options.body = bodyParam;
          var data = await rp(options);

          if (!data.length) {
            resolve({ "data": "No observations made for the entity" })
          }
          else {
            var responseObj = await helperFunc.entityReportChart(data, req.body.entityId, "school")
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


//Controller for entity observation pdf generation
exports.entityObservationPdf = async function (req, res) {

  return new Promise(async function (resolve, reject) {

    req.body.observationId = req.query.observationId;
    req.body.entityId = req.query.entityId;

    let responseData = await entityObservationData(req, res);

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



// Controller for entity observation  (cluster/block/zone/district)
exports.entityObservationReport = async function entityObservationReport(req, res) {

  return new Promise(async function (resolve, reject) {

    let responseData = await entityObservationReportGeneration(req, res);
    res.send(responseData);

  })

};

// Function for entity observation report generation 
async function entityObservationReportGeneration(req, res) {

  return new Promise(async function (resolve, reject) {

    if (!req.body.entityId && !req.body.entityType && !req.body.observationId) {
      res.status(400);
      var response = {
        result: false,
        message: 'entityId, entityType, immediateChildEntityType and observationId are required fields'
      }
      resolve(response);
    }

    else {

      entityType = req.body.entityType;
      entityId = req.body.entityId;
      immediateChildEntityType = req.body.immediateChildEntityType;

      // Fetch query from cassandra
      model.MyModel.findOneAsync({ qid: "entity_observation_report_query" }, { allow_filtering: true })
        .then(async function (result) {

          var bodyParam = JSON.parse(result.query);

          if (config.druid.observation_datasource_name) {
            bodyParam.dataSource = config.druid.observation_datasource_name;
          }

          //Assign values to the query filter object 
          bodyParam.filter.fields[0].dimension = req.body.entityType;
          bodyParam.filter.fields[0].value = req.body.entityId;
          bodyParam.filter.fields[1].value = req.body.observationId;

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
            var responseObj = await helperFunc.entityReportChart(data, req.body.entityId, req.body.entityType)
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


//Function for entity observation report PDF generation
exports.entityObservationReportPdfGeneration = async function (req, res) {

  return new Promise(async function (resolve, reject) {

    req.body = req.query;
    var entityResponse = await entityObservationReportGeneration(req, res);

    if (("observationName" in entityResponse) == true) {

      let resData = await pdfHandler.pdfGeneration(entityResponse, true);
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


//<======================== Entity observation score report ========================================>


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

            var responseObj = await helperFunc.entityScoreReportChartObjectCreation(data, "v1")
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



//Controller for entity solution score report (cluster/block/zone/district/state)
exports.entitySolutionScoreReport = async function (req, res) {

  return new Promise(async function (resolve, reject) {

    let responseData = await entitySolutionScoreReportGeneration(req, res);
    res.send(responseData);

  })

};

//Function for entity solution report generation 
async function entitySolutionScoreReportGeneration(req, res) {

  return new Promise(async function (resolve, reject) {

    if (!req.body.entityId && !req.body.entityType && !req.body.solutionId) {
      res.status(400);
      var response = {
        result: false,
        message: 'entityId, entityType and solutionId are required fields'
      }
      resolve(response);
    }

    else if (req.body.entityType == "school") {

      let response = await schoolSolutionScoreReport(req, res);
      resolve(response);

    }

    else {
      // Fetch query from cassandra
      model.MyModel.findOneAsync({ qid: "entity_solution_score_query" }, { allow_filtering: true })
        .then(async function (result) {

          var bodyParam = JSON.parse(result.query);

          if (config.druid.observation_datasource_name) {
            bodyParam.dataSource = config.druid.observation_datasource_name;
          }

          //Assign values to the query filter object 
          bodyParam.filter.fields[1].fields[0].dimension = req.body.entityType;
          bodyParam.filter.fields[1].fields[0].value = req.body.entityId;
          bodyParam.filter.fields[1].fields[1].value = req.body.solutionId;

          //code for myObservation
          if (req.body.reportType == "my") {
            let createdBy = await getCreatedByField(req, res);
            let filter = { "type": "selector", "dimension": "createdBy", "value": createdBy }
            bodyParam.filter.fields[1].fields.push(filter);
          }

          console.log(bodyParam);

          //pass the query as body param and get the result from druid
          var options = config.druid.options;
          options.method = "POST";
          options.body = bodyParam;
          var data = await rp(options);

          if (!data.length) {
            resolve({ "data": "No observations made for the entity" })
          }
          else {
            var responseObj = await helperFunc.observationScoreReportChart(data)
            responseObj.solutionId = req.body.solutionId;
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

//School solution score report creation function
async function schoolSolutionScoreReport(req, res) {

  return new Promise(async function (resolve, reject) {

    model.MyModel.findOneAsync({ qid: "entity_solution_score_query" }, { allow_filtering: true })
      .then(async function (result) {

        var bodyParam = JSON.parse(result.query);

        if (config.druid.observation_datasource_name) {
          bodyParam.dataSource = config.druid.observation_datasource_name;
        }

        //Assign values to the query filter object 
        bodyParam.filter.fields[1].fields[0].dimension = req.body.entityType;
        bodyParam.filter.fields[1].fields[0].value = req.body.entityId;
        bodyParam.filter.fields[1].fields[1].value = req.body.solutionId;

        //code for myObservation
        if (req.body.reportType == "my") {
          let createdBy = await getCreatedByField(req, res);
          let filter = { "type": "selector", "dimension": "createdBy", "value": createdBy }
          bodyParam.filter.fields[1].fields.push(filter);
        }

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
          delete responseObj.observationName;
          responseObj.solutionName = data[0].event.solutionName;
          resolve(responseObj);

        }
      })

      .catch(function (err) {
        var response = {
          result: false,
          message: 'Data not found'
        }
        resolve(response);
      })
  })

}

//Entity solution score pdf generation
exports.entitySolutionScorePdfFunc = async function (req, res) {

  return new Promise(async function (resolve, reject) {

    var entityRes = await entitySolutionScoreReportGeneration(req, res);

    if (entityRes.result == true) {

      let obj = {
        solutionName: entityRes.solutionName
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



//API for unnati service
exports.observationsByEntity = async function (req, res) {

  if (!req.body && !req.body) {
    res.status(400);
    var response = {
      result: false,
      message: 'entityId and observationId are required fields'
    }
    res.send(response);
  }
  else {
    model.MyModel.findOneAsync({
      qid: "observations_by_entity"
    }, {
        allow_filtering: true
      })
      .then(async function (result) {

        if (req.body.search) {

          var bodyParam = JSON.parse(result.query);
          if (config.druid.observation_datasource_name) {
            bodyParam.dataSource = config.druid.observation_datasource_name;
          }
          var query = bodyParam;
          var fieldsArray = [];
          var search = "%" + req.body.search + "%";
          var dimension = "";

          if (req.body.entityType == "zone") {
            dimension = "zone";
          } else if (req.body.entityType == "block") {
            dimension = "block";
          } else if (req.body.entityType == "hub") {
            dimension = "hub";
          } else if (req.body.entityType == "cluster") {
            dimension = "cluster";
          } else if (req.body.entityType == "distict") {
            dimension = "distict";
          } else if (req.body.entityType == "state") {
            dimension = "state";
          } else {
            dimension = "entityId";
          }

          fieldsArray.push({ "type": "selector", "dimension": dimension, "value": req.body.queryId });
          fieldsArray.push({ "type": "like", "dimension": "observationName", "pattern": search });
          query.filter.fields.push(...fieldsArray);

          query.filter.type = "and";
          var options = config.druid.options;
          options.method = "POST";
          options.body = query;
          var data = await rp(options);

          let observationData = await getObsvByentitys(req, result);
          var arr = [];

          await Promise.all(observationData.map(async each => {
            arr.push(each);
          }));

          await Promise.all(data.map(async each => {
            if (!arr.includes(each)) {
              arr.push(each);
            }
          }));

          res.send(arr);


        } else {

          let observationData = await getObsvByentitys(req, result);
          res.send(observationData);

          // var bodyParam = JSON.parse(result.query);
          // if (config.druid.observation_datasource_name) {
          //   bodyParam.dataSource = config.druid.observation_datasource_name;
          // }
          // var query = bodyParam;
          // var fieldsArray = [];


          // await Promise.all(req.body.entityIds.map(async ele => {
          //   let objSelecter = { "type": "selector", "dimension": "entityId", "value": ele };
          //   fieldsArray.push(objSelecter);
          // }
          // ));


          // query.filter.fields.push(...fieldsArray);

          // var options = config.druid.options;
          // options.method = "POST";
          // options.body = query;
          // var data = await rp(options);


          // res.send(data);

        }
      });
  }

}

async function getObsvByentitys(req, result) {
  return new Promise(async function (resolve, reject) {

    var bodyParam = JSON.parse(result.query);
    if (config.druid.observation_datasource_name) {
      bodyParam.dataSource = config.druid.observation_datasource_name;
    }
    var query = bodyParam;
    var fieldsArray = [];


    await Promise.all(req.body.entityIds.map(async ele => {
      let objSelecter = { "type": "selector", "dimension": "entityId", "value": ele };
      fieldsArray.push(objSelecter);
    }
    ));

    query.filter.fields.push(...fieldsArray);
    var options = config.druid.options;
    options.method = "POST";
    options.body = query;
    var data = await rp(options);
    resolve(data);
  });

}



// Function for getting createdBy field from header access token
async function getCreatedByField(req, res) {

  return new Promise(async function (resolve, reject) {

    let token = await authService.validateToken(req, res);

    resolve(token.userId);

  })
}