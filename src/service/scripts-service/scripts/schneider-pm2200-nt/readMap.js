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
      2999:	{
        name: 'ac.current.L1',
        unit: 'ampere',
        translator: 'function.bufferToFloat32'
      },
      3001:	{
        name: 'ac.current.L2',
        unit: 'ampere',
        translator: 'function.bufferToFloat32'
      },
      3003:	{
        name: 'ac.current.L3',
        unit: 'ampere',
        translator: 'function.bufferToFloat32'
      },
      3005:	{
        name: 'ac.current.N',
        unit: 'ampere',
        translator: 'function.bufferToFloat32'
      },
      3019:	{
        name: 'ac.phaseToPhaseVoltage.L12',
        unit: 'volt',
        translator: 'function.bufferToFloat32'
      },
      3021:	{
        name: 'ac.phaseToPhaseVoltage.L23',
        unit: 'volt',
        translator: 'function.bufferToFloat32'
      },
      3023:	{
        name: 'ac.phaseToPhaseVoltage.L31',
        unit: 'volt',
        translator: 'function.bufferToFloat32'
      },
      3027:	{
        name: 'ac.phaseVoltage.L1',
        unit: 'volt',
        translator: 'function.bufferToFloat32'
      },
      3029:	{
        name: 'ac.phaseVoltage.L2',
        unit: 'volt',
        translator: 'function.bufferToFloat32'
      },
      3031:	{
        name: 'ac.phaseVoltage.L3',
        unit: 'volt',
        translator: 'function.bufferToFloat32'
      },
      3053:	{
        name: 'ac.activePower.L1',
        unit: 'watt',
        translator: 'function.bufferToFloat32'
      },
      3055:	{
        name: 'ac.activePower.L2',
        unit: 'watt',
        translator: 'function.bufferToFloat32'
      },
      3057:	{
        name: 'ac.activePower.L3',
        unit: 'watt',
        translator: 'function.bufferToFloat32'
      },
      3059:	{
        name: 'ac.totalActivePower',
        unit: 'watt',
        translator: 'function.bufferToFloat32'
      },
      3061:	{
        name: 'ac.reactivePower.L1',
        unit: 'volt-ampere-reactive',
        translator: 'function.bufferToFloat32'
      },
      3063:	{
        name: 'ac.reactivePower.L2',
        unit: 'volt-ampere-reactive',
        translator: 'function.bufferToFloat32'
      },
      3065:	{
        name: 'ac.reactivePower.L3',
        unit: 'volt-ampere-reactive',
        translator: 'function.bufferToFloat32'
      },
      3067:	{
        name: 'ac.totalReactivePower',
        unit: 'volt-ampere-reactive',
        translator: 'function.bufferToFloat32'
      },
      3069:	{
        name: 'ac.apparentPower.L1',
        unit: 'volt-ampere',
        translator: 'function.bufferToFloat32'
      },
      3071:	{
        name: 'ac.apparentPower.L2',
        unit: 'volt-ampere',
        translator: 'function.bufferToFloat32'
      },
      3073:	{
        name: 'ac.apparentPower.L3',
        unit: 'volt-ampere',
        translator: 'function.bufferToFloat32'
      },
      3075:	{
        name: 'ac.totalApparentPower',
        unit: 'volt-ampere',
        translator: 'function.bufferToFloat32'
      },
      3077:	{
        name: 'ac.powerFactor.L1',
        translator: 'function.bufferToFloat32'
      },
      3079:	{
        name: 'ac.powerFactor.L2',
        translator: 'function.bufferToFloat32'
      },
      3081:	{
        name: 'ac.powerFactor.L3',
        translator: 'function.bufferToFloat32'
      },
      3083:	{
        name: 'ac.totalPowerFactor',
        translator: 'function.bufferToFloat32'
      },
      3109:	{
        name: 'ac.frequency',
        unit: 'hertz',
        translator: 'function.bufferToFloat32'
      },
      2699:	{
        name: 'ac.totalActiveEnergy.import',
        unit: 'kilowatt hour',
        translator: 'function.bufferToFloat32',
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      2701:	{
        name: 'ac.totalActiveEnergy.export',
        unit: 'kilowatt hour',
        translator: 'function.bufferToFloat32',
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      2707:	{
        name: 'ac.totalReactiveEnergy.import',
        unit: 'kilovolt-ampere-reactive-hour',
        translator: 'function.bufferToFloat32',
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      2709:	{
        name: 'ac.totalReactiveEnergy.export',
        unit: 'kilovolt-ampere-reactive-hour',
        translator: 'function.bufferToFloat32',
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      2715:	{
        name: 'ac.totalApparentEnergy.import',
        unit: 'kilovolt-ampere-hour',
        translator: 'function.bufferToFloat32',
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      2717:	{
        name: 'ac.totalApparentEnergy.export',
        unit: 'kilovolt-ampere-hour',
        translator: 'function.bufferToFloat32',
        registerSpec: {
          size: 16,
          number: 4
        }
      },
      21299:	{
        name: 'ac.thdCurrent.L1',
        translator: 'function.bufferToFloat32'
      },
      21301:	{
        name: 'ac.thdCurrent.L2',
        translator: 'function.bufferToFloat32'
      },
      21303:	{
        name: 'ac.thdCurrent.L3',
        translator: 'function.bufferToFloat32'
      },
      21321:	{
        name: 'ac.thdVoltage.L1',
        translator: 'function.bufferToFloat32'
      },
      21323:	{
        name: 'ac.thdVoltage.L2',
        translator: 'function.bufferToFloat32'
      },
      21325:	{
        name: 'ac.thdVoltage.L3',
        translator: 'function.bufferToFloat32'
      }
    }
  }
};

module.exports = config;
