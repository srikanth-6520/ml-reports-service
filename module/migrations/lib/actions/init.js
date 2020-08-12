const fs = require("fs-extra");
const path = require("path");
//const config = require(__dirname + '/../../../../config/config');

const migrationsDir = require("../env/migrationsDir");

function createMigrationsDirectory() {
  return fs.mkdirs(path.join(process.cwd(), process.env.migration_dir));
}

module.exports = async () => {
  await migrationsDir.shouldNotExist();
  return createMigrationsDirectory();
};
