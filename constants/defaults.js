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
    "engines-service": {
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
    },
    "scripts-service": {
      "directory": "/scripts"
    },
    "devices-service": {
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
                "address": 0x0048,
                "table": "inputRegisters",
                "period": 10000
              }
            }
          }
        }
      ]
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
          "id": `device01`,
          "name": `SDM120CT Power Meter`,
          "address": 11,
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
            },
            "iae": {
              "name": "importActiveEnergy",
              "label": "Import Active Energy",
              "value": 0,
              "metadata": {
                "address": 0x0048,
                "@type": "InstantaneousPowerProperty",
                "title": "Import Active Energy",
                "type": "number",
                "unit": "kWh",
                "table": "inputRegisters"
              }
            }
          }
        },
        {
          "id": `device02`,
          "name": `SDM120M Power Meter`,
          "address": 12,
          "template": `SDM120M`,
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
    /*
      {
        "id": "modbus-service",
        "path": "/modbus-service",
        "enable": false,
        "status": "unknow"
      },
      {
        "id": "vthing-service",
        "path": "/vthing-service",
        "enable": false,
        "status": "unknow",
        "description": "This service use to create things on mozilla-iot gateway."
      },*/
      
      {
        "id": "sysport-service",
        "path": "/sysport-service.js",
        "enable": true,
        "status": "unknow",
        "description": "Port resource controller, provide port to engine."
      },
      {
        "id": "engines-service",
        "path": "/engines-service/engines-service",
        "enable": true,
        "status": "unknow",
        "description": "Engine is a solution to provide data from port to script."
      },
      {
        "id": "scripts-service",
        "path": "/scripts-service/scripts-service",
        "enable": true,
        "status": "unknow",
        "description": "Controller of scripts of slave serial devices, used to translatation for devices-service."
      },
      {
        "id": "devices-service",
        "path": "/devices-service/devices-service",
        "enable": true,
        "status": "unknow",
        "description": "A combination of script and engine to define what was device should be."
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