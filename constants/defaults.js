'use strict';

var Defaults = {
  "extension": {
    "name": "lime",
    "version": "0.1.0"
  },
  "config": {
    "service": [
      //  Port Service
      {
        "id": "sysport-service",
        "path": "sysport-service/sysport-service.js",
        "enable": true,
        "status": "unknow",
        "description": "Port resource controller, provide port to engine.",
        "config": {
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
        "config-schema": {
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
        }
      },
      //  Engine Service
      {
        "id": "engines-service",
        "path": "/engines-service/engines-service",
        "enable": true,
        "status": "unknow",
        "description": "Engine is a solution to provide data from port to script.",
        "config": {
          "directory": "/engines",
          "list": [
            {
              "name": "modbus-engine-001",
              "engine": "modbus-rtu",
              "port": "modbus-01"
            }
          ]
        }
      },
      //  Script Service
      {
        "id": "scripts-service",
        "path": "/scripts-service/scripts-service",
        "enable": true,
        "status": "unknow",
        "description": "Controller of scripts of slave serial devices, used to translatation for devices-service.",
        "config": {
          "directory": "/scripts"
        }
      },
      //  Device Service
      {
        "id": "devices-service",
        "path": "/devices-service/devices-service",
        "enable": true,
        "status": "unknow",
        "description": "A combination of script and engine to define what was device should be.",
        "config": {
          "directory": "/devices",
          "list": [
            {
              "id": "device-002",
              "name": "SDM120CT Power Meter",
              "type": "modbus-device",
              "@context": `https://iot.mozilla.org/schemas`,
              "@type": [`EnergyMonitor`],
              "config": {
                "script": "sdm120ct",
                "engine": "modbus-engine-001",
                "device": "modbus-rtu",
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
            }
          ]
        }
      }
    ]
  },
  "schema": {
    "type": "object",
    "required": ["service"],
    "additionalProperties": false,
    "properties": {
      "service": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["id", "path", "enable", "config"],
          "additionalProperties": false,
          "properties": {
            "id": {
              "type": "string"
            },
            "path": {
              "type": "string"
            },
            "description": {
              "type": "string",
              "default": ""
            },
            "dependencies": {
              "type": "array",
              "default": [],
              "items": {
                "type": "string"
              }
            },
            "enable": {
              "type": "boolean",
              "default": false
            },
            "status": {
              "type": "string",
              "default": "unknow",
              "enum": [
                "enabled",
                "unknow",
                "disabled"
              ],
            },
            "config": {
              "type": "object",
            },
            "config-schema": {
              "type": "object"
            }
          }
        }
      }
    }
  }
};

module.exports = Defaults;