const config = {
  map: {
    define: {
      registerSpec: {
        default: {
          size: 16,
          number: 1,
        },
        two_words: {
          size: 16,
          number: 2,
        },
      },
      translator: {
        default: `function.bufferToUint16`,
      },
      type: {
        default: `number`,
        string: `string`,
      },
    },
    coils: {},
    contacts: {},
    inputRegisters: {},
    holdingRegisters: {
      0: {
        name: `CO2`,
        unit: `mg/m3`,
      },
    },
  },
};

module.exports = config;
