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
        default: `function.bufferToUint32Div100`
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
      50514:	{
        name: 'ac.phaseToPhaseVoltage.L12',
        unit: 'volt'
      },
      50516:	{
        name: 'ac.phaseToPhaseVoltage.L23',
        unit: 'volt'
      },
      50518:	{
        name: 'ac.phaseToPhaseVoltage.L31',
        unit: 'volt'
      },
      50520:	{
        name: 'ac.phaseVoltage.L1',
        unit: 'volt'
      },
      50522:	{
        name: 'ac.phaseVoltage.L2',
        unit: 'volt'
      },
      50524:	{
        name: 'ac.phaseVoltage.L3',
        unit: 'volt'
      },
      50526: {
        name: 'ac.frequency',
        unit: 'hertz'
      },
      50528: {
        name: 'ac.current.L1',
        unit: 'ampere',
        translator: `function.bufferToInt32Div1000`
      },
      50530: {
        name: 'ac.current.L2',
        unit: 'ampere',
        translator: `function.bufferToInt32Div1000`
      },
      50532: {
        name: 'ac.current.L3',
        unit: 'ampere',
        translator: `function.bufferToInt32Div1000`
      },
      50534: {
        name: 'ac.current.N',
        unit: 'ampere',
        translator: `function.bufferToInt32Div1000`
      },
      50536: {
        name: 'ac.totalActivePower',
        unit: 'watt',
        translator: `function.bufferToInt32Mul10`
      },
      50538: {
        name: 'ac.totalReactivePower',
        unit: 'volts-ampere-reactive',
        translator: `function.bufferToInt32Mul10`
      },
      50540: {
        name: 'ac.totalApparentPower',
        unit: 'volts-ampere',
        translator: `function.bufferToUint32Mul10`
      },
      50544:	{
        name: 'ac.activePower.L1',
        unit: 'watt',
        translator: `function.bufferToInt32Mul10`
      },
      50546:	{
        name: 'ac.activePower.L2',
        unit: 'watt',
        translator: `function.bufferToInt32Mul10`
      },
      50548:	{
        name: 'ac.activePower.L3',
        unit: 'watt',
        translator: `function.bufferToInt32Mul10`
      },
      50550:	{
        name: 'ac.reactivePower.L1',
        unit: 'volts-ampere-reactive',
        translator: `function.bufferToInt32Mul10`
      },
      50552:	{
        name: 'ac.reactivePower.L2',
        unit: 'volts-ampere-reactive',
        translator: `function.bufferToInt32Mul10`
      },
      50554:	{
        name: 'ac.reactivePower.L3',
        unit: 'volts-ampere-reactive',
        translator: `function.bufferToInt32Mul10`
      },
      50556:	{
        name: 'ac.apparentPower.L1',
        unit: 'volts-ampere',
        translator: `function.bufferToUint32Mul10`
      },
      50558:	{
        name: 'ac.apparentPower.L2',
        unit: 'volts-ampere',
        translator: `function.bufferToUint32Mul10`
      },
      50560:	{
        name: 'ac.apparentPower.L3',
        unit: 'volts-ampere',
        translator: `function.bufferToUint32Mul10`
      },
      50574: {
        name: 'ac.totalPowerFactor',
        translator: `function.bufferToInt32Div1000`
      },
      50576:	{
        name: 'ac.powerFactor.L1',
        translator: `function.bufferToInt32Div1000`
      },
      50578:	{
        name: 'ac.powerFactor.L2',
        translator: `function.bufferToInt32Div1000`
      },
      50580:	{
        name: 'ac.powerFactor.L3',
        translator: `function.bufferToInt32Div1000`
      },
      50780:	{
        name: 'ac.totalActiveEnergy.import',
        unit: 'kilovolt-ampere hour',
        translator: `function.bufferToUint32`
      },
      50782: {
        name: 'ac.totalReactiveEnergy.import',
        unit: 'kilovolt-ampere-reactive hour',
        translator: `function.bufferToUint32`
      },
      50784: {
        name: 'ac.totalApparentEnergy',
        unit: 'kilovolt-ampere hour',
        translator: `function.bufferToUint32`
      },
      50786:	{
        name: 'ac.totalActiveEnergy.export',
        unit: 'kilovolt-ampere hour',
        translator: `function.bufferToUint32`
      },
      50788:	{
        name: 'ac.totalReactiveEnergy.export',
        unit: 'kilovolt-ampere-reactive hour',
        translator: `function.bufferToUint32`
      },
      51539: {
        name: 'ac.thdVoltage.L1',
        registerSpec: `oneWord`,
        translator: `function.bufferToUint16Div10`
      },
      51540: {
        name: 'ac.thdVoltage.L2',
        registerSpec: `oneWord`,
        translator: `function.bufferToUint16Div10`
      },
      51541: {
        name: 'ac.thdVoltage.L3',
        registerSpec: `oneWord`,
        translator: `function.bufferToUint16Div10`
      },
      51542: {
        name: 'ac.thdCurrent.L1',
        registerSpec: `oneWord`,
        translator: `function.bufferToUint16Div10`
      },
      51543: {
        name: 'ac.thdCurrent.L2',
        registerSpec: `oneWord`,
        translator: `function.bufferToUint16Div10`
      },
      51544: {
        name: 'ac.thdCurrent.L3',
        registerSpec: `oneWord`,
        translator: `function.bufferToUint16Div10`
      }      
    }
  }
};

module.exports = config;
