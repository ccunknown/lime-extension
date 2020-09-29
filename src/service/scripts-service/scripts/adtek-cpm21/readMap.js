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
        name: `Frequency`,
        unit: `Hz`,
        translator: `function.bufferToUint32Div100`
      },
      0x0002: {
        name: `Average phase voltage`,
        unit: `V`,
        translator: `function.bufferToUint32Div10`
      },
      0x0004: {
        name: `Average line voltage`,
        unit: `V`,
        translator: `function.bufferToUint32Div10`
      },
      0x0006: {
        name: `Average current`,
        unit: `A`,
        translator: `function.bufferToUint32Div1000`
      },
      0x0008: {
        name: `Neutral current`,
        unit: `A`,
        translator: `function.bufferToUint32Div1000`
      },
      0x000a: {
        name: `Total active power`,
        unit: `W`
      },
      0x000c: {
        name: `Total reactive power`,
        unit: `VAR`
      },
      0x000e: {
        name: `Total apparent power`,
        unit: `VA`
      },
      0x0010: {
        name: `Average power factor`,
        unit: `PF`,
        translator: `function.bufferToUint32Div1000`
      },
      0x0012: {
        name: `Active energy`,
        unit: `kWh`,
        translator: `function.bufferToUint32Div10`
      },
      0x0014: {
        name: `Reactive energy`,
        unit: `kVARh`,
        translator: `function.bufferToUint32Div10`
      },
      0x0016: {
        name: `Total electricity bill`,
        unit: `$`,
        translator: `function.bufferToUint32Div10`
      },
      0x0018: {
        name: `The total carbon dioxide`,
        unit: `kg`,
        translator: `function.bufferToUint32Div10`
      },
      0x001a: {
        name: `Phase A voltage`,
        unit: `V`,
        translator: `function.bufferToUint32Div10`
      },
      0x001c: {
        name: `Phase B voltage`,
        unit: `V`,
        translator: `function.bufferToUint32Div10`
      },
      0x001e: {
        name: `Phase C voltage`,
        unit: `V`,
        translator: `function.bufferToUint32Div10`
      },
      0x0020: {
        name: `AB line voltage`,
        unit: `V`,
        translator: `function.bufferToUint32Div10`
      },
      0x0022: {
        name: `BC line voltage`,
        unit: `V`,
        translator: `function.bufferToUint32Div10`
      },
      0x0024: {
        name: `CA line voltage`,
        unit: `V`,
        translator: `function.bufferToUint32Div10`
      },
      0x0026: {
        name: `Phase A current`,
        unit: `A`,
        translator: `function.bufferToUint32Div1000`
      },
      0x0028: {
        name: `Phase B current`,
        unit: `A`,
        translator: `function.bufferToUint32Div1000`
      },
      0x002a: {
        name: `Phase C current`,
        unit: `A`,
        translator: `function.bufferToUint32Div1000`
      },
      0x002c: {
        name: `Phase A active power`,
        unit: `W`
      },
      0x002e: {
        name: `Phase B active power`,
        unit: `W`
      },
      0x0030: {
        name: `Phase C active power`,
        unit: `W`
      },
      0x0032: {
        name: `Phase A reactive power`,
        unit: `VAR`
      },
      0x0034: {
        name: `Phase B reactive power`,
        unit: `VAR`
      },
      0x0036: {
        name: `Phase C reactive power`,
        unit: `VAR`
      },
      0x0038: {
        name: `Phase A apparent power`,
        unit: `VA`
      },
      0x003a: {
        name: `Phase B apparent power`,
        unit: `VA`
      },
      0x003c: {
        name: `Phase C apparent power`,
        unit: `VA`
      },
      0x003e: {
        name: `Phase A Power Factor`,
        unit: `PF`,
        translator: `function.bufferToUint32Div1000`
      },
      0x0040: {
        name: `Phase B Power Factor`,
        unit: `PF`,
        translator: `function.bufferToUint32Div1000`
      },
      0x0042: {
        name: `Phase C Power Factor`,
        unit: `PF`,
        translator: `function.bufferToUint32Div1000`
      }
    }
  }
};

module.exports = config;
