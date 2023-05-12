const druidQueries = require('./druid_queries.json');
const { ResourceType, SolutionType } = require("./constants");
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

/**
  * Return interval string for druid interval
  * @function
  * @name getDruidIntervalDate
  * @returns {String}  returns druid interval.  
*/

function getDruidIntervalDate( data ) {

  function padToTwoDigits( num ) {
    return num.toString().padStart(2, '0')
  }
  const [ date, month, year ] = data.split('-');
  const isoSring = `${year}-${padToTwoDigits(month)}-${padToTwoDigits(date)}T00:00:00+00:00`;
  return isoSring;
}

/**
  * Returns Druid Data source Name
  * @function
  * @name getDataSourceName
  * @returns {String}  returns druid data source name.  
*/
function getDataSourceName (query, body){
  let dataSource
  if(query.resourceType === ResourceType.PROGRAM){
    dataSource = process.env.PROGRAM_RESOURCE_DATASOURCE_NAME
  }else {
    switch (body.solutionType) {
      case SolutionType.PROJECT : dataSource = process.env.PROJECT_RESOURCE_DATASOURCE_NAME
        break;
      case SolutionType.OBSERVATION : dataSource = process.env.OBSERVATION_RESOURCE_DATASOURCE_NAME
        break;
      case SolutionType.SURVEY : dataSource = process.env.SURVEY_RESOURCE_DATASOURCE_NAME
        break;
    }
  }
  return dataSource
}

/**
  * Returns Druid Query Filter
  * @function
  * @name getResourceFilter
  * @returns {String}  returns druid query filter  
*/
function getResourceFilter (query) {
  const resourceFilter = {
    type: "selector",
    dimension: query.resourceType == ResourceType.SOLUTION ? "solution_id" : "program_id",
    value: query.resourceId
  }
  return resourceFilter
}

/**
  * Returns interval for druid query from previous Date to current Date
  * @function
  * @name getIntervalFilter
  * @returns {String}  returns interval filter "2023-05-11T00:00:00+00:00/2023-05-12T00:00:00+00:00"
*/
function getIntervalFilter () {
  const date = new Date()
  const currentDate = date.toLocaleDateString("default", {year: 'numeric'}) + '-' + date.toLocaleDateString("default", {month:"2-digit"}) + '-' + (date.toLocaleDateString("default", {day:"2-digit"}))
  const previousDate = date.toLocaleDateString("default", {year: 'numeric'}) + '-' + date.toLocaleDateString("default", {month:"2-digit"}) + '-' + (date.toLocaleDateString("default", {day:"2-digit"})-1)
  const interval = previousDate+"T00:00:00+00:00/"+currentDate+"T00:00:00+00:00"
  return interval
}

module.exports = {
  getDruidQuery: getDruidQuery,
  getDruidConnection: getDruidConnection,
  getGotenbergConnection: getGotenbergConnection,
  getDruidIntervalDate: getDruidIntervalDate,
  getDataSourceName: getDataSourceName,
  getResourceFilter:getResourceFilter,
  getIntervalFilter:getIntervalFilter
}
