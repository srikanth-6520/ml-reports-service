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

module.exports = {
  getDruidQuery: getDruidQuery
}