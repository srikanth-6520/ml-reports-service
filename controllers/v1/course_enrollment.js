var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var model = require('../../db')
var helperFunc = require('../../helper/chartData');


//Controller for listing the courses enrolled by user
exports.courseEnrollment = async function (req, res) {
    if (!req.body.user_id) {
        res.status(400);
        var response = {
            result: false,
            message: 'userId is a required field',
            data: []
        }
        res.send(response);
    }
    else {
        console.log("req data", req.body.user_id);
        //get quey from cassandra
        model.MyModel.findOneAsync({ qid: "course_enrollment_query" }, { allow_filtering: true })
            .then(async function (result) {
                var bodyParam = JSON.parse(result.query);
                if (config.druid.enrollment_datasource_name) {
                    bodyParam.dataSource = config.druid.enrollment_datasource_name;
                }
                bodyParam.filter.value = req.body.user_id;
                //pass the query as body param and get the result from druid
                var options = config.druid.options;
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
            })
            .catch(function (err) {
                console.log(err);
                res.status(400);
                var response = {
                    result: false,
                    message: 'Data not found',
                    data:[]
                }
                res.send(response);
            })
    }
}
