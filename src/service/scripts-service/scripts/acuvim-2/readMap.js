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
        default: `function.bufferToFloat32`
      },
      type: {
        default: `number`,
        string: `string`
      }
    },
    coils: {},
    contacts: {},
    inputRegisters: {},
    holdingRegisters: {
      0x4000: {
        name: `Frequncy`,
        unit: `Hz`
      },
      0x4002: {
        name: `Phase 1 Voltage`,
        unit: `V`
      },
      0x4004: {
        name: `Phase 2 Voltage`,
        unit: `V`
      },
      0x4006: {
        name: `Phase 3 Voltage`,
        unit: `V`
      },
      0x4008: {
        name: `Average Phase Voltage`,
        unit: `V`
      }
    }
  }
};

module.exports = config;
