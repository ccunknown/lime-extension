const config = {
  map: {
    define: {
      registerSpec: {
        default: {
          size: 16,
          number: 2,
        },
        oneWord: {
          size: 16,
          number: 1,
        },
        fourWords: {
          size: 16,
          number: 4,
        },
      },
      translator: {
        default: `function.bufferToUint32Div100`,
      },
      type: {
        default: `number`,
        string: `string`,
      }
    },
    coils: {},
    contacts: {},
    inputRegisters: {},
    holdingRegisters: {
      0x0002: {
        name: `ac.phaseVoltage.L1`,
        unit: `volt`,
      },
      0x0004: {
        name: `ac.phaseVoltage.L2`,
        unit: `volt`,
      },
      0x0006: {
        name: `ac.phaseVoltage.L3`,
        unit: `volt`,
      },
      0x0008: {
        name: `ac.current.L1`,
        unit: `ampere`,
        translator: `function.bufferToUint32Div10000`,
      },
      0x000a: {
        name: `ac.current.L2`,
        unit: `ampere`,
        translator: `function.bufferToUint32Div10000`,
      },
      0x000c: {
        name: `ac.current.L3`,
        unit: `ampere`,
        translator: `function.bufferToUint32Div10000`,
      },
      0x000e: {
        name: `ac.phaseToPhaseVoltage.L12`,
        unit: `volt`,
      },
      0x0010: {
        name: `ac.phaseToPhaseVoltage.L23`,
        unit: `volt`,
      },
      0x0012: {
        name: `ac.phaseToPhaseVoltage.L31`,
        unit: `volt`,
      },
      0x0014: {
        name: `ac.activePower.L1`,
        unit: `watt`,
        translator: `function.bufferToInt32Div100`,
      },
      0x0016: {
        name: `ac.activePower.L2`,
        unit: `watt`,
        translator: `function.bufferToInt32Div100`,
      },
      0x0018: {
        name: `ac.activePower.L3`,
        unit: `watt`,
        translator: `function.bufferToInt32Div100`,
      },
      0x001a: {
        name: `ac.reactivePower.L1`,
        unit: `volts-ampere-reactive`,
        translator: `function.bufferToInt32Div100`,
      },
      0x001c: {
        name: `ac.reactivePower.L2`,
        unit: `volts-ampere-reactive`,
        translator: `function.bufferToInt32Div100`,
      },
      0x001e: {
        name: `ac.reactivePower.L3`,
        unit: `volts-ampere-reactive`,
        translator: `function.bufferToInt32Div100`,
      },
      0x0020: {
        name: `ac.apparentPower.L1`,
        unit: `volts-ampere`,
      },
      0x0022: {
        name: `ac.apparentPower.L2`,
        unit: `volts-ampere`,
      },
      0x0024: {
        name: `ac.apparentPower.L3`,
        unit: `volts-ampere`,
      },
      0x0026: {
        name: `ac.powerFactor.L1`,
        translator: `function.bufferToInt32Div10000`,
      },
      0x0028: {
        name: `ac.powerFactor.L2`,
        translator: `function.bufferToInt32Div10000`,
      },
      0x002a: {
        name: `ac.powerFactor.L3`,
        translator: `function.bufferToInt32Div10000`,
      },
      0x0032: {
        name: `ac.frequency`,
        unit: `Hertz`,
        translator: `function.bufferToInt32Div1000`,
      },
      0x003a: {
        name: `ac.totalActivePower`,
        unit: `watt`,
        translator: `function.bufferToInt32Div100`,
      },
      0x003c: {
        name: `ac.totalReactivePower`,
        unit: `volts-ampere-reactive`,
        translator: `function.bufferToInt32Div100`,
      },
      0x003e: {
        name: `ac.totalApparentPower`,
        unit: `volts-ampere`,
      },
      0x0040: {
        name: `ac.totalPowerFactor`,
        translator: `function.bufferToInt32Div10000`,
      },
      0x0054: {
        name: `ac.thdVoltage.L1`,
        unit: `percent`,
      },
      0x0056: {
        name: `ac.thdVoltage.L2`,
        unit: `percent`,
      },
      0x0058: {
        name: `ac.thdVoltage.L3`,
        unit: `percent`,
      },
      0x005a: {
        name: `ac.thdCurrent.L1`,
        unit: `percent`,
      },
      0x005c: {
        name: `ac.thdCurrent.L2`,
        unit: `percent`,
      },
      0x005e: {
        name: `ac.thdCurrent.L3`,
        unit: `percent`,
      },
      0x1b1f: {
        name: `ac.totalActiveEnergy.import`,
        unit: `kilowatt-ampere hour`,
        registerSpec: `fourWords`,
        translator: `function.bufferToUint64Div1000`,
      },
      0x1b23: {
        name: `ac.totalActiveEnergy.export`,
        unit: `kilowatt-ampere hour`,
        registerSpec: `fourWords`,
        translator: `function.bufferToUint64Div1000`,
      },
      0x1b27: {
        name: `ac.totalReactiveEnergy.import`,
        unit: `kilovolt-ampere-reactive hour`,
        registerSpec: `fourWords`,
        translator: `function.bufferToUint64Div1000`,
      },
      0x1b2b: {
        name: `ac.totalReactiveEnergy.export`,
        unit: `kilovolt-ampere-reactive hour`,
        registerSpec: `fourWords`,
        translator: `function.bufferToUint64Div1000`,
      },
      0x1b2f: {
        name: `ac.totalApparentEnergy`,
        unit: `kilovolt-ampere hour`,
        registerSpec: `fourWords`,
        translator: `function.bufferToUint64Div1000`,
      },
    //   0x1b20: {
    //     name: `ac.totalActiveEnergy.import`,
    //     unit: `kilowatt-ampere hour`,
    //     registerSpec: `fourWords`,
    //     translator: `function.bufferToUint64Div1000`,
    //   },
    //   0x1b24: {
    //     name: `ac.totalActiveEnergy.export`,
    //     unit: `kilowatt-ampere hour`,
    //     registerSpec: `fourWords`,
    //     translator: `function.bufferToUint64Div1000`,
    //   },
    //   0x1b28: {
    //     name: `ac.totalReactiveEnergy.import`,
    //     unit: `kilovolt-ampere-reactive hour`,
    //     registerSpec: `fourWords`,
    //     translator: `function.bufferToUint64Div1000`,
    //   },
    //   0x1b2c: {
    //     name: `ac.totalReactiveEnergy.export`,
    //     unit: `kilovolt-ampere-reactive hour`,
    //     registerSpec: `fourWords`,
    //     translator: `function.bufferToUint64Div1000`,
    //   },
    //   0x1b30: {
    //     name: `ac.totalApparentEnergy`,
    //     unit: `kilovolt-ampere hour`,
    //     registerSpec: `fourWords`,
    //     translator: `function.bufferToUint64Div1000`,
    //   },
    },
  },
};

module.exports = config;
