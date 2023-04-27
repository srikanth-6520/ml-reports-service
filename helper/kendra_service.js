const rp = require('request-promise');
let urlPrefix = process.env.ML_CORE_SERVICE_URL;
const uuidv4 = require('uuid/v4');

//Make API call to ml-core-service for getting downloadable link
async function getDownloadableUrl(filePaths, token) {
  return new Promise(async function (resolve, reject) {
    
    let url = urlPrefix + endpoints.GET_DOWNLOADABLE_URL;
    console.log({ 'CoreServiceDownloadableUrl: ': url });
    
    let options = {
      method: "POST",
      json: true,
      headers: {
        "x-authenticated-user-token": token,
        "internal-access-token": process.env.INTERNAL_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: { filePaths: filePaths },
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

async function getPreSignedUrl(file) {
  return new Promise(async function (resolve, reject) {

    let url = urlPrefix + endpoints.GET_PRESIGNED_URL;
    let id = uuidv4();

    let requestBody = {
      "request": {},
      "ref": "dhiti"
    }
    requestBody.request[id] = {
      files: [file]
    };

    let options = {
      method: "POST",
      json: true,
      headers: {
        "internal-access-token": process.env.INTERNAL_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: requestBody,
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

async function getUserExtension(token){
  return new Promise(async function (resolve, reject) {
    
    let url = urlPrefix + endpoints.GET_USER_EXTENSION;
    let options = {
      method: "POST",
      json: true,
      headers: {
        "x-authenticated-user-token": token,
        "internal-access-token": process.env.INTERNAL_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: {},
      uri: url
    }

    rp(options)
      .then(result => {
        return resolve(result);
      })
      .catch(err => {
        return resolve(err);
      })
  })

}


module.exports = {
  getDownloadableUrl: getDownloadableUrl,
  getPreSignedUrl: getPreSignedUrl,
  getUserExtension:getUserExtension
}