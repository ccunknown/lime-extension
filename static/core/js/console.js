export default class ExtensionConsole {
  constructor(extension) {
    //console.log(`new console ${JSON.stringify(options, null, 2)}`);
    this.constants = {
      "debugLevelValue": {
        "off": 0,
        "fatal": 1,
        "error": 2,
        "warn": 3,
        "info": 4,
        "debug": 5,
        "log": 5,
        "trace": 6,
        "all": 7
      }
    }
    this.options = {
      "heading-word": `${extension.script.extension[`title-short`]} >> `,
      "debug-level": `${extension.script.extension[`debug-level`]}`
    };
    console.log(this.options);
    this.setDebugLevel();
  }

  init(console) {

  }

  setHeadingWord(word) {
    this.options[`heading-word`] = (word) ? `${word} >> ` : ``;
  }

  getHeadingWord() {
    return `${this.options[`heading-word`]}`;
  }

  setDebugLevel(level) {
    level = (level) ? `${level}`.toLowerCase() : this.options[`debug-level`];
    console.log(`set debug level ${level}`);
    this.options[`debug-level`] = level;

    let valueMap = this.constants.debugLevelValue;
    for(let i in valueMap) {
      if(i != "off" && i != "all") {
        if(valueMap[i] <= valueMap[level])
          this.enable(i);
        else
          this.disable(i);
      }
    }
  }

  getDebugLevel() {
    return `${this.options[`debug-level`]}`
  }

  enable(func) {
    console.log(`enable ${func}`);
    if(!func)
      return ;
    func = func.toLowerCase();
    switch(func) {
      case "trace":
        this[func] = (str) => console.trace(`${this.options[`heading-word`]}${str}`);
        break;
      case "debug":
      case "log":
        this[func] = (str) => console.log(`${this.options[`heading-word`]}${str}`);
        break;
      case "info":
        this[func] = (str) => console.info(`${this.options[`heading-word`]}${str}`);
        break;
      case "warn":
        this[func] = (str) => console.warn(`${this.options[`heading-word`]}${str}`);
        break;
      case "error":
        this[func] = (str) => console.error(`${this.options[`heading-word`]}${str}`);
        break;
      default:
        console.warn(`${this.options[`heading-word`]} >> LimeConsole() >> Cannot disable function "${func}".`);
    }
    return this[func];
  }

  disable(func) {
    if(!func)
      return ;
    func = func.toLowerCase();
    if(!this.constants.debugLevelValue.hasOwnProperty(func)) {
      console.warn(`${this.headingWord} >> LimeConsole() >> Cannot disable function "${func}".`);
      return ;
    }
    this[func] = (str) => {
      return ;
    };
  }
}