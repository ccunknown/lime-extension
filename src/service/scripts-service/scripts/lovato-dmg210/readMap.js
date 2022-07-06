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
        default: `function.bufferToUint32Div100`
      },
      type: {
        default: `number`,
        string: `string`
      }
    },
    coils: {},
    contacts: {},
    inputRegisters: {
      0x0002: {
        name: `L1 Phase Voltage`,
        unit: `V`
      },
      0x0004: {
        name: `L2 Phase Voltage`,
        unit: `V`
      },
      0x0006: {
        name: `L3 Phase Voltage`,
        unit: `V`
      },
      0x006a: {
        name: `Neutral-Earth Voltage`,
        unit: `V`
      },
      0x0008: {
        name: `L1 Current`,
        unit: `A`,
        translator: `function.bufferToUint32Div10000`
      },
      0x000a: {
        name: `L2 Current`,
        unit: `A`,
        translator: `function.bufferToUint32Div10000`
      },
      0x000c: {
        name: `L3 Current`,
        unit: `A`,
        translator: `function.bufferToUint32Div10000`
      },
      0x006c: {
        name: `Neutral Current`,
        unit: `A`,
        translator: `function.bufferToUint32Div10000`
      },
      0x0032: {
        name: `Frequency`,
        unit: `Hz`
      },
      0x0034: {
        name: `Eqv. Phase Voltage`,
        unit: `V`
      },
      0x0036: {
        name: `Eqv. Phase-To-Phase Voltage`,
        unit: `V`
      },
      0x0038: {
        name: `Eqv. Current`,
        unit: `V`,
        translator: `function.bufferToUint32Div10000`
      }
    },
    holdingRegisters: {}
  }
};

module.exports = config;
