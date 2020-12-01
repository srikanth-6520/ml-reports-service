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
        var arrayData = req.body.key;
        var a = {}
        for(let item = 0; item < arrayData.length; item++) {
            
               var fileName = config.file_path[arrayData[`${item}`]];
               var result = await readFile.readS3File(fileName);   
               a[[arrayData[`${item}`]]]={"result":true,"data":result}
            
         }
        res.send(a)
    }
    catch (e) {
        console.log(e);
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
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
        var fileName = config.file_path[`${req.body.key}`];
        let contents = req.body.data;
        const jsonData = await readFile.readS3File(fileName);      
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
        res.send({ "result": true, "data": usersCount });
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
        var fileName = config.file_path[`${req.body.key}`];
        let list1 = req.body.data;
        const jsonData = await readFile.readS3File(fileName);   
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
        res.send({ "result": true, "data": jdata })
    }

    catch (e) {
        console.log(e);
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }
};
