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
    uri: process.env.GOTENBERG_URL + "/convert/html",
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
  * Return aws connection credentials
  * @function
  * @name getAWSConnection
  * @returns {Array}  returns aws connection.  
*/

/**
  * Returns file path of given fileName
  * @function
  * @name getPortalReportsFilePaths
  * @returns {Array}  returns file path of given fileName.  
*/

function getPortalReportsFilePaths(fileName) {

  let file_path = {
    userNeverLoggedIn: process.env.USER_NEVER_LOGGED_IN,
    uniqueActiveUsers: process.env.UNIQUE_ACTIVE_USERS,
    topScoreQuiz: process.env.TOP_SCORE_QUIZ,
    topFiveContentRatings: process.env.CONTENT_RATINGS,
    mapDataResources: process.env.MAP_DATA_RESOURCES,
    loginTrend: process.env.LOGIN_TREND,
    loginPercentage: process.env.LOGIN_PERCENTAGE,
    learningTopscoreQuiz: process.env.LEARNING_TOP_SCORE_QUIZ,
    participationPercentage: process.env.PARTICIPATION_PERCENTAGE,
    lastUpdatedDate: process.env.LAST_UPDATED_DATE,
    dailyAverageGrowth: process.env.DAILY_AVERAGE_GROWTH,
    countContentRating: process.env.COUNT_CONTENT_RATING,
    averageTimeSpent: process.env.AVERAGE_TIME_SPENT,
    averageRatingContent: process.env.AVERAGE_RATING_CONTENT,
    appCount: process.env.APP_COUNT,
    adoptionContent: process.env.ADOPTION_CONTENT,
    multiResource: process.env.MULTI_RESOURCE,
    multiSelection: process.env.MULTI_SELECTION
  }

  return file_path[fileName];
}


module.exports = {
  getDruidQuery: getDruidQuery,
  getDruidConnection: getDruidConnection,
  getGotenbergConnection: getGotenbergConnection,
  getPortalReportsFilePaths: getPortalReportsFilePaths
}