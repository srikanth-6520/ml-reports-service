const fs = require("fs-extra");
const path = require("path");
const config = require('../../../../config/config');

const migrationsDir = require("../env/migrationsDir");

function createMigrationsDirectory() {
  return fs.mkdirs(path.join(process.cwd(), process.env.MONGODB_MIGRATION_DIR));
}

module.exports = async () => {
  await migrationsDir.shouldNotExist();
  return createMigrationsDirectory();
};
