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


//Function to get user profile
async function getImprovemtProjects(submissionId,token){
  
  return new Promise(async function(resolve,reject){

    let options = {
      method: "GET",
      json: true,
      headers: {
        "x-authenticated-user-token": token,
        "Content-Type": "application/json",
      },
      uri: config.samiksha_api.improvement_project_list_api + "/" +  submissionId
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


module.exports = {
    getUserProfile : getUserProfile,
    getImprovemtProjects : getImprovemtProjects 
}