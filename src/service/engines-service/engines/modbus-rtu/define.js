const ValidateConfigSchema = {
  "type": "object",
  "required": ["port"],
  "additionalProperties": false,
  "properties": {
    "port": {
      "title": "Port",
      "type": "string"
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