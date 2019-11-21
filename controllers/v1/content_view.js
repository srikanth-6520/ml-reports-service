var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var model = require('../../db')
var helperFunc = require('../../helper/chart_data');

//Controller for listing Top 5 contents viewed in platform
exports.contentView = async function (req, res) {
    //get quey from cassandra
    model.MyModel.findOneAsync({ qid: "content_viewed_in_platform_query" }, { allow_filtering: true })
        .then(async function (result) {
            var bodyParam = JSON.parse(result.query);
            if (config.druid.telemetry_datasource_name) {
                bodyParam.dataSource = config.druid.telemetry_datasource_name;
            }
            // get previous month date and append to intervals field
            bodyParam.intervals = await getIntervals();
            //Assign threshold value to restrict number of records to be shown
            bodyParam.threshold = config.druid.threshold_in_content_api;
            //pass the query as body param and get the result from druid
            var options = config.druid.options;
            options.method = "POST";
            options.body = bodyParam;
            var data = await rp(options);
            if (data[0].result.length == 0) {
                res.send({ "result": false, "data": [] })
            }
            else {
                res.send({ "result": true, "data": data[0].result });
            }
        })
        .catch(function (err) {
            console.log(err);
            res.status(400);
            var response = {
                result: false,
                message: 'Data not found',
                data: []
            }
            res.send(response);
        })

}


//Controller for listing Top 5 contents Downloaded by user in platform
exports.contentDownloadedByUser = async function (req, res) {
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
        model.MyModel.findOneAsync({ qid: "content_downloaded_by_user_query" }, { allow_filtering: true })
            .then(async function (result) {
                var bodyParam = JSON.parse(result.query);
                if (config.druid.telemetry_datasource_name) {
                    bodyParam.dataSource = config.druid.telemetry_datasource_name;
                }
                //append user id to the filter
                 bodyParam.filter.fields[0].value = req.body.usr_id;
                 // get previous month date and append to intervals field
                 bodyParam.intervals = await getIntervals();
                //Assign threshold value to restrict number of records to be shown
                bodyParam.threshold = config.druid.threshold_in_content_api;
                //pass the query as body param and get the result from druid
                var options = config.druid.options;
                options.method = "POST";
                options.body = bodyParam;
                var data = await rp(options);
                if (data[0].result.length == 0) {
                    res.send({ "result": false, "data": [] })
                }
                else {
                    res.send({ "result": true, "data": data[0].result });
                }
            })
            .catch(function (err) {
                console.log(err);
                res.status(400);
                var response = {
                    result: false,
                    message: 'Data not found',
                    data: []
                }
                res.send(response);
            })

    }
}



// Controller for listing usage by content 
exports.usageByContent = async function (req, res) {
    //get quey from cassandra
    model.MyModel.findOneAsync({ qid: "usage_by_content_query" }, { allow_filtering: true })
        .then(async function (result) {
            var bodyParam = JSON.parse(result.query);
            if (config.druid.telemetry_datasource_name) {
                bodyParam.dataSource = config.druid.telemetry_datasource_name;
            }
            
            //Assign threshold value to restrict number of records to be shown
            bodyParam.threshold = config.druid.threshold_in_content_api
             // get previous month date and append to intervals field
             bodyParam.intervals = await getIntervals();
            //pass the query as body param and get the result from druid
            var options = config.druid.options;
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
        })
        .catch(function (err) {
            console.log(err);
            res.status(400);
            var response = {
                result: false,
                message: 'Data not found',
                data: []
            }
            res.send(response);
        })

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