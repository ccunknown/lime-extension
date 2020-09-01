'use strict';

var Defaults = {
  "extension": {
    "name": "lime",
    "version": "0.1.0"
  },
  "config": {
    "service": {
      //  Port Service
      "sysport-service": {
        "path": "sysport-service/sysport-service.js",
        "enable": true,
        "status": "unknow",
        "description": "Port resource controller, provide port to engine."
      },
      //  Engine Service
      "engines-service": {
        "path": "/engines-service/engines-service.js",
        "enable": true,
        "status": "unknow",
        "description": "Engine is a solution to provide data from port to script."
      },
      //  Script Service
      "scripts-service": {
        "path": "/scripts-service/scripts-service.js",
        "enable": true,
        "status": "unknow",
        "description": "Controller of scripts of slave serial devices, used to translatation for devices-service."
      },
      //  Device Service
      "devices-service": {
        "path": "/devices-service/devices-service.js",
        "enable": true,
        "status": "unknow",
        "description": "A combination of script and engine to define what was device should be."
      }
    },
    "service-config": {
      //  Port Service
      "sysport-service": {
        "list": {}
      },
      //  Engine Service
      "engines-service": {
        "directory": "/engines",
        "list": {}
      },
      //  Script Service
      "scripts-service": {
        "directory": "/scripts",
        "list": {}
      },
      //  Device Service
      "devices-service": {
        "directory": "/devices",
        "list": {}
      }
    }
  },
  "schema": {
    "type": "object",
    "required": ["service"],
    "additionalProperties": false,
    "properties": {
      "service": {
        "type": "object",
        "additionalProperties": false,
        "patternProperties": {
          "^.+-service$": {
            "type": "object",
            "required": ["path", "enable"],
            "additionalProperties": false,
            "properties": {
              "path": {
                "type": "string"
              },
              "enable": {
                "type": "boolean"
              },
              "status": {
                "type": "string"
              },
              "description": {
                "type": "string"
              }
            }
          }
        }
      },
      "service-config": {
        "type": "object",
        "required": [
          "sysport-service",
          "engines-service",
          "scripts-service",
          "devices-service"
        ],
        "additionalProperties": false,
        "properties": {
          //  Port Service
          "sysport-service": {
            "type": "object",
            "required": ["list"],
            "additionalProperties": false,
            "properties": {
              "list": {
                "type": "object",
                "default": {},
                "additionalProperties": false,
                "patternProperties": {
                  ".+": {
                    "type": "object"
                  }
                }
              }
            }
          },
          //  Engine Service
          "engines-service": {
            "type": "object",
            "required": ["directory", "list"],
            "additionalProperties": false,
            "properties": {
              "directory": {
                "type": "string"
              },
              "list": {
                "type": "object",
                "default": {},
                "additionalProperties": false,
                "patternProperties": {
                  ".+": {
                    "type": "object",
                    // "required": ["name", "engine", "port"],
                    // "additionalProperties": false,
                    // "properties": {
                    //   "name": {
                    //     "type": "string"
                    //   },
                    //   "engine": {
                    //     "type": "string"
                    //   },
                    //   "port": {
                    //     "type": "string"
                    //   }
                    // }
                  }
                }
              }
            }
          },
          //  Script Service
          "scripts-service": {
            "type": "object",
            "required": ["directory"],
            "additionalProperties": false,
            "properties": {
              "directory": {
                "type": "string"
              },
              "list": {
                "type": "object",
                "default": {},
                "additionalProperties": false,
                "patternProperties": {
                  ".+": {
                    "$id": "#fileStructurObject",
                    "type": "object",
                    "required": ["name", "type", "meta", "children"],
                    "additionalProperties": false,
                    "properties": {
                      "name": {
                        "type": "string"
                      },
                      "type": {
                        "type": "string",
                        "default": "directory",
                        "enum": ["directory", "file"]
                      },
                      "meta": {
                        "type": "object",
                        "required": [],
                        "additionalProperties": false,
                        "properties": {
                          "title": {
                            "type": "string"
                          },
                          "description": {
                            "type": "string"
                          },
                          "tags": {
                            "type": "array",
                            "default": [],
                            "items": {
                              "type": "string"
                            }
                          }
                        }
                      },
                      "children": {
                        "type": "array",
                        "default": [],
                        "items": {
                          "${ref}": "#fileStructurObject",
                          "required": ["name", "type"]
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          //  Device Service
          "devices-service": {
            "type": "object",
            "required": ["directory", "list"],
            "additionalProperties": false,
            "properties": {
              "directory": {
                "type": "string"
              },
              "list": {
                "type": "object",
                "default": {},
                "additionalProperties": false,
                "patternProperties": {
                  ".+": {
                    "type": "object",
                    "required": ["name", "description", "template", "properties"],
                    "additionalProperties": true,
                    "properties": {
                      "name": {
                        "type": "string"
                      },
                      "description": {
                        "type": "string"
                      },
                      "template": {
                        "type": "string"
                      },
                      "properties": {
                        "type": "object",
                        "default": {}
                      }
                    }
                  }
                  // ".+": {
                  //   "type": "object",
                  //   "required": ["id", "name", "type", "@context", "@type", "config", "properties"],
                  //   "additionalProperties": false,
                  //   "properties": {
                  //     "id": {
                  //       "type": "string"
                  //     },
                  //     "name": {
                  //       "type": "string"
                  //     },
                  //     "type": {
                  //       "type": "array",
                  //       "default": [],
                  //       "items": {
                  //         "type": "string"
                  //       }
                  //     },
                  //     "description": {
                  //       "type": "string"
                  //     },
                  //     "@context": {
                  //       "type": "string"
                  //     },
                  //     "@type": {
                  //       "type": "array",
                  //       "items": {
                  //         "type": "string"
                  //       }
                  //     },
                  //     "config": {
                  //       "type": "object",
                  //       "required": ["engine", "script"],
                  //       "additionalProperties": true,
                  //       "properties": {
                  //         "device": {
                  //           "type": "string"
                  //         }
                  //       }
                  //     },
                  //     "properties": {
                  //       "type": "object",
                  //       "patternProperties": {
                  //         "^.+$": {
                  //           "type": "object",
                  //           "required": ["name", "type", "value", "readOnly", "config"],
                  //           "additionalProperties": false,
                  //           "properties": {
                  //             "name": {
                  //               "type": "string"
                  //             },
                  //             "label": {
                  //               "type": "string"
                  //             },
                  //             "title": {
                  //               "type": "string"
                  //             },
                  //             "type": {
                  //               "type": "string",
                  //               "enum": ["string", "number", "boolean"]
                  //             },
                  //             "value": {
                  //               "type": ["string", null, "number", "boolean"]
                  //             },
                  //             "unit": {
                  //               "type": "string"
                  //             },
                  //             "readOnly": {
                  //               "type": "boolean"
                  //             },
                  //             "config": {
                  //               "type": "object"
                  //             }
                  //           }
                  //         }
                  //       }
                  //     }
                  //   }
                  // }
                }
              }
            }
          }
        }
      }
    }
  }
};

module.exports = Defaults;