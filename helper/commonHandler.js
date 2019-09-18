var config = require('../config/config.json');
const AWS = require('aws-sdk')
const s3 = new AWS.S3(config.s3_credentials);
const myBucket = config.s3_bucketName;

// const signedUrlExpireSeconds=config.s3_signed_url_expire_seconds;




exports.getSignedUrl = async function getSignedUrl(filePath) {

    return new Promise(function (resolve, reject) {
        let myKey = filePath;
        let url = s3.getSignedUrl('getObject', {
            Bucket: myBucket,
            Key: myKey,
            Expires: config.s3_signed_url_expire_seconds
        })
        
        // console.log("url",url)
        return resolve(url);

    });

}

