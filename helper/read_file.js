var aws_config = require('../config/aws-config');
exports.readS3File = async function (filename) {
  return new Promise((resolve, reject) => {
    try {
      aws_config['getParams']['Key'] = filename;
      aws_config['s3'].getObject(aws_config['getParams'], function (err, data) {
        if (err) {
          reject({ errMsg: "Something went wrong" });
        } else if (!data) {
          reject({ errMsg: "No such data found" });
        }
        else {
          resolve(JSON.parse(data.Body));
        }
      })
    } catch (e) {
      reject(e);
    }
  });
}