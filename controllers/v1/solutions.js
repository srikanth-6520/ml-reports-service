const rp = require('request-promise');
const request = require('request');
const model = require('../../db');
const helperFunc = require('../../helper/chart_data');
const filesHelper = require('../../common/files_helper');

/**
   * @api {post} /dhiti/api/v1/solutions/list 
   * Solutions List 
   * @apiVersion 1.0.0
   * @apiGroup Solutions
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "entityId": "",
  "entityType": "",
  "programId": ""
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "result": true,
       "data": {
           "mySolutions": [{
               "solutionId": "",
               "solutionName": "",
               "type": "",
               "scoring": "",
               "id": ""
           }],
           "allSolutions": [{
               "solutionId": "",
               "solutionName": "",
               "type": "",
               "scoring": "",
               "id": ""
           }]
       }
*     }
   * @apiUse errorBody
   */


//Controller for listing solution Names
exports.list = async function (req, res) {

    try {

    if (!req.body.entityId || !req.body.entityType || !req.body.programId) {
        res.status(400);
        var response = {
            result: false,
            message: 'entityId,entityType,programId are required fields'
        }
        res.send(response);
    }
    else {
        //get quey from cassandra
        // model.MyModel.findOneAsync({ qid: "solutions_list_query" }, { allow_filtering: true })
        //     .then(async function (result) {

        //         let bodyParam = JSON.parse(result.query);
                let bodyParam = gen.utils.getDruidQuery("solutions_list_query");

                bodyParam.filter.fields[0].dimension = req.body.entityType;
                bodyParam.filter.fields[0].value = req.body.entityId;
                bodyParam.filter.fields[1].fields[0].fields[0].value = req.userDetails.userId;
                bodyParam.filter.fields.push({"type":"selector","dimension":"programId","value":req.body.programId});

                let solutionArray = [getSolutions(bodyParam, filesHelper.assessment),
                getSolutions(bodyParam, filesHelper.observation)];

                let assessmentSolutions;
                let observationSolutions;

                await Promise.all(solutionArray)
                    .then(function (response) {
                        assessmentSolutions = response[0];
                        observationSolutions = response[1];
                    });

                let solutions = [...assessmentSolutions, ...observationSolutions];

                if (!solutions.length) {
                    res.send({ "result": false, "data": [] });
                }
                else {

                    let response = await helperFunc.solutionListCreation(solutions, req.userDetails.userId);
                    res.send(response);

                }

            // })
               }
             }
             catch(err) {
                res.status(500);
                let response = {
                    result: false,
                    message: 'INTERNAL_SERVER_ERROR'
                }
                res.send(response);
            }
    }

//function to get solutions
const getSolutions = async function(bodyParam, type) {

    return new Promise(async function (resolve, reject) {

        try {

            if (type == filesHelper.assessment) {

                bodyParam.dimensions.push("userId");
                if (process.env.ASSESSMENT_DATASOURCE_NAME) {
                    bodyParam.dataSource = process.env.ASSESSMENT_DATASOURCE_NAME;
                }
                bodyParam.filter.fields[1].fields[0].fields[0].dimension = "userId";
            }
            else if (type == filesHelper.observation) {

                bodyParam.dimensions.push("createdBy");
                if (process.env.OBSERVATION_DATASOURCE_NAME) {
                    bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
                }
                bodyParam.filter.fields[1].fields[0].fields[0].dimension = "createdBy";
            }

            //pass the query as body param and get the result from druid
            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;

            let solutions = await rp(options);

            if (solutions.length > 0) {
                await Promise.all(solutions.map(solution => {
                    solution.event.type = type;
                }))
            }

            return resolve(solutions);
        }
        catch (err) {
            return reject(err);
        }
    })
}


