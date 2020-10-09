const aws = require('aws-sdk');
const config = require('./config.json');

var s3 = new aws.S3({ 'accessKeyId': config.s3_credentials.accessKeyId, 'secretAccessKey': config.s3_credentials.secretAccessKey });

var getParams = {
    Bucket: config.s3_bucketName, //replace example bucket with your s3 bucket name
    Key: '' // replace file location with your s3 file location
};

module.exports = { "s3": s3, "getParams": getParams };