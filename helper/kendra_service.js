const config = require('../config/config');
const rp = require('request-promise');
const request = require('request');
const filesHelper = require("../common/files_helper");

//Make API call to sl-kendra-service for getting downloadable link
async function getDownloadableUrl(evidenceList, token) {
    return new Promise(async function (resolve, reject) {

      let url;
      if (config.cloud_storage == filesHelper.googleCloud) {
         url = config.kendra.gcp_getDownloadableUrl_api;
      }
      else if (config.cloud_storage == filesHelper.azure) {
         url = config.kendra.azure_getDownloadableUrl_api;
      }
      else if (config.cloud_storage == filesHelper.aws) {
         url = config.kendra.aws_getDownloadableUrl_api;
      }
      
      let options = {
        method: "POST",
        json: true,
        headers: {
          "x-authenticated-user-token": token,
          "Content-Type": "application/json",
        },
        body: { filePaths: evidenceList, bucketName: config.bucket_name },
        uri: url
      }
  
      rp(options)
        .then(result => {
          return resolve(result);
        })
        .catch(err => {
          return reject(err);
        })
    })
  }
  

module.exports = {
    getDownloadableUrl : getDownloadableUrl
}