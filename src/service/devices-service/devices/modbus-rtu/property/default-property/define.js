const ValidateConfigSchema = {
  "type": "object",
  "required": [],
  "additionalProperties": true,
  "properties": {
    "table": {
      "type": "string",
      "title": "Register table",
      //"default": "inputRegisters",
      "enum": [`coils`, `contacts`, `inputRegisters`, `holdingRegisters`]
    },
    "address": {
      "type": "number",
      "title": "Register address"
    },
    "period": {
      "type": "number",
      "title": "Period (ms)",
      "default": 10000,
      "minimum": 1000
    }
  }
};

const AlternateList = [
  `table`
];

const AttributeList = [];

module.exports = {
  ValidateConfigSchema,
  AlternateList,
  AttributeList
};