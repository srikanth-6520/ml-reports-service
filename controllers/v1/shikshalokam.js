var rp = require('request-promise');
var request = require('request');
var model = require('../../db')
var helperFunc = require('../../helper/chart_data');
const default_content_api_threshold = 10;

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
   * @api {get} /dhiti/v1/shikshalokam/contentView
   * Content view
   * @apiVersion 1.0.0
   * @apiHeader {String} x-auth-token Authenticity token 
   * @apiGroup Shikshalokam 
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "result": true,
*       "data": [{
        "content_name": "",
        "total_views": ""
        }]
*     }
   * @apiUse errorBody
   */

//Controller for listing Top 5 contents viewed in platform
exports.contentView = async function (req, res) {

    try {

    //get quey from cassandra
    // model.MyModel.findOneAsync({ qid: "content_viewed_in_platform_query" }, { allow_filtering: true })
    //     .then(async function (result) {

    //         var bodyParam = JSON.parse(result.query);

            let bodyParam = gen.utils.getDruidQuery("content_viewed_in_platform_query");

            if (process.env.TELEMETRY_DATASOURCE_NAME) {
                bodyParam.dataSource = process.env.TELEMETRY_DATASOURCE_NAME;
            }

            // get previous month date and append to intervals field
            bodyParam.intervals = await getIntervals();

            let threshold = process.env.CONTENT_REPORT_THRESHOLD ? process.env.CONTENT_REPORT_THRESHOLD : default_content_api_threshold

            if(typeof threshold !== "number"){
                throw new Error("threshold_in_content_api should be integer");
            }

            //Assign threshold value to restrict number of records to be shown
            bodyParam.threshold = threshold;

            //pass the query as body param and get the result from druid
            var options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;
            var data = await rp(options);

            if (data[0].result.length == 0) {
                res.send({ "result": false, "data": [] })
            }
            else {
                var responseObj = await helperFunc.contentViewResponeObj(data[0].result);
                res.send(responseObj);
            }
        // })
        }
        catch(err) {
            res.status(400);
            let response = {
                result: false,
                message: 'Data not found',
                data: []
            }
            res.send(response);
        }
}


/**
   * @api {post} /dhiti/v1/shikshalokam/contentDownloadedByUser
   * Content downloaded by user
   * @apiVersion 1.0.0
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiGroup Shikshalokam 
   * @apiParamExample {json} Request-Body:
* {
  "usr_id": "",
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "result": true,
*       "data": [{
        "content_name": "",
        "total_downloads": ""
        }]
*     }
   * @apiUse errorBody
   */

//Controller for listing Top 5 contents Downloaded by user in platform
exports.contentDownloadedByUser = async function (req, res) {

    try {

    if (!req.body.usr_id) {
        res.status(400);
        var response = {
            result: false,
            message: 'usr_id is a required field',
            data: []
        }
        res.send(response);
    }
    else {
        //get quey from cassandra
        // model.MyModel.findOneAsync({ qid: "content_downloaded_by_user_query" }, { allow_filtering: true })
        //     .then(async function (result) {

        //         var bodyParam = JSON.parse(result.query);
               let bodyParam = gen.utils.getDruidQuery("content_downloaded_by_user_query");

                if (process.env.TELEMETRY_DATASOURCE_NAME) {
                    bodyParam.dataSource = process.env.TELEMETRY_DATASOURCE_NAME;
                }

                //append user id to the filter
                 bodyParam.filter.fields[0].value = req.body.usr_id;

                 // get previous month date and append to intervals field
                 bodyParam.intervals = await getIntervals();

                 let threshold = process.env.CONTENT_REPORT_THRESHOLD ? process.env.CONTENT_REPORT_THRESHOLD : default_content_api_threshold;

                 if(typeof threshold !== "number"){
                     throw new Error("threshold_in_content_api should be integer");
                 }

                //Assign threshold value to restrict number of records to be shown
                bodyParam.threshold = threshold;

                //pass the query as body param and get the result from druid
                var options = gen.utils.getDruidConnection();
                options.method = "POST";
                options.body = bodyParam;
                var data = await rp(options);

                if (data[0].result.length == 0) {
                    res.send({ "result": false, "data": [] })
                }
                else {
                    var responseObj = await helperFunc.contentDownloadResponeObj(data[0].result);
                    res.send(responseObj);
                }
            // })
               }
            }
            catch(err) {
                res.status(400);
                let response = {
                    result: false,
                    message: 'Data not found',
                    data: []
                }
                res.send(response);
            }
}


/**
   * @api {get} /dhiti/v1/shikshalokam/usageByContent
   * Usage by content
   * @apiVersion 1.0.0
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiGroup Shikshalokam 
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "result": true,
*       "data": [{
        "content_name": "",
        "total_users_viewed": ""
        }]
*     }
   * @apiUse errorBody
   */

exports.usageByContent = async function (req, res) {

    try {

    //get quey from cassandra
    // model.MyModel.findOneAsync({ qid: "usage_by_content_query" }, { allow_filtering: true })
    //     .then(async function (result) {

    //         var bodyParam = JSON.parse(result.query);
            let bodyParam = gen.utils.getDruidQuery("usage_by_content_query");

            if (process.env.TELEMETRY_DATASOURCE_NAME) {
                bodyParam.dataSource = process.env.TELEMETRY_DATASOURCE_NAME;
            }
            
            let threshold = process.env.CONTENT_REPORT_THRESHOLD ? process.env.CONTENT_REPORT_THRESHOLD : default_content_api_threshold;

            if(typeof threshold !== "number"){
                throw new Error("threshold_in_content_api should be integer");
            }

            //Assign threshold value to restrict number of records to be shown
            bodyParam.threshold = threshold;

             // get previous month date and append to intervals field
             bodyParam.intervals = await getIntervals();

            //pass the query as body param and get the result from druid
            var options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;
            var data = await rp(options);

            if (data[0].result.length == 0) {
                res.send({ "result": false, "data": [] })
            }
            else {
                var responseObj = await helperFunc.usageByContentResponeObj(data[0].result);
                res.send(responseObj);
            }
        // })
        }
        catch(err) {
            res.status(400);
            let response = {
                result: false,
                message: 'Data not found',
                data: []
            }
            res.send(response);
        }

}


/**
   * @api {post} /dhiti/v1/shikshalokam/courseEnrollment
   * Course enrollment
   * @apiVersion 1.0.0
   * @apiGroup Shikshalokam
   * @apiHeader {String} x-auth-token Authenticity token  
   * @apiParamExample {json} Request-Body:
* {
  "user_id": "",
* }
   * @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "result": true,
*       "data": [{
        "course_name": "",
        "status": ""
        }]
*     }
   * @apiUse errorBody
   */

//Controller for listing the courses enrolled by user
exports.courseEnrollment = async function (req, res) {

    try {

    if (!req.body.user_id) {
        res.status(400);
        var response = {
            result: false,
            message: 'user_id is a required field',
            data: []
        }
        res.send(response);
    }
    else {

        //get quey from cassandra
        // model.MyModel.findOneAsync({ qid: "course_enrollment_query" }, { allow_filtering: true })
        //     .then(async function (result) {

        //         var bodyParam = JSON.parse(result.query);
               let bodyParam = gen.utils.getDruidQuery("course_enrollment_query");

                if (process.env.ENROLLMENT_DATASOURCE_NAME) {
                    bodyParam.dataSource = process.env.ENROLLMENT_DATASOURCE_NAME;
                }

                bodyParam.filter.value = req.body.user_id;
                bodyParam.intervals = await getIntervals();
                
                //pass the query as body param and get the result from druid
                var options = gen.utils.getDruidConnection();
                options.method = "POST";
                options.body = bodyParam;
                var data = await rp(options);

                if (!data.length) {
                    res.send({ "result":false,"data": []})
                }
                else {

                  //call the function to get response object
                   var responseObj = await helperFunc.courseEnrollmentResponeObj(data);
                   res.send(responseObj);
                }
            // })
               }
            }
            catch(err) {
                res.status(400);
                let response = {
                    result: false,
                    message: 'Data not found',
                    data:[]
                }
                res.send(response);
            }
    
}



async function getIntervals() {
    var now = new Date();
    var prevMonthLastDate = new Date(now.getFullYear(), now.getMonth(), 0);
    var prevMonthFirstDate = new Date(now.getFullYear() - (now.getMonth() > 0 ? 0 : 1), (now.getMonth() - 1 + 12) % 12, 1);

    var formatDateComponent = function (dateComponent) {
        return (dateComponent < 10 ? '0' : '') + dateComponent;
    };

    var formatDate = function (date) {
        return date.getFullYear() + '-' + formatDateComponent(date.getMonth() + 1) + '-' + formatDateComponent(date.getDate()) + 'T00:00:00+00:00';
    };

   var intervals = formatDate(prevMonthFirstDate) + '/' + formatDate(prevMonthLastDate);

   return intervals;

}    
