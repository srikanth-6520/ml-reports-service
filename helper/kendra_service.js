const config = require('../config/config');
const rp = require('request-promise');
const request = require('request');

//Make API call to sl-kendra-service for getting downloadable link
async function getDownloadableUrl(evidenceList, token) {
    return new Promise(async function (resolve, reject) {
  
      let options = {
        method: "POST",
        json: true,
        headers: {
          "x-authenticated-user-token": token,
          "Content-Type": "application/json",
        },
        body: { "filePaths": evidenceList, bucketName: config.evidence.gcp_bucket_name },
        uri: config.kendra.getDownloadableUrl_api
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