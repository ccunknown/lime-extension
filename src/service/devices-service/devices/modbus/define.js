const ValidateConfigSchema = {
  "type": "object",
  "required": ["script", "engine", "address"],
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

    "ip": {
      "type": "string",
      "title": "Device IP Address"
    },
    "port": {
      "type": "number",
      "title": "Device Port Number"
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
        "{{{idPattern.regex}}}": {
          "type": "object",
          "required": ["template"],
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
  // "script": [`modbus-rtu`, `modbus-tcp`, `modbus`],
  "script": [],
  "engine": [`modbus-rtu`, `modbus-tcp`]
};

const AlternateList = [
  "engine",
  "script",
  "properties.^[^\n]+$.template"
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