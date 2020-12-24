const config = require('../config/config');
const rp = require('request-promise');
const request = require('request');
const filesHelper = require("../common/files_helper");
let urlPrefix = process.env.KENDRA_APPLICATION_ENDPOINT + process.env.KENDRA_BASE_URL + process.env.URL_PREFIX; 

//Make API call to sl-kendra-service for getting downloadable link
async function getDownloadableUrl(evidenceList, token) {
    return new Promise(async function (resolve, reject) {

      let url;
      if (process.env.CLOUD_STORAGE == filesHelper.googleCloud) {
         url = urlPrefix + endpoints.GCP_GET_DOWNLOADABLE_URL;
      }
      else if (process.env.CLOUD_STORAGE == filesHelper.azure) {
         url = urlPrefix + endpoints.AZURE_GET_DOWNLOADABLE_URL;
      }
      else if (process.env.CLOUD_STORAGE == filesHelper.aws) {
         url = urlPrefix + endpoints.AWS_GET_DOWNLOADABLE_URL;
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