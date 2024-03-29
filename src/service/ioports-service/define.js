const ValidateConfigSchema = {
  type: "object",
  required: ["name", "template"],
  additionalProperties: true,
  properties: {
    name: {
      title: "Name",
      type: "string",
      pattern: "^[a-zA-Z0-9 -_]+$",
      minLength: 4,
      maxLength: 50,
    },
    description: {
      title: "Description",
      type: "string",
      minLength: 0,
      maxLength: 500,
    },
    template: {
      title: "Port Template",
      type: "string",
    },
    enable: {
      type: "boolean",
      default: true,
    },
  },
};

const AlternateList = [`template`];

const AttributeList = [
  {
    target: `name`,
    attrs: {
      placeholder: `System port's display name`,
    },
  },
  {
    target: `description`,
    attrs: {
      type: `textarea`,
      placeholder: `System port's description`,
    },
  },
];

module.exports = {
  ValidateConfigSchema,
  AttributeList,
  AlternateList,
};
