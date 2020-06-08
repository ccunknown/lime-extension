class LimeExtensionConsole {
  constructor(options) {
    this.constants = {
      "debugLevelValue": {
        "off": 0,
        "fatal": 1,
        "error": 2,
        "warn": 3,
        "info": 4,
        "log": 5,
        "trace": 6,
        "all": 7
      }
    }
    this.headingWord = ``;
    this.debugLevel = `log`;
    if(options) {
      if(options.headingWord)
        this.setHeadingWord(options[`heading-word`]);
      if(options.debugLevel)
        this.setDebugLevel(options[`debug-level`]);
    }
  }

  setHeadingWord(word) {
    this.headingWord = (word) ? `${word} >> ` : ``;
  }

  getHeadingWord() {
    return `${this.headingWord}`;
  }

  setDebugLevel(level) {
    level = (level) ? `${level}`.toLowerCase() : this.debugLevel;
    this.debugLevel = level;

    let valueMap = this.debugLevelValue;
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
    return `${this.debugLevel}`
  }

  enable(func) {
    if(!func)
      return ;
    func = func.toLowerCase();
    switch(func) {
      case "trace":
        this[func] = (str) => console.trace(`${this.headingWord}${str}`);
        break;
      case "debug":
        this[func] = (str) => console.log(`${this.headingWord}${str}`);
        break;
      case "info":
        this[func] = (str) => console.info(`${this.headingWord}${str}`);
        break;
      case "warn":
        this[func] = (str) => console.warn(`${this.headingWord}${str}`);
        break;
      case "error":
        this[func] = (str) => console.error(`${this.headingWord}${str}`);
        break;
      default:
        console.warn(`${this.headingWord} >> LimeConsole() >> Cannot disable function "${func}".`);
    }
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