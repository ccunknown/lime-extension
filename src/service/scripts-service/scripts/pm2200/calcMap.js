var config = {};

config = {
  function: {
    getFunction: (path) => {
      let taddr = path.split(`.`);
      let pointer = config;
      for(let i in taddr) {
        pointer = (pointer[taddr[i]]) ? pointer[taddr[i]] : null;
      }
      return (typeof pointer == `function`) ? pointer : null;
    },
    bufferToDataView: (buffer) => {
      let buf = new ArrayBuffer(buffer.length);
      let view = new DataView(buf);
      // console.log(buffer);
      buffer.forEach((b, i) => {
        view.setUint8(i, b);
      });
      return view;
    },
    bufferToUint16: (buffer) => config.function.bufferToDataView(buffer).getUint16(),
    bufferToUint32: (buffer) => config.function.bufferToDataView(buffer).getUint32(),
    bufferToUint32Div10: (buffer) => (config.function.bufferToDataView(buffer).getUint32()/10.0),
    bufferToUint32Div100: (buffer) => (config.function.bufferToDataView(buffer).getUint32()/100.0),
    bufferToUint32Div1000: (buffer) => (config.function.bufferToDataView(buffer).getUint32()/1000.0),
    bufferToBigUint64: (buffer) => (Number(config.function.bufferToDataView(buffer).getBigUint64())),
    bufferToBigUint64Div1000: (buffer) => (config.function.bufferToDataView(buffer).getBigUint64()/1000.0),
    bufferToFloat32: (buffer) => {
      try {
        let result = Number(config.function.bufferToDataView(buffer).getFloat32());
        result = (typeof result == `number` && !isNaN(result)) ? result : 0;
        // console.log(`buffer result: ${result}`);
        return result;
      } catch(err) {
        console.error(err);
        return 0;
      }
    }
  },

  translator: {
    translateMap: (buffer, schema) => {
      let map = schema.translateMap;
      let indexTranslator = config.function.getFunction(map.indexTranslator);
      let index = indexTranslator(buffer);

      let result = map.map[index];
      return result;
    },
    networkParityStop: (buffer) => {
      const dict = {
        0x00: `1 stop bit no parity`,
        0x01: `1 stop bit even parity`,
        0x02: `1 stop bit odd parity`,
        0x03: `2 stop bits no parity`
      };
      let index = Math.floor(config.function.bufferToFloat32(buffer));
      let result = (dict[index]) ? dict[index] : -1;
      return result;
    },
    networkBaudRate: (buffer) => {
      const dict = {
        0x00: 2400,
        0x01: 4800,
        0x02: 9600,
        0x03: 19200,
        0x04: 38400
      };
      let index = Math.floor(config.function.bufferToFloat32(buffer));
      let result = (dict[index]) ? dict[index] : -1;
      return result;
    }
  }
};

module.exports = config;
