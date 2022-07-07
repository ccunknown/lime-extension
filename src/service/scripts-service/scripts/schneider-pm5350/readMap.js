const config = {
  map: {
    define: {
      registerSpec: {
        default: {
          size: 16,
          number: 2
        },
        oneWord: {
          size: 16,
          number: 1
        },
        fourWords: {
          size: 16,
          number: 4
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

      // Current
      2999: {
        name: `Current A`,
        unit: `A`
      },
      3001: {
        name: `Current B`,
        unit: `A`
      },
      3003: {
        name: `Current C`,
        unit: `A`
      },
      3005: {
        name: `Current N`,
        unit: `A`
      },
      3007: {
        name: `Current G`,
        unit: `A`
      },
      3009: {
        name: `Current Avg`,
        unit: `A`
      },

      // Voltage
      3019: {
        name: `Voltage A-B`,
        unit: `V`
      },
      3021: {
        name: `Voltage B-C`,
        unit: `V`
      },
      3023: {
        name: `Voltage C-A`,
        unit: `V`
      },
      3025: {
        name: `Voltage L-L Avg`,
        unit: `V`
      },
      3027: {
        name: `Voltage A-N`,
        unit: `V`
      },
      3029: {
        name: `Voltage B-N`,
        unit: `V`
      },
      3031: {
        name: `Voltage C-N`,
        unit: `V`
      },
      3035: {
        name: `Voltage L-N Avg`,
        unit: `V`
      },

      // Power
      3053: {
        name: `Active Power A`,
        unit: `kW`
      },
      3055: {
        name: `Active Power B`,
        unit: `kW`
      },
      3057: {
        name: `Active Power C`,
        unit: `kW`
      },
      3059: {
        name: `Active Power Total`,
        unit: `kW`
      },
      3061: {
        name: `Reactive Power A`,
        unit: `kVAR`
      },
      3063: {
        name: `Reactive Power B`,
        unit: `kVAR`
      },
      3065: {
        name: `Reactive Power C`,
        unit: `kVAR`
      },
      3067: {
        name: `Reactive Power Total`,
        unit: `kVAR`
      },
      3069: {
        name: `Apparent Power A`,
        unit: `kVA`
      },
      3071: {
        name: `Apparent Power B`,
        unit: `kVA`
      },
      3073: {
        name: `Apparent Power C`,
        unit: `kVA`
      },
      3075: {
        name: `Apparent Power Total`,
        unit: `kVA`
      },

      // Power Factor
      3077: {
        name: `Power Factor A`,
        unit: ``,
        translator: `function.pfValueFrom4QSchneider`
      },
      3079: {
        name: `Power Factor B`,
        unit: ``,
        translator: `function.pfValueFrom4QSchneider`
      },
      3081: {
        name: `Power Factor C`,
        unit: ``,
        translator: `function.pfValueFrom4QSchneider`
      },
      3083: {
        name: `Power Factor Total`,
        unit: ``,
        translator: `function.pfValueFrom4QSchneider`
      },

      // Frequency
      3109: {
        name: `Frequency`,
        unit: `Hz`
      },

      // Accumulated Energy
      3203: {
        name: `Active Energy Delivered`,
        unit: `Wh`,
        translator: `function.bufferToBigUint64`,
        registerSpec: `fourWords`
      },
      3207: {
        name: `Active Energy Received`,
        unit: `Wh`,
        translator: `function.bufferToBigUint64`,
        registerSpec: `fourWords`
      },
      3219: {
        name: `Reactive Energy Delivered`,
        unit: `VARh`,
        translator: `function.bufferToBigUint64`,
        registerSpec: `fourWords`
      },
      3223: {
        name: `Reactive Energy Received`,
        unit: `VARh`,
        translator: `function.bufferToBigUint64`,
        registerSpec: `fourWords`
      },
      3235: {
        name: `Apparent Energy Delivered`,
        unit: `VAh`,
        translator: `function.bufferToBigUint64`,
        registerSpec: `fourWords`
      },
      3239: {
        name: `Apparent Energy Received`,
        unit: `VAh`,
        translator: `function.bufferToBigUint64`,
        registerSpec: `fourWords`
      }
    }
  }
};

module.exports = config;
