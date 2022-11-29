const ValidateConfigSchema = {
  type: "object",
  required: ["script", "engine", "address"],
  additionalProperties: false,
  properties: {
    engine: {
      type: "string",
      title: "Engine",
    },
    script: {
      type: "string",
      title: "Script",
    },

    ip: {
      type: "string",
      title: "Device IP Address",
    },
    port: {
      type: "number",
      title: "Device Port Number",
      default: 502,
    },

    address: {
      type: "number",
      title: "Modbus Address",
      default: 1,
      minimum: 0,
    },

    properties: {
      type: "object",
      title: "Property",
      required: [],
      patternProperties: {
        "{{{idPattern.regex}}}": {
          type: "object",
          required: ["template"],
          additionalProperties: false,
          properties: {
            name: {
              type: "string",
              title: "Name",
              pattern: "^[a-zA-Z0-9 -_<>]+$",
              minLength: 4,
              maxLength: 50,
            },
            description: {
              type: "string",
              title: "Description",
            },
            template: {
              type: "string",
              title: "Property Template",
            },
            enable: {
              type: "boolean",
              default: true,
            },
          },
        },
      },
    },
  },
};

const CompatibleList = {
  // "script": [`modbus-rtu`, `modbus-tcp`, `modbus`],
  script: [],
  engine: [`modbus-rtu`, `modbus-rtu-v2`, `modbus-tcp`],
};

const AlternateList = [
  "engine",
  "script",
  "retry",
  "properties.^[^\n]+$.template",
];

const AttributeList = [
  {
    target: `address`,
    attrs: {
      placeholder: "Modbus address",
    },
  },
  {
    target: `retryNumber`,
    attrs: {
      placeholder: "-1 for infinite retryment.",
    },
  },
  {
    target: `retryDelay`,
    attrs: {
      placeholder: "Delay (ms) before new retryment.",
    },
  },
];

module.exports = {
  ValidateConfigSchema,
  CompatibleList,
  AlternateList,
  AttributeList,
};
