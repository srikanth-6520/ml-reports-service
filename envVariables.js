/**
 * name : envVariables.js.
 * author : Deepa.
 * created-date : 19-June-2020.
 * Description : Required Environment variables .
 */

let table = require("cli-table");

let tableData = new table();

let enviromentVariables = {
  "APPLICATION_PORT_NUMBER" : {
    "message" : "Please specify the value for e.g. 4700",
    "optional" : false
  },
  "APPLICATION_HOST_NAME" : {
    "message" : "Required Base host",
    "optional" : false
  },
  "APPLICATION_BASE_URL" : {
    "message" : "Required Application base url",
    "optional" : false
  },
  "NODE_ENV" : {
    "message" : "Please specify the value for e.g. local/development/qa/production",
    "optional" : false
  },
  "CLOUD_STORAGE" : {
    "message" : "Required",
    "optional" : false
  },
  "BUCKET_NAME" : {
    "message" : "Required",
    "optional" : false
  },
  "DRUID_HOST" : {
    "message" : "Required",
    "optional" : false
  },
  "DRUID_PORT" : {
    "message" : "Required",
    "optional" : false
  },
  "OBSERVATION_DATASOURCE_NAME" : {
    "message" : "Required",
    "optional" : false
  },
  "OBSERVATION_EVIDENCE_DATASOURCE_NAME" : {
    "message" : "Required",
    "optional" : false
  },
  "ASSESSMENT_DATASOURCE_NAME" : {
    "message" : "Required",
    "optional" : false
  },
  "ENROLLMENT_DATASOURCE_NAME" : {
    "message" : "Required",
    "optional" : false
  },
  "TELEMETRY_DATASOURCE_NAME" : {
    "message" : "Required",
    "optional" : false
  },
  "SURVEY_DATASOURCE_NAME" : {
    "message" : "Required",
    "optional" : false
  },
  "SURVEY_EVIDENCE_DATASOURCE_NAME" : {
    "message" : "Required",
    "optional" : false
  },
  "CONTENT_REPORT_THRESHOLD" : {
    "message" : "Required",
    "optional" : false
  },
  "ENTITY_SCORE_REPORT_THRESHOLD" : {
    "message" : "Required",
    "optional" : false
  },
  "OBSERVATION_SCORE_REPORT_THRESHOLD" : {
    "message" : "Required",
    "optional" : false
  },
  "ASSESSMENT_SUBMISSION_REPORT_THRESHOLD" : {
    "message" : "Required",
    "optional" : false
  },
  "EVIDENCE_THRESHOLD" : {
    "message" : "Required",
    "optional" : false
  },
  "HIGHCHART_URL" : {
    "message" : "Required",
    "optional" : false
  },
  "GOTENBERG_URL" : {
    "message" : "Required",
    "optional" : false
  },
  "URL_PREFIX" : {
    "message" : "Required",
    "optional" : false
  },
  "ASSESSMENT_SERVICE_APPLICATION_ENDPOINT" : {
    "message" : "Required",
    "optional" : false
  },
  "ASSESSMENT_SERVICE_BASE_URL" : {
    "message" : "Required",
    "optional" : false
  },
  "KENDRA_APPLICATION_ENDPOINT" : {
    "message" : "Required",
    "optional" : false
  }, 
  "KENDRA_BASE_URL" : {
    "message" : "Required",
    "optional" : false
  },
  "AWS_ACCESS_KEY_ID" : {
    "message" : "Required",
    "optional" : true
  },
  "AWS_SECRET_ACCESS_KEY" : {
    "message" : "Required",
    "optional" : true
  },
  "AWS_REGION" : {
    "message" : "Required",
    "optional" : true
  },
  "AWS_SIGNED_URL_EXPIRE_SECONDS" : {
    "message" : "Required",
    "optional" : true
  },
  "STORE_PDF_REPORTS_IN_AWS_ON_OFF" : {
    "message" : "Enable/Disable reports storage in s3",
    "optional" : false,
    "possibleValues" : [
      "ON",
      "OFF"
    ]
  },
  "USER_NEVER_LOGGED_IN" : {
    "message" : "Required",
    "optional" : true
  },
  "UNIQUE_ACTIVE_USERS" : {
    "message" : "Required",
    "optional" : true
  },
  "TOP_SCORE_QUIZ" : {
    "message" : "Required",
    "optional" : true
  },
  "CONTENT_RATINGS" : {
    "message" : "Required",
    "optional" : true
  },
  "MAP_DATA_RESOURCES" : {
    "message" : "Required",
    "optional" : true
  },
  "LOGIN_TREND" : {
    "message" : "Required",
    "optional" : true
  },
  "LOGIN_PERCENTAGE" : {
    "message" : "Required",
    "optional" : true
  },
  "LEARNING_TOP_SCORE_QUIZ" : {
    "message" : "Required",
    "optional" : true
  },
  "PARTICIPATION_PERCENTAGE" : {
    "message" : "Required",
    "optional" : true
  },
  "LAST_UPDATED_DATE" : {
    "message" : "Required",
    "optional" : true
  },
  "DAILY_AVERAGE_GROWTH" : {
    "message" : "Required",
    "optional" : true
  },
  "COUNT_CONTENT_RATING" : {
    "message" : "Required",
    "optional" : true
  },
  "AVERAGE_TIME_SPENT" : {
    "message" : "Required",
    "optional" : true
  },
  "AVERAGE_RATING_CONTENT" : {
    "message" : "Required",
    "optional" : true
  },
  "APP_COUNT" : {
    "message" : "Required",
    "optional" : true
  },
  "ADOPTION_CONTENT" : {
    "message" : "Required",
    "optional" : true
  },
  "MULTI_RESOURCE" : {
    "message" : "Required",
    "optional" : true
  },
  "MULTI_SELECTION" : {
    "message" : "Required",
    "optional" : true
  },
  "DISABLE_ADMIN_REPORTS" : {
    "message" : "ON/OFF",
    "optional" : false,
    "default" : "OFF" 
  }
}

let success = true;

module.exports = function() {
  Object.keys(enviromentVariables).forEach(eachEnvironmentVariable=>{
  
    let tableObj = {
      [eachEnvironmentVariable] : ""
    };

    if( 
      enviromentVariables[eachEnvironmentVariable].requiredIf
      && process.env[enviromentVariables[eachEnvironmentVariable].requiredIf.key] 
      && process.env[enviromentVariables[eachEnvironmentVariable].requiredIf.key] === enviromentVariables[eachEnvironmentVariable].requiredIf.value
    ) {
      tableObj[eachEnvironmentVariable].optional = false;
    }
  
    if( 
      !(process.env[eachEnvironmentVariable]) && 
      !(enviromentVariables[eachEnvironmentVariable].optional)
    ) {
      
      success = false;

      if( 
        enviromentVariables[eachEnvironmentVariable].default &&
        enviromentVariables[eachEnvironmentVariable].default != "" 
      ) {
        process.env[eachEnvironmentVariable] = 
        enviromentVariables[eachEnvironmentVariable].default;
      }

      if(
        enviromentVariables[eachEnvironmentVariable] && 
        enviromentVariables[eachEnvironmentVariable].message !== ""
      ) {
        tableObj[eachEnvironmentVariable] = 
        enviromentVariables[eachEnvironmentVariable].message;
      } else {
        tableObj[eachEnvironmentVariable] = "required";
      }

    } else {

      tableObj[eachEnvironmentVariable] = "Passed";
      
      if( 
        enviromentVariables[eachEnvironmentVariable].possibleValues &&
        !enviromentVariables[eachEnvironmentVariable].possibleValues.includes(process.env[eachEnvironmentVariable])
      ) {
        tableObj[eachEnvironmentVariable] = ` Valid values - ${enviromentVariables[eachEnvironmentVariable].possibleValues.join(", ")}`;
      }
      
    }

    tableData.push(tableObj);
  })

  console.log(tableData.toString());

  return {
    success : success
  }
}


