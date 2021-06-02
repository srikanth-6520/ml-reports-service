const surveysHelper = require('../../helper/surveys');

/**
* @api {get} /dhiti/api/v2/surveys/solutionReport?solutionId=:solutionId solution report
* Survey solution report
* @apiVersion 1.0.0
* @apiGroup Surveys
* @apiHeader {String} x-auth-token Authenticity token  
* @apiSampleRequest /dhiti/api/v1/surveys/solutionReport?solutionId=5f58b0b8894a0928fc8aa9b3
* @apiSuccessExample {json} Success-Response:
* {  
*   "solutionName" : "",
    "response": [{
      "order": "",
      "question": "",
      "responseType": "",
      "answers": [],
      "chart": {},
      "instanceQuestions":[],
      "evidences":[
           {"url":"", "extension":""}
       ]
    }]
* }
* @apiUse errorBody
*/

exports.solutionReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {
        let response;
        if (!req.query.solutionId) {

            response = {
                result: false,
                message: 'solutionId is a required field'
            };

            res.send(response);

        } else {
            let response = await surveysHelper.surveySolutionReport(req, res); 
            res.send(response);
        }
    });
};


/**
* @api {get} /dhiti/api/v2/surveys/submissionReport?submissionId=:submissionId submission report
* Survey submission report
* @apiVersion 1.0.0
* @apiGroup Surveys
* @apiHeader {String} x-auth-token Authenticity token  
* @apiSampleRequest /dhiti/api/v1/surveys/submissionReport?submissionId=5f58b0b8894a0928fc8aa9b3
* @apiSuccessExample {json} Success-Response:
* {
*   "solutionName": "",
    "response": [{
      "order": "",
      "question": "",
      "responseType": "",
      "answers": [],
      "chart": {},
      "instanceQuestions":[],
      "evidences":[
           {"url":"", "extension":""}
       ]
    }]
* }
* @apiUse errorBody
*/

exports.submissionReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        if (!req.query.submissionId) {

            let response = {
                result: false,
                message: 'submissionId is a required field'
            };
            res.send(response);

        } else {

            let response = await surveysHelper.surveySubmissionReport(req, res);
            res.send(response);
        }

    });
};




