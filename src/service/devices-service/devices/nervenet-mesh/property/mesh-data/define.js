const ValidateConfigSchema = {
  "type": "object",
  "required": ["title"],
  "additionalProperties": true,
  "properties": {
    "title": {
      "type": "string",
      "title": "Title"
    }
  }
};

const AlternateList = [];

const AttributeList = [];

module.exports = {
  ValidateConfigSchema,
  AlternateList,
  AttributeList
};