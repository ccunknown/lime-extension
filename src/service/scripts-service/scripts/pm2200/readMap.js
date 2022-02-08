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
        default: `function.bufferToUint32`
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
      2999: {
        name: `Current A`,
        unit: `A`,
        translator: `function.bufferToFloat32`
      },
      3001: {
        name: `Current B`,
        unit: `A`,
        translator: `function.bufferToFloat32`
      },
      3003: {
        name: `Current C`,
        unit: `A`,
        translator: `function.bufferToFloat32`
      },
      3005: {
        name: `Current N`,
        unit: `A`,
        translator: `function.bufferToFloat32`
      },
      3007: {
        name: `Current G`,
        unit: `A`,
        translator: `function.bufferToFloat32`
      },
      3009: {
        name: `Current Avg`,
        unit: `A`,
        translator: `function.bufferToFloat32`
      },


      3011: {
        name: `Current Unbalance A`,
        unit: `%`,
        translator: `function.bufferToFloat32`
      },
      3013: {
        name: `Current Unbalance B`,
        unit: `%`,
        translator: `function.bufferToFloat32`
      },
      3015: {
        name: `Current Unbalance C`,
        unit: `%`,
        translator: `function.bufferToFloat32`
      },
      3017: {
        name: `Current Unbalance Worst`,
        unit: `%`,
        translator: `function.bufferToFloat32`
      },


      3019: {
        name: `Voltage A-B`,
        unit: `V`,
        translator: `function.bufferToFloat32`
      },
      3021: {
        name: `Voltage B-C`,
        unit: `V`,
        translator: `function.bufferToFloat32`
      },
      3023: {
        name: `Voltage C-A`,
        unit: `V`,
        translator: `function.bufferToFloat32`
      },
      3025: {
        name: `Voltage L-L Avg`,
        unit: `V`,
        translator: `function.bufferToFloat32`
      },
      3027: {
        name: `Voltage A-N`,
        unit: `V`,
        translator: `function.bufferToFloat32`
      },
      3029: {
        name: `Voltage B-N`,
        unit: `V`,
        translator: `function.bufferToFloat32`
      },
      3031: {
        name: `Voltage C-N`,
        unit: `V`,
        translator: `function.bufferToFloat32`
      },
      3035: {
        name: `Voltage L-N Avg`,
        unit: `V`,
        translator: `function.bufferToFloat32`
      },



      3053: {
        name: `Active Power A`,
        unit: `kW`,
        translator: `function.bufferToFloat32`
      },
      3055: {
        name: `Active Power B`,
        unit: `kW`,
        translator: `function.bufferToFloat32`
      },
      3057: {
        name: `Active Power C`,
        unit: `kW`,
        translator: `function.bufferToFloat32`
      },
      3059: {
        name: `Active Power Total`,
        unit: `kW`,
        translator: `function.bufferToFloat32`
      },



      3061: {
        name: `Reactive Power A`,
        unit: `kVAR`,
        translator: `function.bufferToFloat32`
      },
      3063: {
        name: `Reactive Power B`,
        unit: `kVAR`,
        translator: `function.bufferToFloat32`
      },
      3065: {
        name: `Reactive Power C`,
        unit: `kVAR`,
        translator: `function.bufferToFloat32`
      },
      3067: {
        name: `Reactive Power Total`,
        unit: `kVAR`,
        translator: `function.bufferToFloat32`
      },


      3069: {
        name: `Apparent Power A`,
        unit: `kVA`,
        translator: `function.bufferToFloat32`
      },
      3071: {
        name: `Apparent Power B`,
        unit: `kVA`,
        translator: `function.bufferToFloat32`
      },
      3073: {
        name: `Apparent Power C`,
        unit: `kVA`,
        translator: `function.bufferToFloat32`
      },
      3075: {
        name: `Apparent Power Total`,
        unit: `kVA`,
        translator: `function.bufferToFloat32`
      },


      3077: {
        name: `Power Factor A`,
        unit: ``,
        translator: `function.bufferToFloat32`
      },
      3077: {
        name: `Power Factor B`,
        unit: ``,
        translator: `function.bufferToFloat32`
      },
      3077: {
        name: `Power Factor C`,
        unit: ``,
        translator: `function.bufferToFloat32`
      },
      3077: {
        name: `Power Factor Total`,
        unit: ``,
        translator: `function.bufferToFloat32`
      },


      3109: {
        name: `Frequency`,
        unit: `Hz`,
        translator: `function.bufferToFloat32`
      }
    }
  }
};

module.exports = config;
