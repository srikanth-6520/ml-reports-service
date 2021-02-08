/**
 * name : gotenberg.js.
 * author : Deepa.
 * created-date : 04-Feb-2021.
 * Description : Gotenberg health check.
*/

// Dependencies 
const request = require('request');

function health_check() {
    return new Promise(async (resolve, reject) => {
        
        let druidHealthCheckUrl =  process.env.DRUID_HOST + ":" + process.env.DRUID_PORT;
        let options = {
            headers: {
                "Content-Type": "application/json"
            }
        }

        request.get(druidHealthCheckUrl, options, druidCallback);

        function druidCallback(err, data) {

            let result = false;

            if (err) {
                result = false;
            } else {
                result = true;
            }

            return resolve(result);
        }
    })
}

module.exports = {
    health_check: health_check
}