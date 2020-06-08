//  JSON resource keeper, this class used by api.

class LimeExtensionCollector {
  constructor(extension) {
    this.api = extension.api;
    let consoleObj = api.getCoreObject(`console`);
    this.console = new consoleObj({
      "heading-word": `${extension.console.getHeadingWord()} >> ExtensionCollector`,
      "debug-level": extension.console.getDebugLevel()
    });

    this.console = (extension) ? extension.console : console;
    this.console.trace(`${this.consolePrefix} constructor()`);
    this.resource = {
      static: {},
      dynamic: {}
    };
  }

  /*
    set() function has multiple way to use eg:
      - set(name, type, obj)
      - set(name, obj)  //  type = "dynamic"
      - set({
        name: name,
        type: type,     //  default : "dynamic"
        obj: obj
      })
  */
  set(name, type, obj) {
    this.console.trace(`set() >> `);

    obj = (obj) ? 
      obj : (type) ? 
      type : 
      name.obj;
    type = (obj) ?
      type : (type) ? 
      "dynamic" : (name.type) ? 
      name.type : 
      "dynamic";
    name =  (type) ? name : name.name;

    return (type == `static`) ? this.setStatic(name, obj) : this.setDynamic(name, obj);
  }

  setStatic(name, obj) {
    this.console.trace(`setStatic() >> `);
    if(this.resource.static.hasOwnProperty(`${name}`)) {
      this.console.warn(`Resource named "${name}" already available!!!`);
      return false;
    }
    this.resource.static[name] = obj;
    return true;
  }

  setDynamic(name, obj) {
    this.console.trace(`setDynamic() >> `);
    this.resource.dynamic[name] = obj;
    return true;
  }

  get(name, type) {
    return (type == "dynamic") ? this.getDynamic(name) : this.getStatic(name);
  }

  getStatic(name) {
    return (this.resource.static[name]) ? this.resource.static[name] : undefined;
  }

  getDynamic(name) {
    return (this.resource.dynamic[name]) ? this.resource.dynamic[name] : undefined;
  }
}