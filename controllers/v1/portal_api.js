const readFile = require('../../helper/read_file')
const config = require('../../config/config.json');
var groupBy = require('group-array')
/**
     * @apiDefine errorBody
     * @apiError {String} status 4XX,5XX
     * @apiError {String} message Error
     */    /**
* @apiDefine successBody
*  @apiSuccess {String} status 200
* @apiSuccess {String} result Data
*/

/**
   * @api {get} /dhiti/api/v1/portal_api/genericApi
   * @apiVersion 1.0.0
   * @apiHeader {String} x-auth-token Authenticity token 
   * @apiGroup Shikshalokam 
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "result": true,
*       "data": [{
        }]
*     }
   * @apiUse errorBody
   */
  exports.genericApi = async function (req, res) {
    try {
        let randomNumer = Math.random().toFixed(2)*100
        console.log(`\n\n\n\n`);
        console.log(`----- Generic API call start --- ${new Date()} -------------- Random No : ${randomNumer}`);
        var fileName = config.file_path[`${req.body.key}`];
        console.log(`----- Before s3 call --- ${new Date()} -------------- Random No : ${randomNumer}`);
        var result = await readFile.readS3File(fileName, randomNumer);
        console.log(`----- reading s3 file finished --- ${new Date()} -------------- Random No : ${randomNumer}`);
        console.log(`----- After s3 call --- ${new Date()} -------------- Random No : ${randomNumer}`);
        console.log(`----- data length of the s3 file ::: ${result.length} -------------- Random No : ${randomNumer}`);        
        console.log(`----- Generic API call end --- ${new Date()} -------------- Random No : ${randomNumer}`);
        res.send({ "result": true, "data": result })
        console.log(`  ----- response ----${result}`)
        console.log(`----- Generic API response sent --- ${new Date()} -------------- Random No : ${randomNumer}`);
    }
    catch (e) {
        console.log(e);
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }

};
/**
   * @api {post} /dhiti/api/v1/portal_api/varianceCalculation
   * @apiVersion 1.0.0
   * @apiGroup Shikshalokam 
   * @apiParamExample {json} Request-Body:
*    {
     "data":{"data1":[],"data2":[]}
*    }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "result": true,
*       "data": [
                variance
               ]
*     }
   * @apiUse errorBody
   */
  exports.varianceCalculation = async function (req, res) {
    try {
        let randomNumer = Math.random().toFixed(2)*100
        console.log(`\n\n\n\n`);
        console.log(`----- Variance API call start --- ${new Date()} -------------- Random No : ${randomNumer}`);
        var variance = [];
        var data1 = req.body.data.data1;
        var data2 = req.body.data.data2;
        for (let i = 0; i < data1.length; i++) {
            var percentageVariance = parseFloat(((data2[i] - data1[i]) * 100 / data1[i]).toFixed(2));
            variance.push(percentageVariance);
        }
        console.log(`----- Variance API call end --- ${new Date()} -------------- Random No : ${randomNumer}`);        
        res.status(200).json({ 'result': true, 'data': variance });
        console.log(` ------res[oponse -------${variance}`)
        console.log(`----- Variance API response sent --- ${new Date()} -------------- Random No : ${randomNumer}`);
    } catch (e) {
        console.log(e);
        res.status(500).json({ errMessage: 'Internal error. Please try again!!' });
    }
};
/**
   * @api {post} /dhiti/api/v1/portal_api/userViewAllResource
   * @apiVersion 1.0.0
   * @apiGroup Shikshalokam 
   * @apiParamExample {json} Request-Body:
*    {
     "data":[""]
*    }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "result": true,
*       "data": [{
               "group:"",
               "count":[]
        
        }]
*     }
   * @apiUse errorBody
   */

exports.userViewAllResource = async function (req, res) {
    try {
        let randomNumer = Math.random().toFixed(2)*100
        console.log(`\n\n\n\n`);
        console.log(`----- userViewAllResource API call start --- ${new Date()} -------------- Random No : ${randomNumer}`);
        var fileName = config.file_path[`${req.body.key}`];
        console.log(`----- Before s3 call --- ${new Date()} -------------- Random No : ${randomNumer}`);
        let contents = req.body.data;
        console.log(`-------user data-------${contents}`)
        const jsonData = await readFile.readS3File(fileName,randomNumer);
        console.log(`----- reading s3 file finished --- ${new Date()} -------------- Random No : ${randomNumer}`);
        console.log(`----- After s3 call --- ${new Date()} -------------- Random No : ${randomNumer}`);
        console.log(`----- data length of the s3 file ::: ${jsonData.length} -------------- Random No : ${randomNumer}`);        
        var jdata = []
        await jsonData.forEach(data => {
            contents.forEach(item => {
                if (data.content_name == item) {
                    jdata.push(data);
                }
            });
        });
        let groupData = groupBy(jdata, 'role_externalId');
        let objectKeys = Object.keys(groupData);
        let usersCount = []
        objectKeys.forEach(key => {
            var grouppedData = groupBy(groupData[`${key}`], 'User_FirstName');
            var userKeys = Object.keys(grouppedData);
            var cnt = 0;
            userKeys.forEach(user => {
                if (grouppedData[`${user}`].length == contents.length) {
                    cnt++;
                }
            });
            usersCount.push({ group: key, count: cnt });
        })
        console.log(`----- userViewAllResource API call end --- ${new Date()} -------------- Random No : ${randomNumer}`);
        res.send({ "result": true, "data": usersCount });
        console.log(` ------response ---------${usersCount}`)
        console.log(`----- userViewAllResource API response sent --- ${new Date()} -------------- Random No : ${randomNumer}`);
    }

    catch (e) {
        console.log(e);
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }

};
/**
   * @api {post} /dhiti/api/v1/portal_api/dailyActivityPercentagePerGroup
   * @apiVersion 1.0.0
   * @apiGroup Shikshalokam 
   * @apiParamExample {json} Request-Body:
*    {
     "data":[""]
*    }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "result": true,
*       "data": [{
               "name":"",
               "data":[]
        
        }]
*     }
   * @apiUse errorBody
   */
exports.dailyActivityPercentagePerGroup = async function (req, res) {
    try {
        let randomNumer = Math.random().toFixed(2)*100
        console.log(`\n\n\n\n`);
        console.log(`----- dailyActivityPercentagePerGroup API call start --- ${new Date()} -------------- Random No : ${randomNumer}`);
        var fileName = config.file_path[`${req.body.key}`];
        console.log(`----- Before s3 call --- ${new Date()} -------------- Random No : ${randomNumer}`);
        let list1 = req.body.data;
        console.log(list1)
        const jsonData = await readFile.readS3File(fileName,randomNumer);
        console.log(`----- reading s3 file finished --- ${new Date()} -------------- Random No : ${randomNumer}`);
        console.log(`----- After s3 call --- ${new Date()} -------------- Random No : ${randomNumer}`);
        console.log(`----- data length of the s3 file ::: ${jsonData.length} -------------- Random No : ${randomNumer}`);     
        var jdata = []
        var keys = Object.keys(jsonData[0]);
        await list1.forEach(item => {
            var listData = [];
            jsonData.forEach(data => {
                keys.forEach(key => {
                    if (item == key) {
                        listData.push(Number(data[`${key}`]));

                    }
                })
            });
            let a = {
                name: item,
                data: listData
            }
            jdata.push(a)
        })
        console.log(`----- dailyActivityPercentagePerGroup API call end --- ${new Date()} -------------- Random No : ${randomNumer}`);
        res.send({ "result": true, "data": jdata })
        console.log(`-----response --------${jdata}`)
        console.log(`----- dailyActivityPercentagePerGroup API response sent --- ${new Date()} -------------- Random No : ${randomNumer}`);
    }

    catch (e) {
        console.log(e);
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }
};
