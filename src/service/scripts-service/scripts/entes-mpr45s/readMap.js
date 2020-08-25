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
        name: `Voltage L1-N`,
        unit: `V`,
        translator: `function.bufferToUint32Div10`
      },
      0x0002: {
        name: `Voltage L2-N`,
        unit: `V`,
        translator: `function.bufferToUint32Div10`
      },
      0x0004: {
        name: `Voltage L3-N`,
        unit: `V`,
        translator: `function.bufferToUint32Div10`
      },
      0x0006: {
        name: `Voltage L4-N`,
        unit: `V`,
        translator: `function.bufferToUint32Div10`
      },
      0x0008: {
        name: `Voltage L1-L2`,
        unit: `V`,
        translator: `function.bufferToUint32Div10`
      },
      0x000A: {
        name: `Voltage L2-L3`,
        unit: `V`,
        translator: `function.bufferToUint32Div10`
      },
      0x000C: {
        name: `Voltage L3-L1`,
        unit: `V`,
        translator: `function.bufferToUint32Div10`
      },
      0x000E: {
        name: `Current L1`,
        unit: `mA`
      },
      0x0010: {
        name: `Current L2`,
        unit: `mA`
      },
      0x0012: {
        name: `Current L3`,
        unit: `mA`
      },
      0x0014: {
        name: `Current L4`,
        unit: `mA`
      },
      0x0016: {
        name: `Neutral Current(IL1+IL2+IL3)`,
        unit: `mA`
      },
      0x0018: {
        name: `Measured frequency`,
        unit: `Hz`,
        translator: `function.bufferToUint32Div100`
      },
      0x001A: {
        name: `Active power L1-N`,
        unit: `W`,
        translator: `function.bufferToFloat32`
      },
      0x001C: {
        name: `Active power L2-N`,
        unit: `W`,
        translator: `function.bufferToFloat32`
      },
      0x001E: {
        name: `Active power L3-N`,
        unit: `W`,
        translator: `function.bufferToFloat32`
      },
      0x0022: {
        name: `Total import active power`,
        unit: `W`,
        translator: `function.bufferToFloat32`
      },
      0x0024: {
        name: `Total export active power`,
        unit: `W`,
        translator: `function.bufferToFloat32`
      },
      0x0028: {
        name: `Reactive power L1`,
        unit: `var`,
        translator: `function.bufferToFloat32`
      },
      0x002A: {
        name: `Reactive power L2`,
        unit: `var`,
        translator: `function.bufferToFloat32`
      },
      0x002C: {
        name: `Reactive power L3`,
        unit: `var`,
        translator: `function.bufferToFloat32`
      }
    }
  }
};

module.exports = config;