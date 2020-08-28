const ValidateConfigSchema = {
  "type": "object",
  "required": ["name", "path", "config"],
  "additionalProperties": false,
  "properties": {
    "name": {
      "title": "Name",
      "type": "string",
      "pattern": "^[a-zA-Z0-9 \-_]+$",
      "minLength": 4,
      "maxLength": 20
    },
    "path": {
      "title": "Serial Port",
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "description": {
      "title": "Description",
      "type": "string",
      "minLength": 0,
      "maxLength": 500
    },
    "config": {
      "type": "object",
      "required": ["baudRate", "databits", "parity", "stopbits", "flowControl", "autoOpen"],
      "additionalProperties": false,
      "properties": {
        "baudRate": {
          "title": "Baudrate",
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
          "title": "Databits",
          "type": "number",
          "default": 8,
          "enum": [8, 7]
        },
        "parity": {
          "title": "Parity",
          "type": "string",
          "default": "none",
          "enum": ["none", "even", "odd", "mark", "space"]
        },
        "stopbits": {
          "title": "Stopbits",
          "type": "number",
          "default": 1,
          "enum": [1, 2]
        },
        "flowControl": {
          "title": "Flow Control",
          "type": "boolean",
          "default": false
        },
        "autoOpen": {
          "title": "Auto Open",
          "type": "boolean",
          "default": false
        }
      }
    }
  }
};

const AlternateList = [];

const AttributeList = [
  {
    "target": `name`,
    "attrs": {
      "placeholder": "Port's display name"
    }
  },
  {
    "target": `description`,
    "attrs": {
      "type": `textarea`,
      "placeholder": `Port's description`
    }
  }
];

module.exports = {
  ValidateConfigSchema,
  AttributeList,
  AlternateList
};