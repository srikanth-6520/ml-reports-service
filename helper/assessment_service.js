const config = require('../config/config');
const rp = require('request-promise');
const request = require('request');

//Function to get user profile
async function getUserProfile(createdBy,token){
  
    return new Promise(async function(resolve,reject){
  
      let options = {
        method: "GET",
        json: true,
        headers: {
          "x-authenticated-user-token": token,
          "Content-Type": "application/json",
        },
        uri: config.samiksha_api.get_user_profile_api + "/" + createdBy
      }
  
      rp(options)
        .then(result => {
          return resolve(result);
        })
        .catch(err => {
          return reject(err);
        })
  
    });
}

//function to make a call to samiksha assessment entities list API
async function getEntityList(entityId, childType, token) {

  return new Promise(async function (resolve) {
      let options = {
          method: "GET",
          json: true,
          headers: {
              "Content-Type": "application/json",
              "X-authenticated-user-token": token
          },
          uri: config.samiksha_api.assessment_entity_list_api + entityId + "?type=" + childType
      }

      rp(options).then(function (resp) {
          return resolve(resp);

      }).catch(function (err) {
          return resolve(err);
      })

  });
}


//function to make a call to samiksha assessment entities list API
async function getSurveySubmissionStatusById(submissionId,token) {

  return new Promise(async function (resolve) {
      let options = {
          method: "GET",
          json: true,
          headers: {
              "Content-Type": "application/json",
              "X-authenticated-user-token": token
          },
          uri: config.samiksha_api.get_survey_submission_status_api + "/" + submissionId
      }

      rp(options).then(function (resp) {
          return resolve(resp);

      }).catch(function (err) {
          return resolve(err);
      })

  });
}

//function to make a call to samiksha assessment entities list API
async function getObservationSubmissionStatusById(submissionId,token) {

  return new Promise(async function (resolve) {
      let options = {
          method: "GET",
          json: true,
          headers: {
              "Content-Type": "application/json",
              "X-authenticated-user-token": token
          },
          uri: config.samiksha_api.get_observation_submission_status_api + "/" + submissionId
      }

      rp(options).then(function (resp) {
          return resolve(resp);

      }).catch(function (err) {
          return resolve(err);
      })

  });
}

module.exports = {
    getUserProfile : getUserProfile,
    getEntityList : getEntityList,
    getSurveySubmissionStatusById: getSurveySubmissionStatusById,
    getObservationSubmissionStatusById: getObservationSubmissionStatusById
}