'use strict';

var Defaults = {
  "extension": {
    "name": "lime",
    "version": "0.1.0"
  },
  "config": {
    "service": [
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
        }
      },
      {
        "id": "engines-service",
        "path": "/engines-service/engines-service",
        "enable": true,
        "status": "unknow",
        "description": "Engine is a solution to provide data from port to script.",
        "config": {
          "directory": "/engines",
          "template": [
            {
              "name": "modbus-rtu",
              "path": "modbus-rtu/modbus-rtu"
            }
          ],
          "list": [
            {
              "name": "modbus-engine-001",
              "engine": "modbus-rtu",
              "port": "modbus-01"
            }
          ]
        }
      },
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
    "required": ["port", "template", "service"],
    "additionalProperties": false,
    "properties": {
      "service-config": {
        "type": "object"
      },
      "service": {
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "id",
            "enable",
            "status"
          ],
          "additionalProperties": false,
          "properties": {
            "id": {
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
              "enum": [
                "enabled",
                "unknow",
                "disabled"
              ],
            },
            "reason": {
              "type": "string",
              "default": ""
            }
          }
        }
      }
    }
  }
};

module.exports = Defaults;