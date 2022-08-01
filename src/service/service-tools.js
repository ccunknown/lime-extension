module.exports = {
  getRootDirectory: () => {
    const split = __dirname.split(`/`);
    split.pop();
    split.pop();
    return split.join(`/`);
  },

  base64Encode(data) {
    const buff = Buffer.from(data);
    const base64 = buff.toString(`base64`);
    return base64;
  },

  base64Decode(data, encoding) {
    const buff = Buffer.from(data, `base64`);
    const result = buff.toString(encoding || `utf8`);
    return result;
  },

  jsonToArray(json, keyOfId) {
    const arr = [];
    Object.keys(json).forEach((k) => {
      const elem = JSON.parse(JSON.stringify(json[k]));
      if (keyOfId) elem[keyOfId] = k;
      arr.push(elem);
    });
    return arr;
  },

  arrayToJson(array, keyAttr) {
    const json = {};
    array.forEach((elem) => {
      json[elem[keyAttr]] = elem;
    });
    return JSON.parse(JSON.stringify(json));
  },
};
