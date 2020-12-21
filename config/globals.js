const path = require("path");
const fs = require("fs");
gen = Object.assign(global, {});

module.exports = function () {
 
  global.PROJECT_ROOT_DIRECTORY = path.join(__dirname, '..');
  gen.utils = require(PROJECT_ROOT_DIRECTORY + "/common/utils");
  global.MODULES_BASE_PATH = PROJECT_ROOT_DIRECTORY + "/module";

  // Load database models.
  global.models = require('require-all')({
    dirname: PROJECT_ROOT_DIRECTORY + "/models",
    filter: /(.+)\.js$/,
    resolve: function (Model) {
      return Model;
    }
  });

   //load schema files
   fs.readdirSync(PROJECT_ROOT_DIRECTORY + '/models/').forEach(function (file) {
    if (file.match(/\.js$/) !== null) {
      var name = file.replace('.js', '');
      global[name + 'Schema'] = require(PROJECT_ROOT_DIRECTORY + '/models/' + file);
    }
  });

  global.controllers = require('require-all')({
    dirname: __dirname + '/../controllers',
    filter: /(.+)\.js$/,
    resolve: function (Controller) {
      if (Controller.name) return new Controller(models[Controller.name]);
      else return Controller;
      // return Controller
    }
  });

}