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
      0x00DC: {
        name: `ac.activeEnergy.L1.export`,
        unit: `kilowatt hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x00C8: {
        name: `ac.activeEnergy.L1.import`,
        unit: `kilowatt hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x00E0: {
        name: `ac.activeEnergy.L2.export`,
        unit: `kilowatt hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x00CC: {
        name: `ac.activeEnergy.L2.import`,
        unit: `kilowatt hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x00E4: {
        name: `ac.activeEnergy.L3.export`,
        unit: `kilowatt hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x00D0: {
        name: `ac.activeEnergy.L3.import`,
        unit: `kilowatt hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x00E8: {
        name: `ac.activeEnergy.L4.export`,
        unit: `kilowatt hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x00D4: {
        name: `ac.activeEnergy.L4.import`,
        unit: `kilowatt hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x0104: {
        name: `ac.apparentEnergy.L1.export`,
        unit: `kilovolt-ampere-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x00F0: {
        name: `ac.apparentEnergy.L1.import`,
        unit: `kilovolt-ampere-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x0108: {
        name: `ac.apparentEnergy.L2.export`,
        unit: `kilovolt-ampere-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x00F4: {
        name: `ac.apparentEnergy.L2.import`,
        unit: `kilovolt-ampere-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x010C: {
        name: `ac.apparentEnergy.L3.export`,
        unit: `kilovolt-ampere-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x00F8: {
        name: `ac.apparentEnergy.L3.import`,
        unit: `kilovolt-ampere-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x0110: {
        name: `ac.apparentEnergy.L4.export`,
        unit: `kilovolt-ampere-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x00FC: {
        name: `ac.apparentEnergy.L4.import`,
        unit: `kilovolt-ampere-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x000E: {
        name: `ac.current.L1`,
        unit: `ampere`,
        translator: `function.bufferToUint32Div1000`
      },
      0x0010: {
        name: `ac.current.L2`,
        unit: `ampere`,
        translator: `function.bufferToUint32Div1000`
      },
      0x0012: {
        name: `ac.current.L3`,
        unit: `ampere`,
        translator: `function.bufferToUint32Div1000`
      },
      0x0014: {
        name: `ac.current.L4`,
        unit: `ampere`,
        translator: `function.bufferToUint32Div1000`
      },
      0x0016: {
        name: `ac.current.N`,
        unit: `ampere`,
        translator: `function.bufferToUint32Div1000`
      },
      0x0018: {
        name: `ac.frequency`,
        unit: `hertz`,
        translator: `function.bufferToUint32Div100`
      },
      0x0008: {
        name: `ac.phaseToPhaseVoltage.L12`,
        unit: `volt`,
        translator: `function.bufferToUint32Div10`
      },
      0x000A: {
        name: `ac.phaseToPhaseVoltage.L23`,
        unit: `volt`,	
        translator: `function.bufferToUint32Div10`
      },
      0x000C: {
        name: `ac.phaseToPhaseVoltage.L31`,
        unit: `volt`,
        translator: `function.bufferToUint32Div10`
      },
      0x0000: {
        name: `ac.phaseVoltage.L1`,
        unit: `volt`,
        translator: `function.bufferToUint32Div10`
      },
      0x0002: {
        name: `ac.phaseVoltage.L2`,
        unit: `volt`,
        translator: `function.bufferToUint32Div10`
      },
      0x0004: {
        name: `ac.phaseVoltage.L3`,
        unit: `volt`,
        translator: `function.bufferToUint32Div10`
      },
      0x0006: {
        name: `ac.phaseVoltage.L4`,
        unit: `volt`,
        translator: `function.bufferToUint32Div10`
      },
      0x0048: {
        name: `ac.powerFactor.L1`,
        translator: `function.bufferToUint32Div1000`
      },
      0x004A: {
        name: `ac.powerFactor.L2`,	
        translator: `function.bufferToUint32Div1000`
      },
      0x004C: {
        name: `ac.powerFactor.L3`,	
        translator: `function.bufferToUint32Div1000`
      },
      0x004E: {
        name: `ac.powerFactor.L4`,	
        translator: `function.bufferToUint32Div1000`
      },
      0x012C: {
        name: `ac.reactiveEnergy.L1.export`,
        unit: `kilovolt-ampere-reactive-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x0118: {
        name: `ac.reactiveEnergy.L1.import`,
        unit: `kilovolt-ampere-reactive-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x0130: {
        name: `ac.reactiveEnergy.L2.export`,
        unit: `kilovolt-ampere-reactive-hourreactiveEnergy`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x011C: {
        name: `ac.reactiveEnergy.L2.import`,
        unit: `kilovolt-ampere-reactive-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x0134: {
        name: `ac.reactiveEnergy.L3.export`,
        unit: `kilovolt-ampere-reactive-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x0120: {
        name: `ac.reactiveEnergy.L3.import`,
        unit: `kilovolt-ampere-reactive-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x0138: {
        name: `ac.reactiveEnergy.L4.export`,
        unit: `kilovolt-ampere-reactive-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x0124: {
        name: `ac.reactiveEnergy.L4.import`,
        unit: `kilovolt-ampere-reactive-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x001A: {
        name: `ac.activePower.L1`,
        unit: `watt`,
        translator: `function.bufferToFloat32`
      },
      0x001C: {
        name: `ac.activePower.L2`,
        unit: `watt`,
        translator: `function.bufferToFloat32`
      },
      0x001E: {
        name: `ac.activePower.L3`,
        unit: `watt`,
        translator: `function.bufferToFloat32`
      },
      0x0020: {
        name: `ac.activePower.L4`,
        unit: `watt`,
        translator: `function.bufferToFloat32`
      },
      0x003A: {
        name: `ac.apperantPower.L1`,
        unit: `volts-ampere`,
        translator: `function.bufferToFloat32`
      },
      0x003C: {
        name: `ac.apperantPower.L2`,
        unit: `volts-ampere`,
        translator: `function.bufferToFloat32`
      },
      0x003E: {
        name: `ac.apperantPower.L3`,
        unit: `volts-ampere`,
        translator: `function.bufferToFloat32`
      },
      0x0040: {
        name: `ac.apperantPower.L4`,
        unit: `volts-ampere`,
        translator: `function.bufferToFloat32`
      },
      0x0028: {
        name: `ac.reactivePower.L1`,
        unit: `volts-ampere-reactive`,
        translator: `function.bufferToFloat32`
      },
      0x002A: {
        name: `ac.reactivePower.L2`,
        unit: `volts-ampere-reactive`,
        translator: `function.bufferToFloat32`
      },
      0x002C: {
        name: `ac.reactivePower.L3`,
        unit: `volts-ampere-reactive`,
        translator: `function.bufferToFloat32`
      },
      0x002E: {
        name: `ac.reactivePower.L4`,
        unit: `volts-ampere-reactive`,
        translator: `function.bufferToFloat32`
      },
      0x07DE: {
        name: `ac.thdCurrent.L1`,
        translator: `function.bufferToUint32Div10`
      },
      0x07E0: {
        name: `ac.thdCurrent.L2`,
        translator: `function.bufferToUint32Div10`
      },
      0x07E2: {
        name: `ac.thdCurrent.L3`,	
        translator: `function.bufferToUint32Div10`
      },
      0x07D6: {
        name: `ac.thdVoltage.L1`,	
        translator: `function.bufferToUint32Div10`
      },
      0x07D8: {
        name: `ac.thdVoltage.L2`,	
        translator: `function.bufferToUint32Div10`
      },
      0x07DA: {
        name: `ac.thdVoltage.L3`,	
        translator: `function.bufferToUint32Div10`
      },
      0x00EC: {
        name: `ac.totalActiveEnergy.export`,
        unit: `kilowatt hour`,
        translator: `function.bufferToUint32Div1000`
      },
      0x00D8: {
        name: `ac.totalActiveEnergy.import`,
        unit: `kilowatt hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x0026: {
        name: `ac.totalActivePower`,
        unit: `watt`,
        translator: `function.bufferToFloat32`
      },
      0x0114: {
        name: `ac.totalApparentEnergy.export`,
        unit: `kilovolt-ampere-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x0100: {
        name: `ac.totalApparentEnergy.import`,
        unit: `kilovolt-ampere-hour`,
        translator: `function.bufferToUint32`
      },
      0x0046: {
        name: `ac.totalApparentPower`,
        unit: `volt-ampere`,
        translator: `function.bufferToFloat32`
      },
      0x0050: {
        name: `ac.totalPowerFactor`,	
        translator: `function.bufferToUint32Div1000`
      },
      0x013C: {
        name: `ac.totalReactiveEnergy.export`,
        unit: `kilovolt-ampere-reactive-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x0128: {
        name: `ac.totalReactiveEnergy.import`,
        unit: `kilovolt-ampere-reactive-hour`,
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      0x0038: {
        name: `ac.totalReactivePower`,
        unit: `volt-ampere-reactive`,
        translator: `function.bufferToFloat32`
      }
    }
  }
};

module.exports = config;