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
    "optional" : false
  },
  "AWS_SECRET_ACCESS_KEY" : {
    "message" : "Required",
    "optional" : false
  },
  "AWS_BUCKET_NAME" : {
    "message" : "Required",
    "optional" : false
  },
  "STORE_PDF_REPORTS_IN_AWS_ON_OFF" : {
    "message" : "Enable/Disable reports storage in s3",
    "optional" : false,
    "possibleValues" : [
      "ON",
      "OFF"
    ]
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


