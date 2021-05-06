
const rp = require('request-promise');
const helperFunc = require('../../helper/chart_data');
const kendraService = require('../../helper/kendra_service');


/**
   * @api {post} /dhiti/api/v1/observations/listAllEvidences 
   * List all evidence 
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "submissionId": "",
  "entityId": "",
  "observationId": "",
  "questionId": ""
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "result": true,
       "data": [{
          "images":[{"url":"", "extension":""}],
          "videos":[{"url":"", "extension":""}],
          "documents":[{"url":"", "extension":""}],
          "remarks":[]
        }]
*     }
   * @apiUse errorBody
   */

//controller for all evidence API
exports.listAllEvidences = async function (req, res) {

  return new Promise(async function (resolve, reject) {

    let responseData = await allEvidencesList(req, res);
    res.send(responseData);

  })

};


//Function for getting all the evidences of a question
async function allEvidencesList(req, res) {
  return new Promise(async function (resolve, reject) {
    
    try {

    if (!req.body.submissionId && !req.body.questionId) {
      var response = {
        result: false,
        message: 'submissionId and questionId are required fields'
      }
      resolve(response);

    } else if (!req.body.entityId && !req.body.observationId && !req.body.questionId) {
      var response = {
        result: false,
        message: 'entityId, observationId and questionId are required fields'
      }
      resolve(response);

    } else if (!req.body.observationId && !req.body.questionId) {
      var response = {
        result: false,
        message: 'observationId and questionId are required fields'
      }
      resolve(response);

    } else {

          let bodyParam = gen.utils.getDruidQuery("list_all_evidence_query");

          if (process.env.OBSERVATION_EVIDENCE_DATASOURCE_NAME) {
            bodyParam.dataSource = process.env.OBSERVATION_EVIDENCE_DATASOURCE_NAME;
          }

          let filter = {};

          if (req.body.submissionId && req.body.questionId) {
            filter = { "type": "and", fields: [{ "type": "selector", "dimension": "observationSubmissionId", "value": req.body.submissionId }, { "type": "selector", "dimension": "questionExternalId", "value": req.body.questionId }] };
          }
          else if (req.body.entityId && req.body.observationId && req.body.questionId) {
            let entityType = "school";
            if(req.body.entityType){
              entityType = req.body.entityType;
            }
            filter = { "type": "and", fields: [{ "type": "selector", "dimension": "entity", "value": req.body.entityId }, { "type": "selector", "dimension": "observationId", "value": req.body.observationId }, { "type": "selector", "dimension": "questionExternalId", "value": req.body.questionId }] };
          }
          else if (req.body.observationId && req.body.questionId) {
            filter = { "type": "and", fields: [{ "type": "selector", "dimension": "observationId", "value": req.body.observationId }, { "type": "selector", "dimension": "questionExternalId", "value": req.body.questionId }] };
          }

          bodyParam.filter = filter;

          //pass the query as body param and get the resul from druid
          var options = gen.utils.getDruidConnection();
          options.method = "POST";
          options.body = bodyParam;
          var data = await rp(options);

          if (!data.length) {
            resolve({
              "result": false,
              "data": "Evidence_NOT_FOUND"
            });
          } else {

            let evidenceList = await helperFunc.getEvidenceList(data);

            let downloadableUrl = await kendraService.getDownloadableUrl(evidenceList[0], req.headers["x-auth-token"]);

            let response = await helperFunc.evidenceResponseCreateFunc(downloadableUrl.result);

            response.remarks = evidenceList[1];
            
            resolve({"result" : true, "data" : response});
          }
        }
      }
        catch(err){
          let response = {
            result: false,
            message: 'Data not found'
          };
          resolve(response);

        }
    
  })

}


