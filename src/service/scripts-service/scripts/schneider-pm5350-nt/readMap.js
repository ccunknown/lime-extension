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
      2999:	{
        name: 'ac.current.L1',
        unit: 'ampere'
      },
      3001:	{
        name: 'ac.current.L2',
        unit: 'ampere'
      },
      3003:	{
        name: 'ac.current.L3',
        unit: 'ampere'
      },
      3005:	{
        name: 'ac.current.N',
        unit: 'ampere'
      },
      3019:	{
        name: 'ac.phaseToPhaseVoltage.L12',
        unit: 'volt'
      },
      3021:	{
        name: 'ac.phaseToPhaseVoltage.L23',
        unit: 'volt'
      },
      3023:	{
        name: 'ac.phaseToPhaseVoltage.L31',
        unit: 'volt'
      },
      3027:	{
        name: 'ac.phaseVoltage.L1',
        unit: 'volt'
      },
      3029:	{
        name: 'ac.phaseVoltage.L2',
        unit: 'volt'
      },
      3031:	{
        name: 'ac.phaseVoltage.L3',
        unit: 'volt'
      },
      3053:	{
        name: 'ac.activePower.L1',
        unit: 'watt'
      },
      3055:	{
        name: 'ac.activePower.L2',
        unit: 'watt'
      },
      3057:	{
        name: 'ac.activePower.L3',
        unit: 'watt'
      },
      3059:	{
        name: 'ac.totalActivePower',
        unit: 'watt'
      },
      3061:	{
        name: 'ac.reactivePower.L1',
        unit: 'volts-ampere-reactive'
      },
      3063:	{
        name: 'ac.reactivePower.L2',
        unit: 'volts-ampere-reactive'
      },
      3065:	{
        name: 'ac.reactivePower.L3',
        unit: 'volts-ampere-reactive'
      },
      3067:	{
        name: 'ac.totalReactivePower',
        unit: 'volts-ampere-reactive'
      },
      3069:	{
        name: 'ac.apparentPower.L1',
        unit: 'volts-ampere'
      },
      3071:	{
        name: 'ac.apparentPower.L2',
        unit: 'volts-ampere'
      },
      3073:	{
        name: 'ac.apparentPower.L3',
        unit: 'volts-ampere'
      },
      3075:	{
        name: 'ac.totalApparentPower',
        unit: 'volts-ampere'
      },
      3077:	{
        name: 'ac.powerFactor.L1',
        translator: `function.pfValueFrom4QSchneider`
      },
      3079:	{
        name: 'ac.powerFactor.L2',
        translator: `function.pfValueFrom4QSchneider`
      },
      3081:	{
        name: 'ac.powerFactor.L3',
        translator: `function.pfValueFrom4QSchneider`
      },
      3083:	{
        name: 'ac.totalPowerFactor',
        translator: `function.pfValueFrom4QSchneider`
      },
      3109:	{
        name: 'ac.frequency',
        unit: 'hertz'
      },
      3203:	{
        name: 'ac.totalActiveEnergy.import',
        unit: 'kilovolt-ampere hour',
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: `fourWords`
      },
      3207:	{
        name: 'ac.totalActiveEnergy.export',
        unit: 'kilovolt-ampere hour',
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: `fourWords`
      },
      3219:	{
        name: 'ac.totalReactiveEnergy.import',
        unit: 'kilovolt-ampere-reactive hour',
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: `fourWords`
      },
      3223:	{
        name: 'ac.totalReactiveEnergy.export',
        unit: 'kilovolt-ampere-reactive hour',
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: `fourWords`
      },
      3235:	{
        name: 'ac.totalApparentEnergy.import',
        unit: 'kilovolt-ampere hour',
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: `fourWords`
      },
      3239:	{
        name: 'ac.totalApparentEnergy.export',
        unit: 'kilovolt-ampere hour',
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: `fourWords`
      },
      3517:	{
        name: 'ac.activeEnergy.L1.import',
        unit: 'kilovolt-ampere hour',
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: `fourWords`
      },
      3521:	{
        name: 'ac.activeEnergy.L2.import',
        unit: 'kilovolt-ampere hour',
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: `fourWords`
      },
      3525:	{
        name: 'ac.activeEnergy.L3.import',
        unit: 'kilovolt-ampere hour',
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: `fourWords`
      },
      3537:	{
        name: 'ac.reactiveEnergy.L3.import',
        unit: 'kilovolt-ampere-reactive hour',
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: `fourWords`
      },
      3529:	{
        name: 'ac.reactiveEnergy.L1.import',
        unit: 'kilovolt-ampere-reactive hour',
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: `fourWords`
      },
      3533:	{
        name: 'ac.reactiveEnergy.L2.import',
        unit: 'kilovolt-ampere-reactive hour',
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: `fourWords`
      },
      3541:	{
        name: 'ac.apparentEnergy.L1.import',
        unit: 'kilovolt-ampere hour',
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: `fourWords`
      },
      3545:	{
        name: 'ac.apparentEnergy.L2.import',
        unit: 'kilovolt-ampere hour',
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: `fourWords`
      },
      3549:	{
        name: 'ac.apparentEnergy.L3.import',
        unit: 'kilovolt-ampere hour',
        translator: `function.bufferToBigUint64Div1000`,
        registerSpec: `fourWords`
      },
      27359: {
        name: '	ac.thdVoltage.L1'
      },
      27361: {
        name: '	ac.thdVoltage.L2'
      },
      27363: {
        name: '	ac.thdVoltage.L3'
      },
      27377: {
        name: '	ac.thdCurrent.L1'
      },
      27379: {
        name: '	ac.thdCurrent.L2'
      },
      27381: {
        name: '	ac.thdCurrent.L3'
      }      
    }
  }
};

module.exports = config;
