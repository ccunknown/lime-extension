const config = {
  map: {
    define: {
      registerSpec: {
        default: {
          size: 16,
          number: 2
        },
        oneRegister: {
          size: 16,
          number: 1
        }
      },
      translator: {
        default: `function.bufferToUint32Div10`
      },
      type: {
        default: `number`,
        string: `string`
      }
    },
    coils: {},
    contacts: {},
    inputRegisters: {
      
    },
    holdingRegisters: {
      0x0000: {
        name: `Voltage L1-N`,
        unit: `V`
      },
      0x000E: {
        name: `Current L1`,
        unit: `A`
      }
    }
  }
};

module.exports = config;