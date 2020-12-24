const config = require('../config/config');
const rp = require('request-promise');
const request = require('request');
const filesHelper = require("../common/files_helper");

//Make API call to sl-kendra-service for getting downloadable link
async function getDownloadableUrl(evidenceList, token) {
    return new Promise(async function (resolve, reject) {

      let url;
      if (process.env.CLOUD_STORAGE == filesHelper.googleCloud) {
         url = config.kendra.gcp_downloadable_file_url_api;
      }
      else if (process.env.CLOUD_STORAGE == filesHelper.azure) {
         url = config.kendra.azure_downloadable_file_url_api;
      }
      else if (process.env.CLOUD_STORAGE == filesHelper.aws) {
         url = config.kendra.aws_downloadable_file_url_api;
      }
      
      let options = {
        method: "POST",
        json: true,
        headers: {
          "x-authenticated-user-token": token,
          "Content-Type": "application/json",
        },
        body: { filePaths: evidenceList, bucketName: process.env.BUCKET_NAME },
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