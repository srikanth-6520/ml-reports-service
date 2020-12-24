const aws = require('aws-sdk');
const config = require('./config.json');

var s3 = new aws.S3({ 'accessKeyId': process.env.AWS_ACCESS_KEY_ID, 'secretAccessKey': process.env.AWS_SECRET_ACCESS_KEY });

var getParams = {
    Bucket: process.env.AWS_BUCKET_NAME, //replace example bucket with your s3 bucket name
    Key: '' // replace file location with your s3 file location
};

module.exports = { "s3": s3, "getParams": getParams };