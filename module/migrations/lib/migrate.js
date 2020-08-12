const init = require(__dirname +"/./actions/init");
const create = require(__dirname +"/./actions/create");
const up = require(__dirname + "/./actions/up");/
const down = require(__dirname + "/./actions/down");
const status = require(__dirname + "/./actions/status");
const database = require(__dirname + "/./env/database");
require('dotenv').config()

module.exports = {
  init,
  create,
  up,
  down,
  status,
  database
};
