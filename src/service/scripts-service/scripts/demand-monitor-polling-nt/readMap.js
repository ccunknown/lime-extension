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

      110: {
        name: `ac.phaseVoltage.L1`,
        unit: `volt`
      },
      112: {
        name: `ac.phaseVoltage.L2`,
        unit: `volt`
      },
      114: {
        name: `ac.phaseVoltage.L3`,
        unit: `volt`
      },
      116: {
        name: `ac.phaseToPhaseVoltage.L12`,
        unit: `volt`
      },
      118: {
        name: `ac.phaseToPhaseVoltage.L23`,
        unit: `volt`
      },
      120: {
        name: `ac.phaseToPhaseVoltage.L31`,
        unit: `volt`
      },
      
      122: {
        name: `ac.current.L1`,
        unit: `ampere`
      },
      124: {
        name: `ac.current.L2`,
        unit: `ampere`
      },
      126: {
        name: `ac.current.L3`,
        unit: `ampere`
      },
      128: {
        name: `ac.current.N`,
        unit: `ampere`
      },
      
      130: {
        name: `ac.powerFactor.L1`
      },
      132: {
        name: `ac.powerFactor.L2`
      },
      134: {
        name: `ac.powerFactor.L3`
      },
      136: {
        name: `ac.totalPowerFactor`
      },

      138: {
        name: `ac.frequency`,
        unit: `hertz`
      },
      
      140: {
        name: `ac.activePower.L1`,
        unit: `watt`
      },
      142: {
        name: `ac.activePower.L2`,
        unit: `watt`
      },
      144: {
        name: `ac.activePower.L3`,
        unit: `watt`
      },
      146: {
        name: `ac.totalActivePower`,
        unit: `watt`
      },
      
      148: {
        name: `ac.totalReactivePower`,
        unit: `volt-ampere-reactive`
      },

      150: {
        name: `ac.totalApparentPower`,
        unit: `volt-ampere`
      },

      152: {
        name: `ac.thdVoltage.L1`
      },
      154: {
        name: `ac.thdVoltage.L2`
      },
      156: {
        name: `ac.thdVoltage.L3`
      },
      
      158: {
        name: `ac.thdCurrent.L1`
      },
      160: {
        name: `ac.thdCurrent.L2`
      },
      162: {
        name: `ac.thdCurrent.L3`
      },

      164: {
        name: `ac.totalActiveEnergy.import`,
        unit: `kilowatt hour`,
        registerSpec: `fourWords`,
        translator: `function.bufferToFloat64`
      },
      168: {
        name: `ac.totalReactiveEnergy.import`,
        unit: `kilovolt-ampere-reactive hour`,
        registerSpec: `fourWords`,
        translator: `function.bufferToFloat64`
      },
      172: {
        name: `ac.totalApparentEnergy.import`,
        unit: `kilovolt-ampere hour`,
        registerSpec: `fourWords`,
        translator: `function.bufferToFloat64`
      },
      176: {
        name: `ac.totalActiveEnergy.export`,
        unit: `kilowatt hour`,
        registerSpec: `fourWords`,
        translator: `function.bufferToFloat64`
      }
    }
  }
};

module.exports = config;
