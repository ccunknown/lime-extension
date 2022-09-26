const ValidateConfigSchema = {
  type: "object",
  required: ["name", "description", "template"],
  additionalProperties: true,
  properties: {
    name: {
      type: "string",
      title: "Name",
      pattern: "^[a-zA-Z0-9 -_]+$",
      minLength: 4,
      maxLength: 50,
    },
    description: {
      type: "string",
      title: "Description",
    },
    template: {
      type: "string",
      title: "Device Template",
    },

    retry: {
      type: "boolean",
      title: "Retry to start",
      default: true,
    },
    retryNumber: {
      type: "number",
      title: "Number for retryment",
      default: 2,
    },
    retryDelay: {
      type: "number",
      title: "Retryment delay",
      default: 30000,
      minimum: 1000,
    },

    _config: {
      type: "object",
      required: [`enable`],
      properties: {
        enable: {
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
      placeholder: "Device's display name",
    },
  },
  {
    target: `description`,
    attrs: {
      type: `textarea`,
      placeholder: `Device's description`,
    },
  },
];

module.exports = {
  ValidateConfigSchema,
  AttributeList,
  AlternateList,
};
