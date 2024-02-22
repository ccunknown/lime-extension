const config = {
  map: {
    define: {
      registerSpec: {
        default: {
          size: 16,
          number: 1
        },
        two_words: {
          size: 16,
          number: 2
        }
      },
      translator: {
        default: `function.bufferToUint16Div100`
      },
      type: {
        default: `number`,
        string: `string`
      }
    },
    coils: {},
    contacts: {},
    inputRegisters: {
      0x3000: {
        name: `Array rated voltage`,
        unit: `volt`,
      },
      0x3001: {
        name: `Array rated current`,
        unit: `amp`,
      },
      0x3002: {
        name: `Array rated power`,
        unit: `watt`,
        translator: `function.bufferToUint32Div100`,
        registerSpec: `two_words`,
      },
      0x3004: {
        name: `Battery rated voltage`,
        unit: `volt`,
      },
      0x3005: {
        name: `Battery rated current`,
        unit: `amp`,
      },
      0x3006: {
        name: `Battery rated power`,
        unit: `watt`,
        translator: `function.bufferToUint32Div100`,
        registerSpec: `two_words`,
      },

      0x300E: {
        name: `Rated current of load`,
        unit: `watt`,
      },

      0x3100: {
        name: `PV array input voltage`,
        unit: `volt`,
      },
      0x3101: {
        name: `PV array input current`,
        unit: `amp`,
      },
      0x3102: {
        name: `PV array input power`,
        unit: `watt`,
        translator: `function.bufferToUint32Div100`,
        registerSpec: `two_words`,
      },
      0x3106: {
        name: `Battery power`,
        unit: `watt`,
        translator: `function.bufferToUint32Div100`,
        registerSpec: `two_words`,
      },
      0x310C: {
        name: `Load voltage`,
        unit: `volt`,
      },
      0x310D: {
        name: `Load current`,
        unit: `amp`,
      },
      0x310E: {
        name: `Load power`,
        unit: `watt`,
        translator: `function.bufferToUint32Div100`,
        registerSpec: `two_words`,
      },
      0x3110: {
        name: `Battery Temperature`,
        unit: `celsius`,
      },
      0x3111: {
        name: `Temperature inside equipment`,
        unit: `celsius`,
      },

      0x311A: {
        name: `Battery SOC`,
        unit: `%`,
      },
      0x311B: {
        name: `Remote battery temperature`,
        unit: `celsius`,
      },
      0x311D: {
        name: `Battery's real rated power`,
        unit: `volt`,
      },
    },
    holdingRegisters: {
      0x9001: {
        name: `Battery Capacity`,
        unit: `AH`,
        translator: `function.bufferToUint16Div100`
      },
    }
  }
};

module.exports = config;
