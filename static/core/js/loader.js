export default class ExtensionLoader {
  constructor(extension) {
    this.extension = extension;
    this.schema = (this.extension) ? this.extension.schema : undefined;
    this.console = this.extension.console;
    this.define = {
      "url-prefix" : (this.schema) ? `/extensions/${this.schema.extension.full}` : `/`
    };
  }

  init(schemaPath) {
    return new Promise(async (resolve, reject) => {
      if(schemaPath)
        this.schema = await this.loadResource(schemaPath);

      if(!this.schema)
        reject(`Have no schema to load.`);

      this.objects = await this.loadBySchema(this.schema);

      //console.log(this.objects);

      resolve();
    });
  }

  loadBySchema(schema, obj) {
    return new Promise(async (resolve, reject) => {
      obj = (obj) ? obj : JSON.parse(JSON.stringify(schema.flow));
      let result = {};
      switch(typeof obj) {
        case "string":
          //console.log(`load string`);
          if(schema.define.hasOwnProperty(obj)) {
            if(schema.define[obj][`object-name`])
              result[obj] = await this.loadObject(`${schema.define[obj].path}`);
            else if(!schema.define[obj][`windowObj`] || !window.hasOwnProperty(schema.define[obj][`windowObj`]))
              result[obj] = await this.loadResource(`${schema.define[obj].path}`);
            resolve(result);
          }
          else
            reject(`"${obj}" not define!!!`);
          break;
        case "object":
          //console.log(`load object`);
          if(obj.type == "sequential") {
            for(let i in obj.load) {
              let res = await this.loadBySchema(schema, obj.load[i]);
              Object.assign(result, res);
            }
            resolve(result);
          }
          else if(obj.type == "parallel") {
            let prom = [];
            for(let i in obj.load) {
              let res = this.loadBySchema(schema, obj.load[i]);
              prom.push(res);
            }
            Promise.all(prom)
            .then((arr) => {
              arr.forEach((elem) => Object.assign(result, elem));
              resolve(result);
            });
          }
          else
            reject(`Incorrect schema : ${JSON.stringify(obj, null, 2)}`);
          break;
        default:
          reject(`load type ${typeof obj} not allow!!!`);
          break;
      }
      
    });
  }

  loadResource(path) {
    //console.log(`loadResource() : ${path}`);
    let prefix = `/extensions/${this.schema.extension.full}`;
    //path = (path.startsWith(prefix) || path.startsWith(`http`)) ? path : [prefix, `static`, path].join("/").replace(/\/+/g, "/");
    path = this.path(`${path}`);
    console.log(`path: ${path}`);
    if(path.endsWith(`.js`))
      return this.loadScript(path);
    else if(path.endsWith(`.html`))
      return this.loadPageSync(path);
    else if(path.endsWith(`.json`))
      return this.loadPageSync(path, `json`);
    else {
      console.error(`${path} not match file type.`);
      return null;
    }
  }

  loadObject(path) {
    return new Promise(async (resolve, reject) => {
      let prefix = `/extensions/${this.schema.extension.full}`;
      //path = (path.startsWith(prefix) || path.startsWith(`http`)) ? path : [prefix, `static`, path].join("/").replace(/\/+/g, "/");
      path = this.path(`${path}`);
      //console.log(`object : ${path} : `);
      let obj = (await import(`${path}`)).default;
      //console.log(obj);
      resolve(obj);
    });
  }

  loadScript(src) {
    return new Promise(async(resolve, reject) => {
      await import(`${src}`);
      //console.log(`${src} : `);
      //console.log(obj);
      resolve(null);
    });
  }

  loadPageSync(url, type) {
    return new Promise((resolve, reject) => {
      //console.log(`loadPageSync("${url}") : start`);
      fetch(url).then((res) => {
        //console.log(`loadPageSync("${url}") : finish`);
        resolve((type == "json") ? res.json() : res.text());
      }).catch((e) => {
        console.error(`Failed to fetch "${url}" : ${e}`);
      });
    });
  }

  path(path) {
    path = this.pathPurify(path);
    if(!path.startsWith(this.define[`url-prefix`]))
      path = this.pathJoin([this.define[`url-prefix`], `static`, path]);
    return path;
  }

  pathJoin(pathArr) {
    return this.pathPurify(pathArr.join(`/`));
  }

  pathPurify(path) {
    let regex = /^https?:\/\//g;
    let prefix = path.match(regex);
    path = path.replace(regex, ``);
    path = path.split(`/`).filter((elem) => (elem != ``) ? elem : false).join(`/`);
    return `${(prefix) ? prefix : `/`}${path}`;
  }

  getCoreObject(core) {
    let id = this.getCoreObjectId(core);
    return this.objects[id];
  }

  getCoreObjectId(core) {
    let define = this.schema.define;
    for(let i in define) {
      if(define[i].core == core)
        return i;
    }
    return undefined;
  }

  getCustomObjects() {
    return this.getObjects(`type`, `custom-script`);
  }

  getCustomObject(id) {
    let customObjects = this.getCustomObjects();
    if(customObjects.hasOwnProperty(id))
      return this.getObject(id);
    else
      return null;
  }

  getCustomViews() {
    return this.getObjects(`type`, `custom-view`);
  }

  getObject(id) {
    return this.objects[id];
  }

  getObjects(key, value) {
    let list = {};
    for(let i in this.objects) {
      if(this.schema.define[i][key] == value)
        list[i] = this.objects[i];
    }
    return list;
  }

  getSchemaDefine(id) {
    return this.schema.define[id];
  }
}