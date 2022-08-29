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
      title: "Engine Template",
      type: "string",
    },
    _config: {
      type: "object",
      required: [`addToService`],
      properties: {
        addToService: {
          type: "boolean",
          default: true,
        },
      },
    },
  },
};

const AlternateList = [`template`];

const AttributeList = [
  {
    target: `name`,
    attrs: {
      placeholder: `Engine's display name`,
    },
  },
  {
    target: `description`,
    attrs: {
      type: `textarea`,
      placeholder: `Engine's description`,
    },
  },
];

module.exports = {
  ValidateConfigSchema,
  AttributeList,
  AlternateList,
};
