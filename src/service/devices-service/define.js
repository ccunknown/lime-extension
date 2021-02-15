const ValidateConfigSchema = {
  "type": "object",
  "required": ["name", "description", "template"],
  "additionalProperties": true,
  "properties": {
    "name": {
      "type": "string",
      "title": "Name",
      "pattern": "^[a-zA-Z0-9 \-_]+$",
      "minLength": 4,
      "maxLength": 20
    },
    "description": {
      "type": "string",
      "title": "Description"
    },
    "template": {
      "type": "string",
      "title": "Template"
    },
    "_config": {
      "type": "object",
      "required": [`addToService`],
      "properties": {
        "addToService": {
          "type": "boolean",
          "default": true
        }
      }
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