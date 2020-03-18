define({ "api": [
  {
    "type": "get",
    "url": "/dhiti/v1/shikshalokam/contentView",
    "title": "",
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
    "filename": "controllers/v1/content_view.js",
    "group": "/home/deepa/nodejs_reference_code/sl-dhiti-service/controllers/v1/content_view.js",
    "groupTitle": "/home/deepa/nodejs_reference_code/sl-dhiti-service/controllers/v1/content_view.js",
    "name": "GetDhitiV1ShikshalokamContentview",
    "success": {
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
    "title": "",
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
    "filename": "controllers/v1/content_view.js",
    "group": "/home/deepa/nodejs_reference_code/sl-dhiti-service/controllers/v1/content_view.js",
    "groupTitle": "/home/deepa/nodejs_reference_code/sl-dhiti-service/controllers/v1/content_view.js",
    "name": "GetDhitiV1ShikshalokamUsagebycontent",
    "success": {
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
    "title": "",
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
    "parameter": {
      "examples": [
        {
          "title": "Request-Body:",
          "content": "{\n  \"usr_id\": \"\",\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/content_view.js",
    "group": "/home/deepa/nodejs_reference_code/sl-dhiti-service/controllers/v1/content_view.js",
    "groupTitle": "/home/deepa/nodejs_reference_code/sl-dhiti-service/controllers/v1/content_view.js",
    "name": "PostDhitiV1ShikshalokamContentdownloadedbyuser",
    "success": {
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
    "url": "/dhiti/api/v1/assessments/entity",
    "title": "",
    "version": "1.0.0",
    "group": "assessments",
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
          "content": "{\n  \"entityId\": \"\",\n\"entityType\": \"\"\n\"progarmId\": \"\"\n\"solutionId\": \"\"\n\"immediateChildEntityType\": \"\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/entity_assessments.js",
    "groupTitle": "assessments",
    "name": "PostDhitiApiV1AssessmentsEntity",
    "success": {
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
    "title": "",
    "version": "1.0.0",
    "group": "assessments",
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
          "content": "{\n  \"entityId\": \"\",\n\"entityType\":\"\"\n\"immediateChildType\":\"\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/list_assessment_programs.js",
    "groupTitle": "assessments",
    "name": "PostDhitiApiV1AssessmentsListprograms",
    "success": {
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
    "title": "",
    "version": "1.0.0",
    "group": "observation",
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
          "content": "{\n  \"entityId\": \"\",\n\"observationId\": \"\",\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/entity_observations.js",
    "groupTitle": "observation",
    "name": "PostDhitiApiV1ObservationsEntity",
    "success": {
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
    "title": "",
    "version": "1.0.0",
    "group": "observation",
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
    "filename": "controllers/v1/instance_observation.js",
    "groupTitle": "observation",
    "name": "PostDhitiApiV1ObservationsInstance",
    "success": {
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
    "title": "",
    "version": "1.0.0",
    "group": "observation",
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
    "filename": "controllers/v1/instance_observation.js",
    "groupTitle": "observation",
    "name": "PostDhitiApiV1ObservationsInstanceobservationscorereport",
    "success": {
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
    "title": "",
    "version": "1.0.0",
    "group": "observation",
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
    "filename": "controllers/v1/list_observation_names.js",
    "groupTitle": "observation",
    "name": "PostDhitiApiV1ObservationsListobservationnames",
    "success": {
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
    "title": "",
    "version": "1.0.0",
    "group": "observation",
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
          "content": "{\n  \"entityId\": \"\",\n\"entityType\": \"\",\n}",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/v1/list_observation_solutions.js",
    "groupTitle": "observation",
    "name": "PostDhitiApiV1ObservationsListobservationsolutions",
    "success": {
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
    "title": "",
    "version": "1.0.0",
    "group": "observation",
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
    "filename": "controllers/v1/observation_controller.js",
    "groupTitle": "observation",
    "name": "PostDhitiApiV1ObservationsReport",
    "success": {
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
    "title": "",
    "version": "1.0.0",
    "group": "observation",
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
    "filename": "controllers/v1/observation_controller.js",
    "groupTitle": "observation",
    "name": "PostDhitiApiV1ObservationsScorereport",
    "success": {
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
    "title": "",
    "version": "1.0.0",
    "group": "observation",
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
    "filename": "controllers/v1/observation_submissions.js",
    "groupTitle": "observation",
    "name": "PostDhitiApiV1ObservationsSubmissionscount",
    "success": {
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
    "title": "",
    "version": "1.0.0",
    "group": "shikshalokam",
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
    "filename": "controllers/v1/course_enrollment.js",
    "groupTitle": "shikshalokam",
    "name": "PostDhitiV1ShikshalokamCourseenrollment",
    "success": {
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
