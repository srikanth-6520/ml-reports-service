const config = require('../config/config');
const rp = require('request-promise');
const request = require('request');
const filesHelper = require("../common/files_helper");
const fs = require('fs');

//Make API call to sl-kendra-service for getting downloadable link
async function getDownloadableUrl(filePaths, token) {
    return new Promise(async function (resolve, reject) {

      let url;
      if (config.cloud_storage == filesHelper.googleCloud) {
         url = config.kendra.gcp_downloadable_file_url_api;
      }
      else if (config.cloud_storage == filesHelper.azure) {
         url = config.kendra.azure_downloadable_file_url_api;
      }
      else if (config.cloud_storage == filesHelper.aws) {
         url = config.kendra.aws_downloadable_file_url_api;
      }
      
      let options = {
        method: "POST",
        json: true,
        headers: {
          "x-authenticated-user-token": token,
          "Content-Type": "application/json",
        },
        body: { filePaths: filePaths, bucketName: config.bucket_name },
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


  //Make API call to sl-kendra-service for uploading a file
  const uploadFile = async function(file, filePath) {
    
      let fileUploadUrl;
      if (config.cloud_storage == filesHelper.googleCloud) {
        fileUploadUrl = config.kendra.gcp_upload_file_api;
      }
      else if (config.cloud_storage == filesHelper.azure) {
        fileUploadUrl = config.kendra.azure_upload_file_api;
      }
      else if (config.cloud_storage == filesHelper.aws) {
        fileUploadUrl = config.kendra.aws_upload_file_api;
      }
     
      return new Promise((resolve, reject) => {
        try {

            const kendraCallBack = function (err, response) {
                if (err) {
                    return reject({
                        status : 400,
                        message : "kendra service is down"
                    })
                } else {
                    let uploadedData = response.body;
                    return resolve(uploadedData);
                }
            }

            let formData = request.post(fileUploadUrl,{
                headers: {
                    "internal-access-token": config.internal_access_token
                }
            },kendraCallBack);

            let form = formData.form();
            form.append("filePath",filePath);
            form.append("bucketName",config.bucket_name);
            form.append("file",fs.createReadStream(file));

        } catch (error) {
            return reject(error);
        }
    });
  }
  

module.exports = {
    getDownloadableUrl : getDownloadableUrl,
    uploadFile : uploadFile
}