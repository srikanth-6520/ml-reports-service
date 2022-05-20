const druidQueries = require('./druid_queries.json');

/**
  * Return druid query for the given query name
  * @function
  * @name getDruidQuery
  * @returns {Array}  returns druid query.  
*/

function getDruidQuery(name) {
  let query = {};

  if (druidQueries[name]) {
    query = JSON.parse(JSON.stringify(druidQueries[name]));
  }

  return query;
}

/**
  * Return druid connection string
  * @function
  * @name getDruidConnection
  * @returns {Array}  returns druid connection.  
*/

function getDruidConnection() {

  let options = {
    method: "",
    json: true,
    body: "",
    headers: {
      "Content-Type": "application/json"
    },
    url: process.env.DRUID_URL + "/druid/v2/?pretty"
  }

  return options;
}

/**
  * Return Gotenberg service connection string
  * @function
  * @name getGotenbergConnection
  * @returns {Array}  returns gotenberg server connection.  
*/

function getGotenbergConnection() {

  let options = {
    method: "POST",
    uri: process.env.GOTENBERG_URL + "/forms/chromium/convert/html",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    resolveWithFullResponse: true,
    encoding: null,
    json: true,
    formData: ""
  }

  return options;
}


module.exports = {
  getDruidQuery: getDruidQuery,
  getDruidConnection: getDruidConnection,
  getGotenbergConnection: getGotenbergConnection
}
