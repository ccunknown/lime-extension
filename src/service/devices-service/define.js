const ValidateConfigSchema = {
  "type": "object",
  "required": ["name", "description", "template"],
  "additionalProperties": true,
  "properties": {
    "name": {
      "type": "string",
      "title": "Name"
    },
    "description": {
      "type": "string",
      "title": "Description"
    },
    "template": {
      "type": "string",
      "title": "Template"
    }
  }
};

const AlternateList = [
  `template`
];

const AttributeList = [
  {
    "target": `name`,
    "attrs": {
      "placeholder": "Device's display name"
    }
  },
  {
    "target": `description`,
    "attrs": {
      "type": `textarea`,
      "placeholder": `Device's description`
    }
  }
];

module.exports = {
  ValidateConfigSchema,
  AttributeList,
  AlternateList
};