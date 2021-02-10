const rp = require('request-promise');
const request = require('request');
const observationController = require('../v2/observations');
const url = require("url");
const omit = require('object.omit');
const assessmentService = require('../../helper/assessment_service');
const storePdfReportsToS3 = (!process.env.STORE_PDF_REPORTS_IN_AWS_ON_OFF || process.env.STORE_PDF_REPORTS_IN_AWS_ON_OFF != "OFF") ? "ON" : "OFF"
const helperFunc = require('../../helper/chart_data_v2');
const pdfHandler =  require('../../helper/common_handler_v2');


//Controller for entity solution report (cluster/block/zone/district)
exports.entitySolutionReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {
  
      let responseData = await entitySolutionReportGeneration(req, res);
      res.send(responseData);
  
    })
  
  };
  
  // Function for entity observation report generation 
  async function entitySolutionReportGeneration(req, res) {
  
    return new Promise(async function (resolve, reject) {
  
      try {
  
        if (!req.body.entityId || !req.body.entityType || !req.body.solutionId) {
          let response = {
            result: false,
            message: 'entityId, entityType, immediateChildEntityType and solutionId are required fields'
          }
          resolve(response);
        }
  
        else {
  
          entityType = req.body.entityType;
          entityId = req.body.entityId;
          immediateChildEntityType = req.body.immediateChildEntityType;
  
          let bodyParam = gen.utils.getDruidQuery("entity_solution_report_query");
  
          if (process.env.OBSERVATION_DATASOURCE_NAME) {
            bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
          }
  
          //Assign values to the query filter object 
          bodyParam.filter.fields[0].dimension = req.body.entityType;
          bodyParam.filter.fields[0].value = req.body.entityId;
          bodyParam.filter.fields[1].value = req.body.solutionId;
  
          //if programId is given
          if (req.body.programId) {
            let programFilter = { "type": "selector", "dimension": "programId", "value": req.body.programId };
            bodyParam.filter.fields.push(programFilter);
          }
  
          if (req.body.reportType == "my") {
            let filter = {
              "type": "or", "fields": [{
                "type": "and", "fields": [{ "type": "selector", "dimension": "createdBy", "value": req.userDetails.userId },
                { "type": "selector", "dimension": "isAPrivateProgram", "value": true }]
              },
              {
                "type": "and", "fields": [{ "type": "selector", "dimension": "createdBy", "value": req.userDetails.userId },
                { "type": "selector", "dimension": "isAPrivateProgram", "value": false }]
              }]
            };
  
            bodyParam.filter.fields.push(filter);
          }
          else {
            let filter = {
              "type": "or", "fields": [{
                "type": "and", "fields": [{ "type": "selector", "dimension": "createdBy", "value": req.userDetails.userId },
                { "type": "selector", "dimension": "isAPrivateProgram", "value": true }]
              },
              { "type": "selector", "dimension": "isAPrivateProgram", "value": false }]
            };
  
            bodyParam.filter.fields.push(filter);
          }
  
          // filter out not answered questions
          bodyParam.filter.fields.push({ "type": "not", "field": { "type": "selector", "dimension": "questionAnswer", "value": "" } });
  
          //get the acl data from samiksha service
          let userProfile = await assessmentService.getUserProfile(req.userDetails.userId, req.headers["x-auth-token"]);
          let aclLength = Object.keys(userProfile.result.acl);
          if (userProfile.result && userProfile.result.acl && aclLength > 0) {
            let tagsArray = await helperFunc.tagsArrayCreateFunc(userProfile.result.acl);
  
            bodyParam.filter.fields.push({
              "type": "or", "fields": [{ "type": "in", "dimension": "schoolType", "values": tagsArray },
              { "type": "in", "dimension": "administrationType", "values": tagsArray }]
            });
          }
  
  
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
          let options = gen.utils.getDruidConnection();
          options.method = "POST";
          options.body = bodyParam;
          let data = await rp(options);
  
          if (!data.length) {
            resolve({ "data": "No observations made for the entity" })
          }
          else {
            let responseObj = await helperFunc.entityReportChart(data, req.body.entityId, req.body.entityType)
            resolve(responseObj);
          }
        }
      }
      catch (err) {
        let response = {
          result: false,
          message: 'INTERNAL_SERVER_ERROR'
        }
        resolve(response);
      }
    })
  }
  
//Funcion for instance observation pdf generation
async function instancePdfReport(req, res) {

    return new Promise(async function (resolve, reject) {
  
      let instaRes = await observationController.instanceObservationData(req, res);
  
      if (("observationName" in instaRes) == true) {
        
        let resData = await pdfHandler.instanceObservationPdfGeneration(instaRes, storeReportsToS3 = false);
  
        if (resData.status && resData.status == "success") {
  
          let response = {
            status: "success",
            message: 'Instance observation Pdf Generated successfully',
            pdfUrl: process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
          }
  
          resolve(response);
  
        } else {
          resolve(resData);
        }
      
      }
      else {
        resolve(instaRes);
      }
    });
};
  

//Controller for entity observation pdf generation
async function entityObservationPdf(req, res) {

    return new Promise(async function (resolve, reject) {
  
      let responseData = await observationController.entityObservationData(req, res);
  
      if (("observationName" in responseData) == true) {
  
        let resData = await pdfHandler.pdfGeneration(responseData, storeReportsToS3 = false);
  
        if (resData.status && resData.status == "success") {
  
          let obj = {
            status: "success",
            message: 'Observation Pdf Generated successfully',
            pdfUrl: process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
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


//Controller for observation pdf report
async function observationGenerateReport(req, res) {

    return new Promise(async function (resolve, reject) {
  
      let responseData = await observationController.observationReportData(req, res);
  
      if (("observationName" in responseData) == true) {
  
        let resData = await pdfHandler.pdfGeneration(responseData, storeReportsToS3 = false);
  
        if (resData.status && resData.status == "success") {
  
          let obj = {
            status: "success",
            message: 'Observation Pdf Generated successfully',
            pdfUrl: process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
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


//Function for entity solution report PDF generation
async function entitySolutionReportPdfGeneration(req, res) {

    return new Promise(async function (resolve, reject) {
  
      var entityResponse = await entitySolutionReportGeneration(req, res);
  
      if (("solutionName" in entityResponse) == true) {
  
        let obj = {
          solutionName: entityResponse.solutionName
        }
  
        let resData = await pdfHandler.pdfGeneration(entityResponse, storeReportsToS3 = false, obj);
  
        var responseObject = {
          "status": "success",
          "message": "report generated",
          pdfUrl: process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
        }
        resolve(responseObject);
      }
  
      else {
        resolve(entityResponse);
      }
    });
  
  };
  


//Controller function for observation pdf reports
exports.pdfReports = async function (req, res) {

  return new Promise(async function (resolve, reject) {

    if (req.body.observationId && req.body.entityId) {

      let resObj = await entityObservationPdf(req, res);
      res.send(resObj);
    }
    else if (req.body.submissionId) {

      let resObj = await instancePdfReport(req, res);
      res.send(resObj);

    }
    else if (req.body.observationId) {

      let resObj = await observationGenerateReport(req, res);
      res.send(resObj);

    }
    else if (req.body.entityId && req.body.entityType && req.body.solutionId) {

      let resObj = await entitySolutionReportPdfGeneration(req, res);
      res.send(resObj);
    }
    else if (req.body.entityId && req.body.entityType && req.body.solutionId && req.body.reportType) {

      let resObj = await entitySolutionReportPdfGeneration(req, res);
      res.send(resObj);
    }
    else {
      res.send({
        status: "failure",
        message: "Invalid input"
      });
    }
  })

}

