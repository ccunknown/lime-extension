const config = {
  map: {
    define: {
      registerSpec: {
        default: {
          size: 16,
          number: 1
        },
        twoWord: {
          size: 16,
          number: 2
        },
        fourWords: {
          size: 16,
          number: 4
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
    inputRegisters: {},
    holdingRegisters: {
      0: {
        name: `ac.phaseVoltage.L1`,
        unit: `volt`,
      },
      1: {
        name: `ac.phaseVoltage.L2`,
        unit: `volt`,
      },
      2: {
        name: `ac.phaseVoltage.L3`,
        unit: `volt`,
      },
      3: {
        name: `ac.phaseToPhaseVoltage.L12`,
        unit: `volt`,
      },
      4: {
        name: `ac.phaseToPhaseVoltage.L23`,
        unit: `volt`,
      },
      5: {
        name: `ac.phaseToPhaseVoltage.L31`,
        unit: `volt`,
      },
      6: {
        name: `ac.current.L1`,
        unit: `ampere`,
        translator: `function.bufferToUint16Mul04`,
      },
      7: {
        name: `ac.current.L2`,
        unit: `ampere`,
        translator: `function.bufferToUint16Mul04`,
      },
      8: {
        name: `ac.current.L3`,
        unit: `ampere`,
        translator: `function.bufferToUint16Mul04`,
      },
      9: {
        name: `ac.current.N`,
        unit: `ampere`,
        translator: `function.bufferToUint16Mul04`,
      },
      10: {
        name: `ac.totalActivePower`,
        unit: `watt`,
        translator: `function.bufferToUint32Div10`,
        registerSpec: `twoWord`,
      },
      12: {
        name: `ac.totalReactivePower`,
        unit: `volts-ampere`,
        translator: `function.bufferToUint32Div10`,
        registerSpec: `twoWord`,
      },
      14: {
        name: `ac.totalApparentPower`,
        unit: `volts-ampere`,
        translator: `function.bufferToUint32Div10`,
        registerSpec: `twoWord`,
      },
      16: {
        name: `ac.totalPowerFactor`,
        translator: `function.bufferToInt16Div1000`,
      },
      17: {
        name: `ac.frequency`,
        unit: `hertz`,
      },
      18: {
        name: `ac.totalActiveEnergy.import`,
        unit: `kilowatt-hour`,
        registerSpec: `twoWord`,
        translator: `function.bufferToUint32Div10`,
      },
      20: {
        name: `ac.totalReactiveEnergy`,
        unit: `kilovolts-ampere-reactive`,
        registerSpec: `twoWord`,
        translator: `function.bufferToUint32Div10`,
      },
      24: {
        name: `ac.totalActiveEnergy.export`,
        unit: `kilowatt-hour`,
        registerSpec: `twoWord`,
        translator: `function.bufferToUint32Div10`,
      },
      28: {
        name: `ac.thdVoltage.L1`,
      },
      29: {
        name: `ac.thdVoltage.L2`,
      },
      30: {
        name: `ac.thdVoltage.L3`,
      },
      31: {
        name: `ac.thdCurrent.L1`,
      },
      32: {
        name: `ac.thdCurrent.L2`,
      },
      33: {
        name: `ac.thdCurrent.L3`,
      },
    },
  },
};

module.exports = config;
