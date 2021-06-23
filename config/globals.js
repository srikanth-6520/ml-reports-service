const path = require("path");
gen = Object.assign(global, {});
var bunyan = require("bunyan"),
  bunyanFormat = require('bunyan-format'),
  formatOut = bunyanFormat({ outputMode: 'short' });
var fs = require('fs');


module.exports = function () {

    global.ROOT_PATH = path.join(__dirname, '..');
    gen.utils = require(ROOT_PATH + "/common/utils");
    global.endpoints = require(ROOT_PATH + "/common/endpoints");
    
    global.controllers = require('require-all')({
        dirname: __dirname + '/../controllers',
        filter: /(.+)\.js$/,
        resolve: function (Controller) {
            return Controller
        }
    });

    let logDir = ROOT_PATH + "/logs";
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir)
    }

    let loggerPath = ROOT_PATH + "/logs/" + process.pid + "-all.log";
    // Load logger file

    global.logger = bunyan.createLogger({
      name: 'information',
      level: "debug",
      streams: [{
        stream: formatOut
      }, {
        type: "rotating-file",
        path: loggerPath,
        period: "1d", // daily rotation
        count: 3 // keep 3 back copies
      }]
    });
}