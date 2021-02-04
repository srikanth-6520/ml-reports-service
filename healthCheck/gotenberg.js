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

        let options = {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            }
        }

        request.get(process.env.GOTENBERG_URL, options, gotenbergCallback);

        function gotenbergCallback(err, data) {

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