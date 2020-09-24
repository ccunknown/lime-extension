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
          else if(param.type == `array` && param.items && param.items.enum)
            type = `checklist`;
          return type;
        },

        "isDisabled": (param) => {
          if(param.const)
            return true;
          return false;
        },

        "isChecked": (arr, val) => {
          console.log(`isChecked() >> `);
          console.log(`arr: `, arr);
          console.log(`val: `, val);
          return (arr.includes(val)) ? true : false;
        },

        "check": (arr, val) => {
          arr = (Array.isArray(arr)) ? arr : [];
          (arr.includes(val)) ? 0 : arr.push(val);
          // arr.sort();
          return arr;
        },

        "uncheck": (arr, val) => {
          arr = (Array.isArray(arr)) ? arr : [];
          let result = [];
          if(arr.includes(val)) {
            for(let i in arr)
              (arr[i] == val) ? 0 : result.push(arr[i]);
          }
          // result.sort();
          return result;
        }
      }
    }
  }
};