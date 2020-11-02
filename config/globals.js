const path = require("path");
module.exports = function () {
    global.controllers = require('require-all')({
        dirname: __dirname + '/../controllers',
        filter: /(.+)\.js$/,
        resolve: function (Controller) {
            return Controller
        }
    });
    global.PROJECT_ROOT_DIRECTORY = path.join(__dirname, '..')
}