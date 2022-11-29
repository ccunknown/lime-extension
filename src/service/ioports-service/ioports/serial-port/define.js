const ValidateConfigSchema = {
  type: "object",
  required: [
    "path",
    "baudRate",
    "databits",
    "parity",
    "stopbits",
    "flowControl",
    "autoOpen",
  ],
  additionalProperties: false,
  properties: {
    path: {
      title: "Serial Port",
      type: "string",
      minLength: 1,
    },
    baudRate: {
      title: "Baudrate",
      type: "number",
      default: 9600,
      enum: [
        1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800,
        921600,
      ],
    },
    databits: {
      title: "Databits",
      type: "number",
      default: 8,
      enum: [8, 7],
    },
    parity: {
      title: "Parity",
      type: "string",
      default: "none",
      enum: ["none", "even", "odd", "mark", "space"],
    },
    stopbits: {
      title: "Stopbits",
      type: "number",
      default: 1,
      enum: [1, 2],
    },
    flowControl: {
      title: "Flow Control",
      type: "boolean",
      default: false,
    },
    autoOpen: {
      title: "Auto Open",
      type: "boolean",
      default: false,
    },
  },
};

const AlternateList = [];

const AttributeList = [];

module.exports = {
  ValidateConfigSchema,
  AttributeList,
  AlternateList,
};
