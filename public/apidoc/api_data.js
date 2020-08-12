define({ "api": [
  {
    "type": "post",
    "url": "/dhiti/api/v1/assessments/entity",
    "title": "Entity assessment",
    "version": "1.0.0",
    "group": "Assessments",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n\"entityId\": \"\",\n\"entityType\": \"\"\n\"progarmId\": \"\"\n\"solutionId\": \"\"\n\"immediateChildEntityType\": \"\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": " HTTP/1.1 200 OK\n {\n   \"result\": true,\n   \"title\": \"\",\n   \"reportSections\":[\n     {\n       \"order\": \"\",\n       \"chart\": {\n          \"type\": \"\",\n          \"nextChildEntityType\": \"\",\n          \"stacking\": \"\",\n          \"title\": \"\",\n          \"xAxis\": {\n            \"categories\": [],\n            \"title\": \"\",\n          },\n          \"yAxis\": {\n             \"title\": {\n                 \"text\": \"\"\n             }\n          },\n          \"data\": [{\n              \"name\": \"\",\n              \"data\": []\n          }]\n       }\n     },\n     {\n      \"order\": \"\",\n      \"chart\": {\n         \"type\": \"\",\n         \"title\": \"\",\n         \"entities\": [{\n             \"entityName\": \"\",\n             \"entityId\": \"\",\n             \"domains\": [{\n                 \"domainName\": \"\",\n                 \"domainId\": \"\",\n                 \"criterias\":[{\n                     \"name\": \"\",\n                     \"level\": \"\"\n                 }]\n             }]\n         }]\n      }\n     }\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/assessments.js",
    "groupTitle": "Assessments",
    "name": "PostDhitiApiV1AssessmentsEntity",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/assessments/entityReport",
    "title": "entity level assessment report",
    "version": "1.0.0",
    "group": "Assessments",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n\"entityId\": \"\",\n\"entityType\": \"\",\n\"programId\": \"\",\n\"solutionId\": \"\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "    HTTP/1.1 200 OK\n  {\n    \"result\": true,\n    \"programName\": \"\",\n    \"solutionName\": \"\",\n    \"reportSections\": [{\n        \"order\": 1,\n        \"chart\": {\n        \"type\": \"bar\",\n        \"title\": \"\",\n        \"xAxis\": [\n            {\n                \"categories\": []\n            },\n            {\n                \"opposite\": true,\n                \"reversed\": false,\n                \"categories\": [],\n                \"linkedTo\": 0\n            }\n        ],\n        \"yAxis\": {\n            \"min\": 0,\n            \"title\": {\n                \"text\": \"\"\n            }\n        },\n        \"legend\": {\n            \"reversed\": true\n        },\n        \"plotOptions\": {\n            \"series\": {\n                \"stacking\": \"percent\"\n            }\n        },\n        \"data\": [\n            {\n                \"name\": \"Level 1\",\n                \"data\": []\n            }\n        ]\n      }\n    },\n    {\n       \"order\": 2,\n       \"chart\": {\n            \"type\": \"expansion\",\n            \"title\": \"Descriptive view\",\n            \"heading\": [\"Assess. 1\",\"Assess. 2\"],\n            \"domains\": [{\n                \"domainName\": \"\",\n                \"criterias\": [{\n                   \"criteriaName\": \"\",\n                   \"levels\": []\n                }]\n            }]\n        }\n    }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/assessments.js",
    "groupTitle": "Assessments",
    "name": "PostDhitiApiV1AssessmentsEntityreport",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/assessments/listAssessmentPrograms",
    "title": "List assessment programs",
    "version": "1.0.0",
    "group": "Assessments",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "  HTTP/1.1 200 OK\n  {\n\"result\" : true,\n\"data\" : [{\n \"programName\": \"\",\n      \"programId\": \"\",\n }]\n  }",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/assessments.js",
    "groupTitle": "Assessments",
    "name": "PostDhitiApiV1AssessmentsListassessmentprograms",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/assessments/listEntities",
    "title": "List entities",
    "version": "1.0.0",
    "group": "Assessments",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n\"programId\" : \"\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "  HTTP/1.1 200 OK\n  {\n\"result\" : true,\n\"data\" : [{\n \"entityId\": \"\",\n      \"entityName\": \"\",\n      \"entityType\": \"\",\n      \"solutions\": [{\n          \"solutionId\" : \"\",\n          \"solutionName\" : \"\"\n      }]\n }]\n  }",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/assessments.js",
    "groupTitle": "Assessments",
    "name": "PostDhitiApiV1AssessmentsListentities",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/assessments/listImprovementProjects",
    "title": "List improvement programs",
    "version": "1.0.0",
    "group": "Assessments",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n\"entityId\": \"\",\n\"entityType\":\"\",\n\"programId\": \"\",\n\"solutionId\": \"\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"result\" : true,\n   \"data\" : [{\n       \"criteriaName\" : \"\",\n       \"level\" : \"\",\n       \"improvementProjects\" : [{\n           \"projectName\" : \"\",\n           \"projectId\" : \"\",\n           \"projectGoal\": \"\",\n           \"projectExternalId\": \"\"\n       }]\n   }] \n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/assessments.js",
    "groupTitle": "Assessments",
    "name": "PostDhitiApiV1AssessmentsListimprovementprojects",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/assessments/listPrograms",
    "title": "List assessment programs",
    "version": "1.0.0",
    "group": "Assessments",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n\"entityId\": \"\",\n\"entityType\":\"\"\n\"immediateChildType\":\"\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"programName\": \"\",\n    \"programId\": \"\",\n    \"programDescription\": \"\",\n    \"programExternalId\": \"\",\n    \"solutions\": [{\n      \"solutionName\": \"\",\n      \"solutionId\": \"\",\n      \"solutionDescription\": \"\",\n      \"solutionExternalId\": \"\"\n    }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/assessments.js",
    "groupTitle": "Assessments",
    "name": "PostDhitiApiV1AssessmentsListprograms",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/entity",
    "title": "Entity observation report",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"entityId\": \"\",\n  \"observationId\": \"\",\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"observationId\": \"\",\n   \"observationName\": \"\",\n   \"entityType\": \"\",\n   \"entityId\": \"\",\n   \"entityName\": \"\",\n   \"response\": [{\n      \"order\": \"\",\n      \"question\": \"\",\n      \"responseType\": \"\",\n      \"answers\": \"\",\n      \"chart\": {},\n      \"instanceQuestions\": [],\n      \"evidences\":[\n          {\"url\":\"\", \"extension\":\"\"}\n      ]\n   }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsEntity",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/entityObservationReport",
    "title": "Entity observation report(cluster/zone/district/state)",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"entityId\": \"\",\n  \"entityType\": \"\",\n  \"immediateChildEntityType\": \"\",\n  \"observationId\": \"\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"solutionId\": \"\",\n   \"solutionName\": \"\",\n   \"entityType\": \"\",\n   \"entityId\": \"\",\n   \"entityName\": \"\",\n   \"response\": [{\n      \"order\": \"\",\n      \"question\": \"\",\n      \"responseType\": \"\",\n      \"answers\": \"\",\n      \"chart\": {},\n      \"instanceQuestions\": []\n   }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsEntityobservationreport",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/entityReportByCriteria",
    "title": "Entity report by criteria",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"entityId\": \"\",\n  \"observationId\": \"\",\n  \"entityType\": \"\",\n  \"filter\": {\n     \"criteria\": []\n  }\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"observationId\": \"\",\n   \"observationName\": \"\",\n   \"entityType\": \"\",\n   \"entityId\": \"\",\n   \"entityName\": \"\",\n   \"response\": [{\n      \"criteriaName\": \"\",\n      \"criteriaId\": \"\",\n      \"questionArray\": [{\n          \"order\": \"\",\n          \"question\": \"\",\n          \"responseType\": \"\",\n          \"answers\": \"\",\n          \"chart\": {},\n          \"instanceQuestions\": [],\n          \"evidences\":[\n              {\"url\":\"\", \"extension\":\"\"}\n          ]\n        }]  \n    }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsEntityreportbycriteria",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/entityScoreReport",
    "title": "Entity observation score report",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"entityId\": \"\",\n  \"observationId\": \"\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"result\": true,\n   \"schoolName\": \"\",\n   \"totalObservations\": \"\",\n   \"observationName\": \"\",\n   \"response\" : [{\n      \"order\": \"\",\n      \"question\": \"\",\n      \"chart\": {\n        \"type\": \"scatter\",\n        \"title\": \"\",\n        \"xAxis\": {\n            \"title\": {\n                \"enabled\": true,\n                \"text\": \"observations\"\n            },\n            \"labels\": {},\n            \"categories\": [\"Obs1\", \"Obs2\", \"Obs3\", \"Obs4\", \"Obs5\"],\n            \"startOnTick\": false,\n            \"endOnTick\": false,\n            \"showLastLabel\": true\n        },\n        \"yAxis\": {\n            \"min\": 0,\n            \"max\": \"\",\n            \"allowDecimals\": false,\n            \"title\": {\n                \"text\": \"Score\"\n            }\n        },\n        \"plotOptions\":{\n            \"scatter\":{\n                \"lineWidth\": 1,\n                \"lineColor\": \"#F6B343\"\n            }\n        },\n        \"credits\": {\n            \"enabled\": false\n        },\n        \"legend\": {\n            \"enabled\": false\n        },\n        \"data\": [{\n            \"color\": \"#F6B343\",\n            \"data\": []\n        }]\n\n      }\n    }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsEntityscorereport",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/entityScoreReportByCriteria",
    "title": "Entity score report by criteria",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"entityId\": \"\",\n  \"observationId\": \"\",\n  \"filter\":{\n     \"criteria\": []\n  }\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"result\": true,\n   \"schoolName\": \"\",\n   \"totalObservations\": \"\",\n   \"observationName\": \"\",\n   \"response\" : [{\n      \"criteriaName\": \"\",\n      \"criteriaId\": \"\",\n      \"questionArray\": [{\n          \"order\": \"\",\n          \"question\": \"\",\n          \"chart\": {\n              \"type\": \"scatter\",\n              \"title\": \"\",\n              \"xAxis\": {\n                 \"title\": {\n                 \"enabled\": true,\n                 \"text\": \"observations\"\n                },\n                 \"labels\": {},\n                 \"categories\": [\"Obs1\", \"Obs2\", \"Obs3\", \"Obs4\", \"Obs5\"],\n                 \"startOnTick\": false,\n                 \"endOnTick\": false,\n                 \"showLastLabel\": true\n              },\n              \"yAxis\": {\n                 \"min\": 0,\n                 \"max\": \"\",\n                 \"allowDecimals\": false,\n                 \"title\": {\n                    \"text\": \"Score\"\n                 }\n              },\n              \"plotOptions\":{\n                 \"scatter\":{\n                 \"lineWidth\": 1,\n                 \"lineColor\": \"#F6B343\"\n                 }\n              },\n              \"credits\": {\n                 \"enabled\": false\n              },\n              \"legend\": {\n                 \"enabled\": false\n              },\n              \"data\": [{\n                \"color\": \"#F6B343\",\n                \"data\": []\n              }]\n          }\n        }]\n    }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsEntityscorereportbycriteria",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/entitySolutionReport",
    "title": "Entity solution report",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"entityId\": \"\",\n  \"entityType\": \"\",\n  \"immediateChildEntityType\": \"\",\n  \"solutionId\": \"\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"solutionId\": \"\",\n   \"solutionName\": \"\",\n   \"entityType\": \"\",\n   \"entityId\": \"\",\n   \"entityName\": \"\",\n   \"response\": [{\n      \"order\": \"\",\n      \"question\": \"\",\n      \"responseType\": \"\",\n      \"answers\": \"\",\n      \"chart\": {},\n      \"instanceQuestions\": []\n   }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsEntitysolutionreport",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/entitySolutionScoreReport",
    "title": "Entity solution score report",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"entityId\": \"\",\n  \"entityType\": \"\",\n  \"solutionId\": \"\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"result\": true,\n   \"solutionName\": \"\",\n   \"response\": [{\n     \"order\": \"\",\n     \"question\": \"\",\n     \"chart\": {\n        \"type\": \"bar\",\n        \"title\": \"\",\n        \"xAxis\": {\n            \"title\": {\n                \"text\": null\n            },\n            \"labels\": {},\n            \"categories\": []\n        },\n        \"yAxis\": {\n            \"min\": 0,\n            \"max\": \"\",\n            \"title\": {\n                \"text\": \"Score\"\n            },\n            \"labels\": {\n                \"overflow\": \"justify\"\n            },\n            \"allowDecimals\" : false\n        },\n        \"plotOptions\": {\n            \"bar\": {\n                \"dataLabels\": {\n                    \"enabled\": true\n                }\n            }\n        },\n        \"legend\": {\n           \"enabled\" : true\n        },\n        \"credits\": {\n            \"enabled\": false\n        },\n        \"data\": [{\n            \"name\": \"observation1\",\n            \"data\": []\n        }, {\n            \"name\": \"observation2\",\n            \"data\": []\n        }]\n\n      }\n    }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsEntitysolutionscorereport",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/instance",
    "title": "Instance observation report",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"submissionId\": \"\",\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"entityName\": \"\",\n   \"observationName\": \"\",\n   \"observationId\": \"\",\n   \"entityType\": \"\",\n   \"entityId\": \"\",\n   \"response\": [{\n     \"order\": \"\",\n     \"question\": \"\",\n     \"responseType\": \"\",\n     \"answers\": [],\n     \"chart\": {},\n     \"instanceQuestions\":[],\n     \"evidences\":[\n          {\"url\":\"\", \"extension\":\"\"}\n      ]\n   }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsInstance",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/instanceObservationScoreReport",
    "title": "Instance observation score report",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"submissionId\": \"\",\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"result\": true,\n   \"totalScore\": \"\",\n   \"scoreAchieved\": \"\",\n   \"observationName\": \"\",\n   \"response\": [{\n      \"order\": \"\",\n      \"question\": \"\",\n      \"chart\": {\n        \"type\": \"\",\n        \"credits\": {\n            \"enabled\": false\n        },\n        \"plotOptions\": {\n            \"pie\": {\n                \"allowPointSelect\": true,\n                \"cursor\": \"pointer\",\n                \"dataLabels\": {\n                    \"enabled\": false\n                },\n                \"showInLegend\": true,\n                \"borderColor\": \"#000000\"\n            }\n        },\n        \"data\": [{\n            \"data\": [{\n                \"name\": \"\",\n                \"y\": \"\",\n                \"color\": \"#6c4fa1\"\n            },{\n                \"name\": \"\",\n                \"y\": \"\",\n                \"color\": \"#fff\"\n            }]\n        }]\n      },\n      \"evidences\":[\n          {\"url\":\"\", \"extension\":\"\"}\n      ]\n    }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsInstanceobservationscorereport",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/instanceScoreReportByCriteria",
    "title": "Instance score report by criteria",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"submissionId\": \"\",\n  \"filter\": {\n     \"criteria\": []\n  }\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"result\": true,\n   \"totalScore\": \"\",\n   \"scoreAchieved\": \"\",\n   \"observationName\": \"\",\n   \"response\": [{\n      \"criteriaName\": \"\",\n      \"criteriaId\": \"\",\n      \"questionArray\": [{\n          \"order\": \"\",\n          \"question\": \"\",\n          \"chart\": {\n             \"type\": \"\",\n             \"credits\": {\n                \"enabled\": false\n              },\n             \"plotOptions\": {\n                \"pie\": {\n                   \"allowPointSelect\": true,\n                   \"cursor\": \"pointer\",\n                   \"dataLabels\": {\n                      \"enabled\": false\n                    },\n                \"showInLegend\": true,\n                \"borderColor\": \"#000000\"\n              }\n            },\n            \"data\": [{\n              \"data\": [{\n                \"name\": \"\",\n                \"y\": \"\",\n                \"color\": \"#6c4fa1\"\n            },{\n                \"name\": \"\",\n                \"y\": \"\",\n                \"color\": \"#fff\"\n              }]\n            }]\n          },\n          \"evidences\":[\n             {\"url\":\"\", \"extension\":\"\"},\n          ]\n      }]\n    }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsInstancescorereportbycriteria",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/listAllEvidences",
    "title": "List all evidence",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"submissionId\": \"\",\n  \"entityId\": \"\",\n  \"observationId\": \"\",\n  \"questionId\": \"\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"result\": true,\n   \"data\": [{\n      \"images\":[{\"url\":\"\", \"extension\":\"\"}],\n      \"videos\":[{\"url\":\"\", \"extension\":\"\"}],\n      \"documents\":[{\"url\":\"\", \"extension\":\"\"}],\n      \"remarks\":[]\n    }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsListallevidences",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/listObservationNames",
    "title": "List observation names",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"entityId\": \"\",\n  \"entityType\":\"\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"result\": true,\n   \"data\": [{\n      \"observationId\": \"\",\n      \"observationName\": \"\"\n   }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsListobservationnames",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/listObservationSolutions",
    "title": "List observation solutions",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"entityId\": \"\",\n  \"entityType\": \"\",\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"result\": true,\n   \"data\": [{\n      \"solutionId\": \"\",\n      \"solutionName\": \"\",\n      \"scoring\": \"\"\n   }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsListobservationsolutions",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/observationReportByCriteria",
    "title": "Observation report by criteria",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"observationId\": \"\",\n  \"filter\":{\n     \"criteria\": []\n  }\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"observationId\": \"\",\n   \"observationName\": \"\",\n   \"entityType\": \"\",\n   \"entityId\": \"\",\n   \"entityName\": \"\",\n   \"response\": [{\n      \"criteriaName\": \"\",\n      \"criteriaId\": \"\",\n      \"questionArray\":[{\n         \"order\": \"\",\n         \"question\": \"\",\n         \"responseType\": \"\",\n         \"answers\": \"\",\n         \"chart\": {},\n         \"instanceQuestions\": [],\n         \"evidences\":[\n            {\"url\":\"\", \"extension\":\"\"},\n        ]\n      }]\n   }]\n}",
          "type": "json"
        }
      ],
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>200</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "result",
            "description": "<p>Data</p>"
          }
        ]
      }
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsObservationreportbycriteria",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/observationScoreReportByCriteria",
    "title": "Observation score report by criteria",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"observationId\": \"\",\n  \"filter\":{\n      \"criteria\": []\n  }\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"result\": true,\n   \"solutionName\": \"\",\n   \"response\": [{\n     \"criteriaName\": \"\",\n     \"criteriaId\": \"\",\n     \"questionArray\": [{\n        \"order\": \"\",\n        \"question\": \"\",\n        \"chart\": {\n           \"type\": \"bar\",\n           \"title\": \"\",\n           \"xAxis\": {\n              \"title\": {\n                 \"text\": null\n              },\n              \"labels\": {},\n              \"categories\": []\n            },\n            \"yAxis\": {\n               \"min\": 0,\n               \"max\": \"\",\n               \"title\": {\n                 \"text\": \"Score\"\n                },\n               \"labels\": {\n                  \"overflow\": \"justify\"\n                },\n               \"allowDecimals\" : false\n            },\n            \"plotOptions\": {\n              \"bar\": {\n                \"dataLabels\": {\n                    \"enabled\": true\n                }\n              } \n            },\n            \"legend\": {\n              \"enabled\" : true\n            },\n            \"credits\": {\n              \"enabled\": false\n            },\n            \"data\": [{\n              \"name\": \"observation1\",\n              \"data\": []\n            }, {\n              \"name\": \"observation2\",\n              \"data\": []\n            }]\n        },\n        \"evidences\":[\n          {\"url\":\"\", \"extension\":\"\"}\n        ]\n      }]\n    }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsObservationscorereportbycriteria",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/report",
    "title": "Observation report",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"observationId\": \"\",\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"observationId\": \"\",\n   \"observationName\": \"\",\n   \"entityType\": \"\",\n   \"entityId\": \"\",\n   \"entityName\": \"\",\n   \"response\": [{\n      \"order\": \"\",\n      \"question\": \"\",\n      \"responseType\": \"\",\n      \"answers\": \"\",\n      \"chart\": {},\n      \"instanceQuestions\": [],\n      \"evidences\":[\n          {\"url\":\"\", \"extension\":\"\"}\n      ]\n   }]\n}",
          "type": "json"
        }
      ],
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>200</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "result",
            "description": "<p>Data</p>"
          }
        ]
      }
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsReport",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/scoreReport",
    "title": "Observation score report",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"observationId\": \"\",\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"result\": true,\n   \"solutionName\": \"\",\n   \"response\": [{\n     \"order\": \"\",\n     \"question\": \"\",\n     \"chart\": {\n        \"type\": \"bar\",\n        \"title\": \"\",\n        \"xAxis\": {\n            \"title\": {\n                \"text\": null\n            },\n            \"labels\": {},\n            \"categories\": []\n        },\n        \"yAxis\": {\n            \"min\": 0,\n            \"max\": \"\",\n            \"title\": {\n                \"text\": \"Score\"\n            },\n            \"labels\": {\n                \"overflow\": \"justify\"\n            },\n            \"allowDecimals\" : false\n        },\n        \"plotOptions\": {\n            \"bar\": {\n                \"dataLabels\": {\n                    \"enabled\": true\n                }\n            }\n        },\n        \"legend\": {\n           \"enabled\" : true\n        },\n        \"credits\": {\n            \"enabled\": false\n        },\n        \"data\": [{\n            \"name\": \"observation1\",\n            \"data\": []\n        }, {\n            \"name\": \"observation2\",\n            \"data\": []\n        }]\n    },\n    \"evidences\":[\n        {\"url\":\"\", \"extension\":\"\"}\n    ]\n  }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsScorereport",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/submissionsCount",
    "title": "Observations submission count",
    "version": "1.0.0",
    "group": "Observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"submissionId\": \"\",\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"result\": true,\n   \"data\": {\n     \"noOfSubmissions\": \"\"\n   }\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "Observations",
    "name": "PostDhitiApiV1ObservationsSubmissionscount",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/programs/list",
    "title": "Programs List",
    "version": "1.0.0",
    "group": "Programs",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"entityId\": \"\",\n  \"entityType\": \"\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"result\": true,\n   \"data\": [\n       {\n           \"programId\": \"\",\n           \"programName\": \"\",\n           \"type\": \"\"\n       }\n   ]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/programs.js",
    "groupTitle": "Programs",
    "name": "PostDhitiApiV1ProgramsList",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "get",
    "url": "/dhiti/v1/shikshalokam/contentView",
    "title": "Content view",
    "version": "1.0.0",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "group": "Shikshalokam",
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"result\": true,\n  \"data\": [{\n    \"content_name\": \"\",\n    \"total_views\": \"\"\n    }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/shikshalokam.js",
    "groupTitle": "Shikshalokam",
    "name": "GetDhitiV1ShikshalokamContentview",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "get",
    "url": "/dhiti/v1/shikshalokam/usageByContent",
    "title": "Usage by content",
    "version": "1.0.0",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "group": "Shikshalokam",
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"result\": true,\n  \"data\": [{\n    \"content_name\": \"\",\n    \"total_users_viewed\": \"\"\n    }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/shikshalokam.js",
    "groupTitle": "Shikshalokam",
    "name": "GetDhitiV1ShikshalokamUsagebycontent",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/v1/shikshalokam/contentDownloadedByUser",
    "title": "Content downloaded by user",
    "version": "1.0.0",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "group": "Shikshalokam",
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"usr_id\": \"\",\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"result\": true,\n  \"data\": [{\n    \"content_name\": \"\",\n    \"total_downloads\": \"\"\n    }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/shikshalokam.js",
    "groupTitle": "Shikshalokam",
    "name": "PostDhitiV1ShikshalokamContentdownloadedbyuser",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/v1/shikshalokam/courseEnrollment",
    "title": "Course enrollment",
    "version": "1.0.0",
    "group": "Shikshalokam",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"user_id\": \"\",\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"result\": true,\n  \"data\": [{\n    \"course_name\": \"\",\n    \"status\": \"\"\n    }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/shikshalokam.js",
    "groupTitle": "Shikshalokam",
    "name": "PostDhitiV1ShikshalokamCourseenrollment",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/solutions/list",
    "title": "Solutions List",
    "version": "1.0.0",
    "group": "Solutions",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"entityId\": \"\",\n  \"entityType\": \"\",\n  \"programId\": \"\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"result\": true,\n   \"data\": {\n       \"mySolutions\": [{\n           \"solutionId\": \"\",\n           \"solutionName\": \"\",\n           \"type\": \"\",\n           \"scoring\": \"\",\n           \"id\": \"\"\n       }],\n       \"allSolutions\": [{\n           \"solutionId\": \"\",\n           \"solutionName\": \"\",\n           \"type\": \"\",\n           \"scoring\": \"\",\n           \"id\": \"\"\n       }]\n   }\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/solutions.js",
    "groupTitle": "Solutions",
    "name": "PostDhitiApiV1SolutionsList",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/unnati/addTaskReport",
    "title": "Add task report",
    "version": "1.0.0",
    "group": "Unnati",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n   \"projectName\": \"\",\n   \"goal\": \"\",\n   \"duration\": \"\",\n   \"startDate\": \"\",\n   \"assigneeName\": \"\",\n   \"tasks\": {\n      \"title\": \"\",\n      \"endDate\": \"\",\n      \"attachments\": [\n         {\n           \"name\": \"\"\n         }\n      ]\n   }\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"status\": \"\",\n   \"message\": \"\",\n   \"pdfUrl\": \"\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/unnati.js",
    "groupTitle": "Unnati",
    "name": "PostDhitiApiV1UnnatiAddtaskreport",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/unnati/monthlyReport",
    "title": "Monthly report",
    "version": "1.0.0",
    "group": "Unnati",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n    \"schoolName\": \"\",\n    \"reportType\": \"\",\n    \"projectDetails\": \"\",\n    \"title\":\"\",\n    \"tasks\": []\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"status\": \"\",\n   \"message\": \"\",\n   \"pdfUrl\": \"\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/unnati.js",
    "groupTitle": "Unnati",
    "name": "PostDhitiApiV1UnnatiMonthlyreport",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/unnati/pdfReport",
    "title": "Project pdf report",
    "version": "1.0.0",
    "group": "Unnati",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n    \"title\": \"\",\n    \"goal\": \"\",\n    \"duration\": \"\",\n    \"status\":\"\",\n    \"startDate\":\"\",\n    \"endDate\":\"\",\n    \"category\":[],\n    \"tasks\": []\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"status\": \"\",\n   \"message\": \"\",\n   \"pdfUrl\": \"\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/unnati.js",
    "groupTitle": "Unnati",
    "name": "PostDhitiApiV1UnnatiPdfreport",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/unnati/viewProjectReport",
    "title": "View project report",
    "version": "1.0.0",
    "group": "Unnati",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n   \"schoolName\": \"\",\n   \"reportType\": \"\",\n   \"projectDetails\": []\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"status\": \"\",\n   \"message\": \"\",\n   \"pdfUrl\": \"\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/unnati.js",
    "groupTitle": "Unnati",
    "name": "PostDhitiApiV1UnnatiViewprojectreport",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/dhiti/api/v1/observations/instanceReportByCriteria",
    "title": "Instance report by criteria",
    "version": "1.0.0",
    "group": "observations",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authenticity token</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"submissionId\": \"\",\n  \"filter\": {\n    \"criteria\" : []\n  }\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"entityName\": \"\",\n   \"observationName\": \"\",\n   \"observationId\": \"\",\n   \"entityType\": \"\",\n   \"entityId\": \"\",\n   \"response\": [{\n     \"criteriaName\": \"\",\n     \"criteriaId\": \"\",\n     \"questionArray\": [{\n        \"order\": \"\",\n        \"question\": \"\",\n        \"responseType\": \"\",\n        \"answers\": [],\n        \"chart\": {},\n        \"instanceQuestions\":[],\n        \"evidences\":[\n          {\"url\":\"\", \"extension\":\"\"},\n        ]\n     }]\n     \n   }]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/observations.js",
    "groupTitle": "observations",
    "name": "PostDhitiApiV1ObservationsInstancereportbycriteria",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>4XX,5XX</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Error</p>"
          }
        ]
      }
    }
  }
] });
