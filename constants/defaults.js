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
        "list": [
          {
            "name": "modbus-01",
            "path": "/dev/ttyUSB0",
            "config": {
              "baudRate": 9600,
              "databits": 8,
              "parity": 'none',
              "stopbits": 1,
              "flowControl": false,
              "autoOpen": false
            }
          }
        ]
      },
      //  Engine Service
      "engines-service": {
        "directory": "/engines",
        "list": [
          {
            "name": "modbus-engine-001",
            "engine": "modbus-rtu",
            "port": "modbus-01"
          }
        ]
      },
      //  Script Service
      "scripts-service": {
        "directory": "/scripts",
        "list": []
      },
      //  Device Service
      "devices-service": {
        "directory": "/devices",
        "list": [
          {
            "id": "device-002",
            "name": "SDM120CT Power Meter",
            "type": ["modbus-device"],
            "description": "Power meter install at room 519 on Pakawat's table on DIN rail together with another devices including Raspberry Pi which is install Mozilla-iot Gateway.",
            "@context": `https://iot.mozilla.org/schemas`,
            "@type": [`EnergyMonitor`],
            "config": {
              "device": "modbus-rtu",
              "script": "sdm120ct",
              "engine": "modbus-engine-001",
              "address": 11
            },
            "properties": {
              "voltage": {
                "name": "voltage",
                "label": "Voltage",
                "title": "Voltage",
                "type": "number",
                "value": 0,
                "unit": "V",
                "readOnly": true,
                "config": {
                  "property": "default-property",
                  "address": 0x0000,
                  "table": "inputRegisters",
                  "period": 5000
                }
              },
              "current": {
                "name": "current",
                "label": "Current",
                "title": "Current",
                "type": "number",
                "value": 0,
                "unit": "A",
                "readOnly": true,
                "config": {
                  "property": "default-property",
                  "address": 0x0006,
                  "table": "inputRegisters",
                  "period": 5000
                }
              },
              "iae": {
                "name": "iae",
                "label": "Import Active Energy",
                "title": "Import Active Energy",
                "type": "number",
                "value": 0,
                "unit": "kWh",
                "readOnly": true,
                "config": {
                  "property": "default-property",
                  "address": 0x0048,
                  "table": "inputRegisters",
                  "period": 10000
                }
              }
            }
          },
          {
            "id": "device-003",
            "name": "SDM120CT Power Meter",
            "type": ["modbus-device"],
            "description": "Power meter install at room 519 on Pakawat's table on DIN rail together with another devices including Raspberry Pi which is install Mozilla-iot Gateway.",
            "@context": `https://iot.mozilla.org/schemas`,
            "@type": [`EnergyMonitor`],
            "config": {
              "device": "modbus-rtu",
              "script": "sdm120ct",
              "engine": "modbus-engine-001",
              "address": 12
            },
            "properties": {
              "voltage": {
                "name": "voltage",
                "label": "Voltage",
                "title": "Voltage",
                "type": "number",
                "value": 0,
                "unit": "V",
                "readOnly": true,
                "config": {
                  "property": "default-property",
                  "address": 0x0000,
                  "table": "inputRegisters",
                  "period": 5000
                }
              },
              "current": {
                "name": "current",
                "label": "Current",
                "title": "Current",
                "type": "number",
                "value": 0,
                "unit": "A",
                "readOnly": true,
                "config": {
                  "property": "default-property",
                  "address": 0x0006,
                  "table": "inputRegisters",
                  "period": 5000
                }
              },
              "iae": {
                "name": "iae",
                "label": "Import Active Energy",
                "title": "Import Active Energy",
                "type": "number",
                "value": 0,
                "unit": "kWh",
                "readOnly": true,
                "config": {
                  "property": "default-property",
                  "address": 0x0048,
                  "table": "inputRegisters",
                  "period": 10000
                }
              }
            }
          }
        ]
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
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["name", "path", "config"],
                  "additionalProperties": false,
                  "properties": {
                    "name": {
                      "type": "string",
                    },
                    "path": {
                      "type": "string",
                    },
                    "config": {
                      "type": "object",
                      "required": [],
                      "additionalProperties": false,
                      "properties": {
                        "baudRate": {
                          "type": "number",
                          "default": 9600,
                          "enum": [
                            1200,
                            2400,
                            4800,
                            9600,
                            19200,
                            38400,
                            57600,
                            115200,
                            230400,
                            460800,
                            921600
                          ]
                        },
                        "databits": {
                          "type": "number",
                          "default": 8,
                          "enum": [8, 7]
                        },
                        "parity": {
                          "type": "string",
                          "default": "none",
                          "enum": ["none", "even", "odd", "mark", "space"]
                        },
                        "stopbits": {
                          "type": "number",
                          "default": 1,
                          "enum": [1, 2]
                        },
                        "flowControl": {
                          "type": "boolean",
                          "default": false
                        },
                        "autoOpen": {
                          "type": "boolean",
                          "default": false
                        }
                      }
                    }
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
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["name", "engine", "port"],
                  "additionalProperties": false,
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "engine": {
                      "type": "string"
                    },
                    "port": {
                      "type": "string"
                    }
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
                "type": "array",
                "default": [],
                "items": {
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
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["id", "name", "type", "@context", "@type", "config", "properties"],
                  "additionalProperties": false,
                  "properties": {
                    "id": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    },
                    "type": {
                      "type": "array",
                      "default": [],
                      "items": {
                        "type": "string"
                      }
                    },
                    "description": {
                      "type": "string"
                    },
                    "@context": {
                      "type": "string"
                    },
                    "@type": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      }
                    },
                    "config": {
                      "type": "object",
                      "required": ["engine", "script"],
                      "additionalProperties": true,
                      "properties": {
                        "device": {
                          "type": "string"
                        }
                      }
                    },
                    "properties": {
                      "type": "object",
                      "patternProperties": {
                        "^.+$": {
                          "type": "object",
                          "required": ["name", "type", "value", "readOnly", "config"],
                          "additionalProperties": false,
                          "properties": {
                            "name": {
                              "type": "string"
                            },
                            "label": {
                              "type": "string"
                            },
                            "title": {
                              "type": "string"
                            },
                            "type": {
                              "type": "string",
                              "enum": ["string", "number", "boolean"]
                            },
                            "value": {
                              "type": ["string", null, "number", "boolean"]
                            },
                            "unit": {
                              "type": "string"
                            },
                            "readOnly": {
                              "type": "boolean"
                            },
                            "config": {
                              "type": "object"
                            }
                          }
                        }
                      }
                    }
                  }
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