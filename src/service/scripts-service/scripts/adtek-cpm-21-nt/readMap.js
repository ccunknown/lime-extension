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
      0x0000: {
        name: `ac.frequency`,
        unit: `hertz`,
        translator: `function.bufferToUint32Div100`
      },
      0x0002: {
        name: `ac.averagePhaseVoltage`,
        unit: `volt`,
        translator: `function.bufferToUint32Div10`
      },
      0x0004: {
        name: `ac.averageLineVoltage`,
        unit: `volt`,
        translator: `function.bufferToUint32Div10`
      },
      0x0006: {
        name: `ac.averageCurrent`,
        unit: `ampere`,
        translator: `function.bufferToUint32Div1000`
      },
      0x0008: {
        name: `ac.current.N`,
        unit: `ampere`,
        translator: `function.bufferToUint32Div1000`
      },
      0x000A: {
        name: `ac.totalActivePower`,
        unit: `watt`,
        translator: `function.bufferToUint32`
      },
      0x000C: {
        name: `ac.totalReactivePower`,
        unit: `volt-ampere-reactive`,
        translator: `function.bufferToUint32`
      },
      0x000E: {
        name: `ac.totalApparentPower`,
        unit: `volt-ampere`,
        translator: `function.bufferToUint32`
      },
      0x0010: {
        name: `ac.totalPowerFactor`,
        translator: `function.bufferToUint32Div1000`
      },
      0x0012: {
        name: `ac.totalActiveEnergy.import`,
        unit: `kilowatt hour`,
        translator: `function.bufferToUint32Div10`
      },
      0x0014: {
        name: `ac.totalReactiveEnergy.export`,
        unit: `volt-ampere-reactive`,
        translator: `function.bufferToUint32Mul100`
      },
      0x001A: {
        name: `ac.phaseVoltage.L1`,
        unit: `volt`,
        translator: `function.bufferToUint32Div10`
      },
      0x001C: {
        name: `ac.phaseVoltage.L2`,
        unit: `volt`,
        translator: `function.bufferToUint32Div10`
      },
      0x001E: {
        name: `ac.phaseVoltage.L3`,
        unit: `volt`,
        translator: `function.bufferToUint32Div10`
      },
      0x0020: {
        name: `ac.phaseToPhaseVoltage.L12`,
        unit: `volt`,
        translator: `function.bufferToUint32Div10`
      },
      0x0022: {
        name: `ac.phaseToPhaseVoltage.L23`,
        unit: `volt`,
        translator: `function.bufferToUint32Div10`
      },
      0x0024: {
        name: `ac.phaseToPhaseVoltage.L31`,
        unit: `volt`,
        translator: `function.bufferToUint32Div10`
      },
      0x0026: {
        name: `ac.current.L1`,
        unit: `ampere`,
        translator: `function.bufferToUint32Div1000`
      },
      0x0028: {
        name: `ac.current.L2`,
        unit: `ampere`,
        translator: `function.bufferToUint32Div1000`
      },
      0x002A: {
        name: `ac.current.L3`,
        unit: `ampere`,
        translator: `function.bufferToUint32Div1000`
      },
      0x002c: {
        name: `ac.activePower.L1`,
        unit: `watt`
      },
      0x002e: {
        name: `ac.activePower.L2`,
        unit: `watt`
      },
      0x0030: {
        name: `ac.activePower.L3`,
        unit: `watt`
      },
      0x0032: {
        name: `ac.reactivePower.L1`,
        unit: `volts-ampere-reactive`,
        translator: `function.bufferToUint32`
      },
      0x0034: {
        name: `ac.reactivePower.L2`,
        unit: `volts-ampere-reactive`,
        translator: `function.bufferToUint32`
      },
      0x0036: {
        name: `ac.reactivePower.L3`,
        unit: `volts-ampere-reactive`,
        translator: `function.bufferToUint32`
      },
      0x0038: {
        name: `ac.apparentPower.L1`,
        unit: `volts-ampere`
      },
      0x003a: {
        name: `ac.apparentPower.L2`,
        unit: `volts-ampere`
      },
      0x003c: {
        name: `ac.apparentPower.L3`,
        unit: `volts-ampere`
      },
      0x003E: {
        name: `ac.powerFactor.L1`,
        translator: `function.bufferToUint32Div1000`
      },
      0x0040: {
        name: `ac.powerFactor.L2`,
        translator: `function.bufferToUint32Div1000`
      },
      0x0042: {
        name: `ac.powerFactor.L3`,
        translator: `function.bufferToUint32Div1000`
      },
      0x0045: {
        name: `ac.thdVoltage.L1`,
        translator: `function.bufferToUint32Div10`
      },
      0x0046: {
        name: `ac.thdVoltage.L2`,
        translator: `function.bufferToUint32Div10`
      },
      0x0047: {
        name: `ac.thdVoltage.L3`,
        translator: `function.bufferToUint32Div10`
      },
      0x0049: {
        name: `ac.thdCurrent.L1`,
        translator: `function.bufferToUint32Div10`
      },
      0x004A: {
        name: `ac.thdCurrent.L2`,
        translator: `function.bufferToUint32Div10`
      },
      0x004B: {
        name: `ac.thdCurrent.L3`,
        translator: `function.bufferToUint32Div10`
      }
    }
  }
};

module.exports = config;
