const ValidateConfigSchema = {
  "type": "object",
  "required": ["name", "description", "template"],
  "additionalProperties": true,
  "properties": {
    "name": {
      "type": "string",
      "title": "Name",
      "attrs": {
        "placeholder": "Device's display name"
      }
    },
    "description": {
      "type": "string",
      "title": "Description",
      "attrs": {
        "type": "textarea",
        "placeholder": "Device's description"
      }
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