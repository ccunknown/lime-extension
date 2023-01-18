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


      3928:	{
        name: 'ac.current.L1',
        unit: 'ampere'
      },
      3942:	{
        name: 'ac.current.L2',
        unit: 'ampere'
      },
      3956:	{
        name: 'ac.current.L3',
        unit: 'ampere'
      },

      3924:	{
        name: 'ac.phaseToPhaseVoltage.L12',
        unit: 'volt'
      },
      3938:	{
        name: 'ac.phaseToPhaseVoltage.L23',
        unit: 'volt'
      },
      3952:	{
        name: 'ac.phaseToPhaseVoltage.L31',
        unit: 'volt'
      },
      3926:	{
        name: 'ac.phaseVoltage.L1',
        unit: 'volt'
      },
      3940:	{
        name: 'ac.phaseVoltage.L2',
        unit: 'volt'
      },
      3954:	{
        name: 'ac.phaseVoltage.L3',
        unit: 'volt'
      },
      3902:	{
        name: 'ac.totalActivePower',
        unit: 'watt'
      },
      3918:	{
        name: 'ac.activePower.L1',
        unit: 'watt'
      },
      3932:	{
        name: 'ac.activePower.L2',
        unit: 'watt'
      },
      3946:	{
        name: 'ac.activePower.L3',
        unit: 'watt'
      },
      3904:	{
        name: 'ac.totalReactivePower',
        unit: 'volts-ampere-reactive'
      },
      3920:	{
        name: 'ac.reactivePower.L1',
        unit: 'volts-ampere-reactive'
      },
      3934:	{
        name: 'ac.reactivePower.L2',
        unit: 'volts-ampere-reactive'
      },
      3948:	{
        name: 'ac.reactivePower.L3',
        unit: 'volts-ampere-reactive'
      },
      3900:	{
        name: 'ac.totalApparentPower',
        unit: 'volts-ampere'
      },
      3916:	{
        name: 'ac.apparentPower.L1',
        unit: 'volts-ampere'
      },
      3930:	{
        name: 'ac.apparentPower.L2',
        unit: 'volts-ampere'
      },
      3944:	{
        name: 'ac.apparentPower.L3',
        unit: 'volts-ampere'
      },
      3906:	{
        name: 'ac.totalPowerFactor'
      },
      3922:	{
        name: 'ac.powerFactor.L1'
      },
      3936:	{
        name: 'ac.powerFactor.L2'
      },
      3950:	{
        name: 'ac.powerFactor.L3'
      },
      3914:	{
        name: 'ac.frequency',
        unit: 'hertz'
      },
      3860:	{
        name: 'ac.thdVoltage.L1'
      },
      3862:	{
        name: 'ac.thdVoltage.L2'
      },
      3864:	{
        name: 'ac.thdVoltage.L3'
      },
      3866:	{
        name: 'ac.thdCurrent.L1'
      },
      3868:	{
        name: 'ac.thdCurrent.L2'
      },
      3870:	{
        name: 'ac.thdCurrent.L3'
      },
      3958:	{
        name: 'ac.totalApparentEnergy.import',
        unit: 'kilovolt-ampere hour',
        translator: `function.bufferToFloat32Div1000`
      },
      3960:	{
        name: 'ac.totalActiveEnergy.import',
        unit: 'kilowatt hour',
        translator: `function.bufferToFloat32Div1000`
      },
      3962:	{
        name: 'ac.totalReactiveEnergy.import',
        unit: 'kilovolt-ampere-reactive hour',
        translator: `function.bufferToFloat32Div1000`
      },
      3966:	{
        name: 'ac.totalApparentEnergy.export',
        unit: 'kilovolt-ampere hour',
        translator: `function.bufferToFloat32Div1000`
      },
      3968:	{
        name: 'ac.totalActiveEnergy.export',
        unit: 'kilowatt hour',
        translator: `function.bufferToFloat32Div1000`
      },
      3970:	{
        name: 'ac.totalReactiveEnergy.export',
        unit: 'kilovolt-ampere-reactive hour',
        translator: `function.bufferToFloat32Div1000`
      }      
    }
  }
};

module.exports = config;
