const path = require("path");
gen = Object.assign(global, {});

module.exports = function () {
    global.controllers = require('require-all')({
        dirname: __dirname + '/../controllers',
        filter: /(.+)\.js$/,
        resolve: function (Controller) {
            return Controller
        }
    });
    global.PROJECT_ROOT_DIRECTORY = path.join(__dirname, '..')

    global.ROOT_PATH = path.join(__dirname, '..');
    gen.utils = require(ROOT_PATH + "/common/utils");
}