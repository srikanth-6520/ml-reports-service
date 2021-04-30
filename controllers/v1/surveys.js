const rp = require('request-promise');
const helperFunc = require('../../helper/chart_data');
const kendraService = require('../../helper/kendra_service');
const numberOfResponsesLimit = 10;


/**
  * @api {post} /dhiti/api/v1/surveys/getAllResponsesOfQuestion Get all responses for the given questionId
  * List all responses
  * @apiVersion 1.0.0
  * @apiGroup Surveys
  * @apiHeader {String} x-auth-token Authenticity token  
  * @apiSampleRequest /dhiti/api/v1/surveys/getAllResponsesOfQuestion
  * @apiParamExample {json} Request-Body:
  * {
    "solutionId": "",
    "questionExternalId": "",
    "completedDate": ""
  * }
  * @apiSuccessExample {json} Success-Response:
  * {  
  *   "question" : "",
      "answers": [],
      "completedDate": ""
  * }
  * @apiUse errorBody
  */

exports.getAllResponsesOfQuestion = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        try {

            let response;

            if (!req.body.solutionId) {
                response = {
                    result: false,
                    message: 'solutionId is a required field'
                }
                res.send(response);
            }

            if (!req.body.questionExternalId) {
                response = {
                    result: false,
                    message: 'questionExternalId is a required field'
                }
                res.send(response);
            }

            let bodyParam = gen.utils.getDruidQuery("list_all_responses");

            if (process.env.SURVEY_DATASOURCE_NAME) {
                bodyParam.dataSource = process.env.SURVEY_DATASOURCE_NAME;
            }

            bodyParam.filter.fields[0].value = req.body.solutionId;
            bodyParam.filter.fields[1].value = req.body.questionExternalId;
            bodyParam.limit = numberOfResponsesLimit;
            if (req.body.completedDate) {
                let timeFilter = { "type": "bound", "dimension": "completedDate", "lower": req.body.completedDate, "lowerStrict": true, "ordering": "numeric" }
                bodyParam.filter.fields.push(timeFilter);
            }

            //pass the query as body param and get the resul from druid
            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;
            let data = await rp(options);

            if (!data.length) {
                res.send({
                    "result": false,
                    "data": "DATA_NOT_FOUND"
                });

            } else {

                response = await helperFunc.listALLAnswers(data);
                res.send(response);
            }
        }
        catch (err) {
            response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
            };
            res.send(response);
        }
    })
}



/**
* @api {post} /dhiti/api/v1/surveys/listAllEvidences
* List all evidences
* @apiVersion 1.0.0
* @apiGroup Surveys
* @apiHeader {String} x-auth-token Authenticity token
* @apiParamExample {json} Request-Body:
* {
  "submissionId": "",
  "solutionId": "",
  "questionId": ""
* }
* @apiSuccessExample {json} Success-Response:
*  HTTP/1.1 200 OK
*  {
    "result": true,
    "data": [{
       "images":[{"url":"", "extension":""}],
       "videos":[{"url":"", "extension":""}],
       "documents":[{"url":"", "extension":""}],
       "remarks":[]
     }]
*  }
* @apiUse errorBody
*/

exports.listAllEvidences = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        try {

            if (!req.body.solutionId && !req.body.submissionId) {
                let response = {
                    result: false,
                    message: 'submissionId/solutionId is a required field'
                }
                res.send(response);
            }

            if (!req.body.questionId) {
                let response = {
                    result: false,
                    message: 'questionId is a required field'
                }
                res.send(response);
            }

            let bodyParam = gen.utils.getDruidQuery("list_all_evidence_query");

            if (process.env.SURVEY_EVIDENCE_DATASOURCE_NAME) {
                bodyParam.dataSource = process.env.SURVEY_EVIDENCE_DATASOURCE_NAME;
            }

            let filter = {};

            if (req.body.submissionId && req.body.questionId) {
                filter = { "type": "and", fields: [{ "type": "selector", "dimension": "surveySubmissionId", "value": req.body.submissionId }, { "type": "selector", "dimension": "questionExternalId", "value": req.body.questionId }] };
            }
            else if (req.body.solutionId && req.body.questionId) {
                filter = { "type": "and", fields: [{ "type": "selector", "dimension": "solutionId", "value": req.body.solutionId }, { "type": "selector", "dimension": "questionExternalId", "value": req.body.questionId }] };
            }

            bodyParam.filter = filter;

            //pass the query as body param and get the resul from druid
            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;
            let data = await rp(options);

            if (!data.length) {
                res.send({
                    result: false,
                    message: "Evidence_NOT_FOUND"
                });
            } else {

                let evidenceList = await helperFunc.getEvidenceList(data);

                let downloadableUrl = await kendraService.getDownloadableUrl(evidenceList[0], req.headers["x-auth-token"]);

                let response = await helperFunc.evidenceResponseCreateFunc(downloadableUrl.result);

                response.remarks = evidenceList[1];

                res.send({ result: true, data: response });
            }
        }
        catch (err) {
            let response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
            };
            res.send(response);

        }
    })
};

