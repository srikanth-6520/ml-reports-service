const readFile = require('../v1/portal_reports/read_file')
const files = require('./portal_reports/filePaths');
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
   * @api {post} /dhiti/api/v1/mantra4changeApi/genericApi
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
        var fileName = files[`${req.body.key}`];
        var result = await readFile.readS3File(fileName);
        res.send({ "result": true, "data": result })
    }
    catch (e) {
        console.log(e);
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }

};
/**
   * @api {post} /dhiti/api/v1/mantra4changeApi/percentageVariance
   * @apiVersion 1.0.0
   * @apiGroup Shikshalokam 
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "result": true,
*       "data": [{
               "variance":[]
        
        }]
*     }
   * @apiUse errorBody
   */
exports.percentageVariance = async function (req, res) {
    try {
        var difference = [];
        var data1 = req.body.data.data1;
        var data2 = req.body.data.data2;
        for (let i = 0; i < data1.length; i++) {
            var mydiff = parseFloat(((data2[i] - data1[i]) * 100 / data1[i]).toFixed(2));
            difference.push(mydiff);
        }
        res.status(200).json({ 'result': true, 'data': difference });
    } catch (e) {
        console.log(e);
        res.status(500).json({ errMessage: 'Internal error. Please try again!!' });
    }
};
/**
   * @api {post} /dhiti/api/v1/mantra4changeApi/multiResource
   * @apiVersion 1.0.0
   * @apiGroup Shikshalokam 
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

exports.multiResource = async function (req, res) {
    try {
        var fileName = files[`${req.body.key}`];
        let resources = req.body.data;
        const jsonData = await readFile.readS3File(fileName);
        var jdata = []
        await jsonData.forEach(data => {
            resources.forEach(item => {
                if (data.content_name == item) {
                    jdata.push(data);
                }
            });
        });
        let groupData = groupBy(jdata, 'role_externalId');
        let myKeys = Object.keys(groupData);
        let usersCount = []
        myKeys.forEach(key => {
            var grouppedData = groupBy(groupData[`${key}`], 'User_FirstName');
            var userKeys = Object.keys(grouppedData);
            var cnt = 0;
            userKeys.forEach(user => {
                if (grouppedData[`${user}`].length == resources.length) {
                    cnt++;
                }
            });
            usersCount.push({ group: key, count: cnt });
        })
        res.send({ "result": true, "data": usersCount })
    }

    catch (e) {
        console.log(e);
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }

};
/**
   * @api {post} /dhiti/api/v1/mantra4changeApi/multiSelection
   * @apiVersion 1.0.0
   * @apiGroup Shikshalokam 
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
exports.multiSelection = async function (req, res) {
    try {
        var fileName = files[`${req.body.key}`];
        let list1 = req.body.data;
        const jsonData = await readFile.readS3File(fileName);
        var jdata = []
        var keys = Object.keys(jsonData[0]);
        await list1.forEach(item => {
            var mydata = [];
            jsonData.forEach(data => {
                keys.forEach(key => {
                    if (item == key) {
                        mydata.push(Number(data[`${key}`]));

                    }
                })
            });
            let a = {
                name: item,
                data: mydata
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
