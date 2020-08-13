const ValidateConfigSchema = {
  "type": "object",
  "required": [`script`, `engine`, `address`],
  "additionalProperties": false,
  "properties": {
    "script": {
      "type": "string",
      "title": "Script"
    },
    "engine": {
      "type": "string",
      "title": "Engine"
    },
    "address": {
      "type": "number",
      "title": "Modbus Address",
      "default": 1,
      "minimum": 0
    },
    "properties": {
      "type": "object",
      "title": "Property",
      "required": [],
      "patternProperties": {
        ".+": {
          "type": "object",
          "required": [],
          "additionalProperties": false,
          "properties": {
            "template": {
              "type": "string",
              "title": "Property template"
            }
          }
        }
      }
    }
  }
};

const CompatibleList = {
  "script": [`modbus-rtu`],
  "engine": [`modbus-rtu`]
};

const AlternateList = [
  "script"
];

const AttributeList = [
  {
    "target": `address`,
    "attrs": {
      "placeholder": "Modbus address"
    }
  }
];

module.exports = {
  ValidateConfigSchema,
  CompatibleList,
  AlternateList,
  AttributeList
};