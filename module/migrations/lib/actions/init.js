const fs = require("fs-extra");
const path = require("path");
const config = require('../../../../config/config');

const migrationsDir = require("../env/migrationsDir");

function createMigrationsDirectory() {
  return fs.mkdirs(path.join(process.cwd(), config.mongodb.migration_dir));
}

module.exports = async () => {
  await migrationsDir.shouldNotExist();
  return createMigrationsDirectory();
};
