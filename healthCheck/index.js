/**
 * name : index.js.
 * author : Deepa.
 * created-date : 04-Feb-2021.
 * Description : Health check Root file.
*/

let healthCheckService = require("./healthCheckService");

module.exports = function (app) {
    app.get("/healthCheckStatus",healthCheckService.healthCheckStatus);
    app.get("/health",healthCheckService.health_check);
}