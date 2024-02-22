const config = {
  map: {
    define: {
      registerSpec: {
        default: {
          size: 16,
          number: 1
        },
        DoubleWord: {
          size: 16,
          number: 2
        }
      },
      translator: {
        default: `function.bufferToUint16`
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
      0x0165: {
        name: `Light`,
        unit: `lux`,
        translator: `function.bufferToUint16Mul10`,
      },
      0x0166: {
        name: `UV index`,
        unit: ``,
        translator: `function.bufferToUint16Div10`,
      },
      0x167: {
        name: `Temperature`,
        unit: `C`,
        translator: `function.temperatureCal`,
      },
      0x0168: {
        name: `Humidity`,
        unit: `%`,
        translator: `function.bufferToUint16`,
      },
      0x0169: {
        name: `Wind speed`,
        unit: `m/s`,
        translator: `function.bufferToUint16Div10`,
      },
      0x16A: {
        name: `Gust speed`,
        unit: `m/s`,
        translator: `function.bufferToUint16Div10`,
      },
      0x16B: {
        name: `Wind direction`,
        unit: `degree`,
        translator: `function.bufferToUint16`,
      },
      0x16C: {
        name: `Rainfall`,
        unit: `mm`,
        translator: `function.bufferToUint16Div10`,
      },
      0x16D: {
        name: `ABS Pressure`,
        unit: `hPa`,
        translator: `function.bufferToUint16Div10`,
      },
    }
  }
};

module.exports = config;
