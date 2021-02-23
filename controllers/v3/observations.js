const observationsHelper = require('../../helper/observations');

/**
   * @api {post} /dhiti/api/v3/observations/entitySolutionReport 
   * entity solution report
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "entityId": "",
  "entityType": "",
  "solutionId": "",
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "entityName": "",
       "solutionName": "",
       "solutionId": "",
       "entityType": "",
       "entityId": "",
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
*     }
   * @apiUse errorBody
   */
exports.entitySolutionReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {
  
      let responseData = await observationsHelper.entitySolutionReportGeneration(req, res);
      res.send(responseData);
  
    })
  
  };
  
 
 /**
   * @api {post} /dhiti/api/v3/observations/entityScoreReport
   * Entity score report 
   * @apiVersion 1.0.0
   * @apiGroup Observations
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "entityId": "",
  "observationId": "",
  "filter":{
     "questionId": []
  }
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "result": true,
       "schoolName": "",
       "totalObservations": "",
       "observationName": "",
       "response" : [{
          "criteriaName": "",
          "criteriaId": "",
          "questionArray": [{
              "order": "",
              "question": "",
              "chart": {
                "type": 'bar',
                "data": {
                  "labels": [
                    "Obs1",
                    "Obs2",
                    "Obs3",
                    "Obs4",
                    "Obs5"
                  ],
                  "datasets": [
                    {

                        "data": [1,2,3,4,5],
                        "backgroundColor": "#F6B343"
                    }]
                },
                "options": {
                  "legend": false,
                  "scales": {
                    "xAxes": [{
                        "scaleLabel": {
                            "display": true,
                            "labelString": 'observations'
                        }
                    }],
                    "yAxes": [{
                        "ticks": {
                            "min": 0,
                            "max": 5
                        },

                        "scaleLabel": {
                            "display": true,
                            "labelString": 'score'
                        }
                    }],
                  }
                }
              }
            }]
        }]
*     }
   * @apiUse errorBody
   */
exports.entityScoreReport = async function (req, res) {

  let data = await observationsHelper.entityScoreReportGenerate(req, res);

  res.send(data);

}

