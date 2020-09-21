const ValidateConfigSchema = {
  "type": "object",
  "required": ["port"],
  "additionalProperties": false,
  "properties": {
    "port": {
      "title": "Port",
      "type": "string"
    },
    "delay": {
      "title": "Delay (ms)",
      "type": "number",
      "default": 100
    },
    "timeout": {
      "title": "Timeout (ms)",
      "type": "number",
      "default": 200
    }
  }
};

const AlternateList = [];

const AttributeList = [];

module.exports = {
  ValidateConfigSchema,
  AttributeList,
  AlternateList
};