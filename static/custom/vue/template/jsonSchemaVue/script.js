export default {
  props: [`param`, `value`],
  data: () => {
    return {
      fn: {
        typeIdentify: (param) => {
          let type;
          if (param.attrs && param.attrs.type) type = param.attrs.type;
          else if (param.enum) type = `select`;
          else if (param.type === `string`) type = `text`;
          else if (param.type === `number`) type = `number`;
          else if (param.type === `boolean`) type = `checkbox`;
          else if (param.type === `object`) type = `object`;
          else if (param.type === `array` && param.items && param.items.enum)
            type = `checklist`;
          return type;
        },

        isDisabled: (param) => {
          if (param.const || param.disabled) return true;
          return false;
        },

        isChecked: (arr, val) => {
          console.log(
            `isChecked(${val}) >> ${arr.includes(val) ? `true` : `false`}`
          );
          return !!arr.includes(val);
        },

        check: (arr, val) => {
          // eslint-disable-next-line no-param-reassign
          arr = Array.isArray(arr) ? arr : [];
          if (!arr.includes(val)) arr.push(val);
          // arr.sort();
          return arr;
        },

        uncheck: (arr, val) => {
          // eslint-disable-next-line no-param-reassign
          arr = (Array.isArray(arr)) ? arr : [];
          const result = [];
          if (arr.includes(val)) {
            arr.forEach((i) => {
              if (arr[i] !== val) result.push(arr[i]);
            });
          }
          // result.sort();
          return result;
        },
      },
    };
  },
};
