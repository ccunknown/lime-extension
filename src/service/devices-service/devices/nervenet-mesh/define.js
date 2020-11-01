const ValidateConfigSchema = {
  "type": "object",
  "required": ["engine"],
  "additionalProperties": false,
  "properties": {
    "engine": {
      "type": "string",
      "title": "Engine"
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
  "engine": [`nervenet-mesh-reader`]
};

const AlternateList = [
  "properties.^[^\n]+$.template"
];

const AttributeList = [];

module.exports = {
  ValidateConfigSchema,
  CompatibleList,
  AlternateList,
  AttributeList
};