export default {
  "props": [`param`, `value`],
  "data": () => {
    return {
      "fn": {

        "typeIdentify": (param) => {
          let type = undefined;
          if(param.attrs && param.attrs.type)
            type = param.attrs.type;
          else if(param.enum)
            type = `select`;
          else if(param.type == `string`)
            type = `text`;
          else if(param.type == `number`)
            type = `number`;
          else if(param.type == `boolean`)
            type = `checkbox`;
          else if(param.type == `object`)
            type = `object`;
          return type;
        },

        "isDisabled": (param) => {
          if(param.const)
            return true;
          return false;
        }

      }
    }
  }
};