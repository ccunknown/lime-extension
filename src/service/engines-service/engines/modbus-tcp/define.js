const ValidateConfigSchema = {
  "type": "object",
  "required": ["delay", "timeout"],
  "additionalProperties": false,
  "properties": {
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