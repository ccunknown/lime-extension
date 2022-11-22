const ValidateConfigSchema = {
  type: "object",
  required: ["table", "address", "period"],
  additionalProperties: true,
  properties: {
    table: {
      type: "string",
      title: "Register table",
      enum: [`coils`, `contacts`, `inputRegisters`, `holdingRegisters`],
    },
    address: {
      type: "array",
      title: "Register address",
      default: [],
      items: {
        type: "number",
      },
    },
    period: {
      type: "number",
      title: "Period (ms)",
      default: 10000,
      minimum: 1000,
    },
    size: {
      type: `number`,
      title: `Chunk size`,
      default: 255,
      minimum: 1,
      maximum: 255,
    },
  },
};

const AlternateList = [`table`, `address`];

const AttributeList = [];

module.exports = {
  ValidateConfigSchema,
  AlternateList,
  AttributeList,
};
