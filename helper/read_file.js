var aws_config = require('../config/aws-config');
exports.readS3File = async function (filename, randomNumer) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`----- read file from s3 function start --- ${new Date()} -------------- Random No : ${randomNumer}`);
      aws_config['getParams']['Key'] = filename;
      aws_config['s3'].getObject(aws_config['getParams'], function (err, data) {
        if (err) {
          console.log(`----- error in reading file --- ${JSON.stringify(err)} ----- ${new Date()} -------------- Random No : ${randomNumer}`);
          reject({ errMsg: "Something went wrong" });
        } else if (!data) {
          console.log(`----- no data in the s3 file ----- ${new Date()} -------------- Random No : ${randomNumer}`);
          reject({ errMsg: "No such data found" });
        }
        else {
          console.log(`----- reading s3 file started ----- ${new Date()} -------------- Random No : ${randomNumer}`);
          resolve(JSON.parse(data.Body));
        }
      })
      console.log(`----- read file from s3 function ended --- ${new Date()} -------------- Random No : ${randomNumer}`);
    } catch (e) {
      console.log(`----- catch error ${JSON.stringify(e)} --- ${new Date()} -------------- Random No : ${randomNumer}`);
      reject(e);
    }
  });
}