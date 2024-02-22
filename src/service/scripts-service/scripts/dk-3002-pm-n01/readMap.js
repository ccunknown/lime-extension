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
        name: `PM 2.5`,
        unit: `ug/m3`,
      },
      1: {
        name: `PM 10`,
        unit: `ug/m3`,
      },
    },
  },
};

module.exports = config;
