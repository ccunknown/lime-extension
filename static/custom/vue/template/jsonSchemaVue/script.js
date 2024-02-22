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
          const result = [...arr];
          if (!result.includes(val)) result.push(val);
          return result.sort((a, b) => a - b);
        },

        uncheck: (arr, val) => {
          return [...arr].filter((e) => e !== val).sort((a, b) => a - b);
        },

        translateEnumDisplay: (addr, elem) => {
          // eslint-disable-next-line no-nested-ternary
          return elem && elem.title
            ? elem.detail
              ? Object.entries(elem.detail)
                  .map(([key, val]) => `<td v-html="html">${val}</td>`)
                  .join(``)
              : `<td v-html="html">${elem.title}</td>`
            : `<td v-html="html">${addr}</td>`;
        },
      },
    };
  },
};
