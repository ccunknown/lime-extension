//  LimeRaid class used for predict and verify id of html.
export default class ExtensionRaid {
  constructor(idList) {
    this.idList = (idList) ? idList : [];
    let duplicateList = this.findDuplicate();
    if(duplicateList.length)
      console.error(`Found duplicate id in html : ${JSON.stringify(duplicateList, null, 2)}`);
  }

  updateIdList(idRegex) {
    let list = [];
    if(Array.isArray(idRegex))
      list = idRegex;
    else {
      $('*').each((i, obj) => {
        let id = $(obj).attr('id');
          (id && id.match(idRegex)) ? list.push(id) : {};
      });
    }
    this.idList = list;
    let duplicateList = this.findDuplicate();
    if(duplicateList.length)
      console.error(`Found duplicate id in html : ${JSON.stringify(duplicateList, null, 2)}`);
  }

  findDuplicate(arr) {
    arr = (arr) ? arr : this.idList;
    return arr.filter((item, index) => {
      return arr.indexOf(item) != index;
    });
  }

  regexAutoId(regex, opt) {
    let arr = (opt && opt.array) ? opt.array : this.idList;
    let shortest = (opt && opt.shortest) ? true : false;

    let result = arr.filter((item, index) => item.match(regex));
    if(result.length == 0)
      console.error(`Not found id with regex : ${regex}`);
    else if(result.length > 1 && !shortest)
      console.warn(`Found list of id for regex : ${regex} : ${JSON.stringify(result, null, 2)}`);
    return result.reduce((a, b) => a.length <= b.length ? a : b);
  }

  stringAutoId(str, opt) {
    let arr = (opt && opt.array) ? opt.array : this.idList;
    var delimiter = (opt && opt.delimiter) ? opt.delimiter : '.';
    let shortest = (opt && opt.shortest) ? true : false;

    str = str.split(delimiter).join(`.*`);
    str = str.split(':').join(`\\:`);
    str = `${str}$`;
    let regex = new RegExp(str);
    return this.regexAutoId(regex, opt);
  }

  stringAutoIdObject(str) {
    let id = this.stringAutoId(str);
    id = id.split(':').join('\\:');
    return (id) ? $(`#${id}`) : null;
  }
}