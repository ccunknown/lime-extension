const config = {
  meta: {
    name: "SDM120CT",
    description: "Test template for SDM120CT from Eastron.",
  },
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
    inputRegisters: {
      0x0000: {
        name: `Voltage`,
        unit: `V`
      },
      0x0006: {
        name: `Current`,
        unit: `A`
      },
      0x000C: {
        name: `Active Power`,
        unit: `W`
      },
      0x0012: {
        name: `Apparent Power`,
        unit: `VAr`
      },
      0x0018: {
        name: `Reactive Power`,
        unit: `VAr`
      },
      0x001E: {
        name: `Power Factor`,
        unit: null
      },
      0x0024: {
        name: `Phase Angle`,
        unit: `Degree`
      },
      0x0046: {
        name: `Frequency`,
        unit: `Hz`
      },
      0x0048: {
        name: `Import Active Energy`,
        unit: `kWh`
      },
      0x004A: {
        name: `Export Active Energy`,
        unit: `kWh`
      },
      0x004C: {
        name: `Import Reactive Energy`,
        unit: `kVArh`
      },
      0x004E: {
        name: `Export Reactive Energy`,
        unit: `kVArh`
      },
      0x0056: {
        name: `Total Active Energy`,
        unit: `kWh`
      },
      0x0058: {
        name: `Total Reactive Energy`,
        unit: `kVArh`
      }
    },
    holdingRegisters: {
      0x000C: {
        name: `Relay Pulse Width`,
        unit: ``
      },
      0x0012: {
        name: `Network Parity Stop`,
        unit: ``,
        type: `string`,
        translator: `translator.networkParityStop`
      },
      0x0014: {
        name: `Network Node`,
        unit: ``
      },
      0x001C: {
        name: `Network Baud Rate`,
        unit: ``,
        translator: `translator.networkBaudRate`
      },
      0xF500: {
        name: `Demand Interval, Side Time, etc.`,
        unit: ``
      },
      0xF910: {
        name: `System Power`,
        unit: ``,
        type: `string`,
        registerSpec: {
          size: 16,
          number: 1
        },
        translator: `translator.translateMap`,
        translateMap: {
          indexTranslator: `function.bufferToUint16`,
          map: {
            0x0000: `0.001kWh (kVArh) /imp`,
            0x0001: `0.01kWh (kVArh) /imp`,
            0x0002: `0.1kWh (kVArh) /imp`,
            0x0003: `1kWh (kVArh) /imp`
          }
        }
      },
      0xF920: {
        name: `Measurement Mode`,
        unit: ``,
        type: `string`,
        registerSpec: `oneRegister`,
        translator: `translator.translateMap`,
        translateMap: {
          indexTranslator: `function.bufferToUint16`,
          map: {
            0x0001: `Mode 1 (Total = Import)`,
            0x0002: `Mode 2 (Total = Import + Export)`,
            0x0003: `Mode 3 (Total = Import - Export)`
          }
        }
      },
      0xF930: {
        name: `Pluse Output & LED Indicator`,
        unit: ``,
        type: `string`,
        registerSpec: `oneRegister`,
        translator: `translator.translateMap`,
        translateMap: {
          indexTranslator: `function.bufferToUint16`,
          map: {
            0x0000: `Import & Export Energy, LED flashes for Import & Export Energy`,
            0x0001: `Import Energy, LED flashes for Import Energy only`,
            0x0002: `Export Energy, LED flashes for Export Energy only`
          }
        }
      }
    }
  }
};

module.exports = config;