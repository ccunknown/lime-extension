'use strict';

var Defaults = {
  "extension": {
    "name": "lime",
    "version": "0.1.0"
  },
  "config": {
    "port": {
      "name": null,
      "baudrate": 9600
    },
    "template": {
      "default": {
        "calcpath": ""
      },
      "list": [
        {
          "name": "SDM120CT",
          "path": {
            "readmap": "../../template/sdm12ct/readMap",
            "calcmap": "../../template/sdm12ct/calcMap"
          }
        }
      ]
    },
    "vthing": {
      "list": [
        {
          "id": `test`,
          "name": `SDM120CT Power Meter`,
          "address": 1,
          "template": `SDM120CT`,
          "type": `modbus-device`,
          "@context": `https://iot.mozilla.org/schemas`,
          "@type": [`EnergyMonitor`],
          "properties": {
            "voltage": {
              "name": "voltage",
              "label": "Voltage",
              "value": 0,
              "metadata": {
                "address": 0x0000,
                "@type": "InstantaneousPowerProperty",
                "title": "Voltage",
                "type": "number",
                "unit": "V",
                "table": "inputRegisters"
              }
            },
            "current": {
              "name": "current",
              "label": "Current",
              "value": 0,
              "metadata": {
                "address": 0x0006,
                "@type": "InstantaneousPowerProperty",
                "title": "Current",
                "type": "number",
                "unit": "A",
                "table": "inputRegisters"
              }
            }
          }
        }
      ]
    },
    "service": [
      {
        "id": "modbus-service",
        "enable": true,
        "status": "unknow"
      },
      {
        "id": "vthing-service",
        "enable": true,
        "status": "unknow",
        "description": "This service use to create things on mozilla-iot gateway."
      }
    ]
  },
  "schema": {
    "type": "object",
    "required": ["port", "template", "service"],
    "additionalProperties": false,
    "properties": {
      "port": {
        "type": "object",
        "required": ["name", "baudrate"],
        "additionalProperties": false,
        "properties": {
          "name": {
            "type": ["string", "null"],
            "default": null
          },
          "baudrate": {
            "type": "number",
            "enum": [
              2400,
              4800,
              9600,
              19200,
              38400
            ],
            "default": 9600
          }
        }
      },
      "template": {
        "type": "object",
        "required": ["default", "list"],
        "additionalProperties": false,
        "properties": {
          "default": {
            "type": "object",
            "required": ["calc"],
            "additionalProperties": false,
            "properties": {
              "calc": {
                "type": "string"
              }
            }
          },
          "list": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["name", "readpath"],
              "additionalProperties": false,
              "properties": {
                "name": {
                  "type": "string"
                },
                "readpath": {
                  "type": "string"
                },
                "calcpath": {
                  "type": "string"
                }
              }
            }
          }
        }
      },
      "vthing": {
        "type": "object",
        "required": [
          "list"
        ],
        "properties": {
          "list": {
            "type": "array",
            "default": [],
            "items": {
              "type": "object",
              "required": [
                "id",
                "name",
                "template",
                "properties"
              ],
              "properties": {
                "id": {
                  "type": "string"
                },
                "name": {
                  "type": "string"
                },
                "template": {
                  "type": "string"
                },
                "properties": {
                  "type": "array",
                  "default": [],
                  "items": {
                    "type": ["number"]
                  }
                }
              }
            }
          }
        }
      },
      "service":{
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