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

      // Voltage
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
      },

      // Line Voltage
      0x400A: {
        name: `Line Voltage 1-2`,
        unit: `V`
      },
      0x400C: {
        name: `Line Voltage 2-3`,
        unit: `V`
      },
      0x400E: {
        name: `Line Voltage 3-1`,
        unit: `V`
      },
      0x4010: {
        name: `Average Line Voltage`,
        unit: `V`
      },

      // Current
      0x4012: {
        name: `Total Phase A Current`,
        unit: `A`
      },
      0x4014: {
        name: `Total Phase B Current`,
        unit: `A`
      },
      0x4016: {
        name: `Total Phase C Current`,
        unit: `A`
      },
      0x4018: {
        name: `Average Phase Current`,
        unit: `A`
      },
      0x401A: {
        name: `Neutral Current`,
        unit: `A`
      },

      // Active Power
      0x401C: {
        name: `Phase A Power`,
        unit: `kW`
      },
      0x401E: {
        name: `Phase B Power`,
        unit: `kW`
      },
      0x4020: {
        name: `Phase C Power`,
        unit: `kW`
      },
      0x4022: {
        name: `Total System Power`,
        unit: `kW`
      },

      // Reactive Power
      0x4024: {
        name: `Phase A Reactive Power`,
        unit: `kvar`
      },
      0x4026: {
        name: `Phase B Reactive Power`,
        unit: `kvar`
      },
      0x4028: {
        name: `Phase C Reactive Power`,
        unit: `kvar`
      },
      0x402A: {
        name: `Total Reactive Power`,
        unit: `kvar`
      },

      // Apparent Power
      0x402C: {
        name: `Phase A Apparent Power`,
        unit: `kVA`
      },
      0x402E: {
        name: `Phase B Apparent Power`,
        unit: `kVA`
      },
      0x4030: {
        name: `Phase C Apparent Power`,
        unit: `kVA`
      },
      0x4032: {
        name: `Total Apparent Power`,
        unit: `kVA`
      },

      // Power Factor
      0x4034: {
        name: `Phase A Power Factor`,
        unit: ``
      },
      0x4036: {
        name: `Phase B Power Factor`,
        unit: ``
      },
      0x4038: {
        name: `Phase C Power Factor`,
        unit: ``
      },
      0x403A: {
        name: `Total Power Factor`,
        unit: ``
      },

      // ETC
      0x403C: {
        name: `Voltage Unbalance`,
        unit: `%`
      },
      0x403E: {
        name: `Current Unbalance`,
        unit: `%`
      },
      0x4040: {
        name: `Load Characteristic`,
        unit: ``
      },
      0x4042: {
        name: `Power Demand`,
        unit: `kW`
      },
      0x4044: {
        name: `Reactive Power Demand`,
        unit: `kVA`
      },
      0x4046: {
        name: `Apparent Power Demand`,
        unit: `kvar`
      },
      0x4600: {
        name: `Phase A Current Demand`,
        unit: `A`
      },
      0x4602: {
        name: `Phase B Current Demand`,
        unit: `A`
      },
      0x4604: {
        name: `Phase C Current Demand`,
        unit: `A`
      }
    }
  }
};

module.exports = config;
