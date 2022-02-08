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
      500: {
        name: `Wind speed`,
        unit: `m/s`,
        translator: `function.bufferToUint16Div100`
      },
      501: {
        name: `Wind force`,
        unit: ``
      },
      502: {
        name: `Wind direction`,
        unit: `/8`
      },
      503: {
        name: `Wind direction degree`,
        unit: `degree`
      },
      504: {
        name: `Humidity`,
        unit: `%RH`,
        translator: `function.bufferToUint16Div10`
      },
      505: {
        name: `Temperature`,
        unit: `Celcius`,
        translator: `function.bufferToUint16Div10`
      },
      506: {
        name: `Noise`,
        unit: `DBi`,
        translator: `function.bufferToUint16Div10`
      },
      507: {
        name: `PM2.5`,
        unit: `ug/m3`
      },
      508: {
        name: `PM10`,
        unit: `ug/m3`
      },
      509: {
        name: `Atmospheric pressure`,
        unit: `Kpa`
      },
      510: {
        name: `Lux`,
        unit: `lux`,
        registerSpec: `DoubleWord`,
        translator: `function.bufferToUint32`
      },
      512: {
        name: `Lux/100`,
        unit: `lux*100`
      },
      513: {
        name: `Rainfall`,
        unit: `mm`,
        translator: `function.bufferToUint16Div10`
      }
    }
  }
};

module.exports = config;
