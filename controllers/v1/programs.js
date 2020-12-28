const rp = require('request-promise');
const request = require('request');
const model = require('../../db');
const helperFunc = require('../../helper/chart_data');
const filesHelper = require('../../common/files_helper');


/**
   * @api {post} /dhiti/api/v1/programs/list 
   * Programs List 
   * @apiVersion 1.0.0
   * @apiGroup Programs
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "entityId": "",
  "entityType": ""
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
       "result": true,
       "data": [
           {
               "programId": "",
               "programName": "",
               "type": ""
           }
       ]
*     }
   * @apiUse errorBody
   */

exports.list = async function (req, res) {

    try {
  
    if (!req.body.entityId || !req.body.entityType) {
        res.status(400);
        let response = {
            result: false,
            message: 'entityId and entityType are required fields'
        }
        res.send(response);
    }
    else {

         //get quey from cassandra
        //  model.MyModel.findOneAsync({ qid: "programs_list_query" }, { allow_filtering: true })
        //  .then(async function (result) {

        //      let bodyParam = JSON.parse(result.query);

             let bodyParam = gen.utils.getDruidQuery("programs_list_query");

             bodyParam.filter.fields[0].dimension = req.body.entityType;
             bodyParam.filter.fields[0].value = req.body.entityId;
             bodyParam.filter.fields[1].fields[0].fields[0].value = req.userDetails.userId;

             let assessmentPrograms;
             let observationPrograms;

            let ProgramArray = [getPrograms(bodyParam, filesHelper.assessment),
                               getPrograms(bodyParam, filesHelper.observation)];

            await Promise.all(ProgramArray)
            .then(function (responses) {
                assessmentPrograms = responses[0];
                observationPrograms = responses[1];
             });
             
             let programs = [...assessmentPrograms,...observationPrograms];

             if (!programs.length) {
                 res.send({ "result": false, "data": [] });
             }
             else {
                 let response = await helperFunc.programsListCreation(programs);
                 res.send(response);
             }
        //  })
            }
        }
        catch(err) {
            res.status(500);
            let response = {
                result: false,
                message: 'INTERNAL_SERVER_ERROR',
            }
            res.send(response);
        }
    };

//Function to get programs
const getPrograms = async function (bodyParam, type) {

    return new Promise(async function (resolve, reject) {

        try {

            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;

            if (type == filesHelper.assessment) {
                options.body.dataSource = process.env.ASSESSMENT_DATASOURCE_NAME;
                options.body.filter.fields[1].fields[0].fields[0].dimension = "userId";
            }
            else if (type == filesHelper.observation) {
                options.body.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
                options.body.filter.fields[1].fields[0].fields[0].dimension = "createdBy";
            }

            let programs = await rp(options);

            return resolve(programs);
        }
        catch (err) {
            return reject(err);
        }
    })
}

