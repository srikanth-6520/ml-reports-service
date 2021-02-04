/**
 * name : highChart.js.
 * author : Deepa.
 * created-date : 04-Feb-2021.
 * Description : Highchart health check.
*/

// Dependencies 
const request = require('request');

function health_check() {
    return new Promise(async (resolve, reject) => {

        let options = {
            headers: {
                "Content-Type": "application/json"
            }
        }

        request.get(process.env.HIGHCHART_URL, options, highchartCallback);

        function highchartCallback(err, data) {

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