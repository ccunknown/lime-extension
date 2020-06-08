class LimeExtensionApi {
  constructor(extension, loadScriptPath) {
    this.default = {
      "url-prefix": "/",
      "load-script-path": (loadScriptPath) ? this.pathPurify(loadScriptPath) : `/`
    };
    //this.init(options);
    this.extension = extension;
    this.console = null;
    this.collector = null;
    this.objects = {};
  }

  init(options) {
    return new Promise(async (resolve, reject) => {
      this.initOptions(options);
      this.initLoader()
      .then((objects) => resolve(objects));
    });
  }

  initOptions(options) {
    return new Promise((resolve, reject) => {
      this.options = {};
      for(let i in this.default)
        this.options[i] = (options[i]) ? options[i] : this.default[i];
      this.options[`url-prefix`] = this.path(`${this.options[`url-prefix`]}`);
      resolve(this.options);
    });
  }

  initLoader(script) {
    return new Promise((resolve, reject) => {
      this.loader(script)
      .then((list) => {
        for(let i in list) {
          this.objects[i] = JSON.parse(JSON.stringify(this.options[`load-script`].define[i]));
        }
        /*
        list.forEach((name) => {
          this.objects[name] = JSON.parse(JSON.stringify(define[name]));
        });
        */
        resolve(this.objects);
      });
    });
  }

  initCoreObjects(extension) {
    return new Promise((resolve, reject) => {
      let objects = this.objects;
      this.console = objects;
    });
  }

  initPageObjects() {
    return new Promise((resolve, reject) => {
    });
  }

  path(path) {
    path = this.pathPurify(path);
    if(!path.startsWith(this.options[`url-prefix`]))
      path = this.pathJoin([this.options[`url-prefix`], `static`, path]);
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

  findWithPropertyName(obj, name, val) {
    for(let i in obj) {
      if(obj[i].hasOwnProperty(name) && (val) ? obj[i][name] == val : true)
        return obj[i];
    }
    return undefined;
  }

  loader(script) {
    return new Promise(async (resolve, reject) => {
      let opt = this.options;
      let loadScriptPath = opt[`load-script-path`];
      if(!script) {
        script = await this.loadResource(this.path(loadScriptPath));
        this.options[`load-script`] = (typeof script == `string`) ? JSON.parse(script) : script;
      }
      let loadScript = opt[`load-script`];

      //console.log(script);

      this.loadBySchema(loadScript)
      .then((arr) => {
        let result = {};
        for(let i in arr) {
          console.log(i);
          result[i] = JSON.parse(JSON.stringify(loadScript.define[i]));
        }
        //this.console = this.findWithPropertyName(obj, `core`, );
        resolve(arr);
      });
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
    let prefix = this.options[`url-prefix`];
    path = (path.startsWith(prefix) || path.startsWith(`http`)) ? path : [prefix, `static`, path].join("/").replace(/\/+/g, "/");
    if(path.endsWith(`.js`)) {
      return this.loadScriptSync(path);
    }
    else if(path.endsWith(`.html`) || path.endsWith(`.json`)) {
      return this.loadPageSync(path);
    }
    else {
      console.error(`${path} not match file type.`);
      return null;
    }
  }

  loadScriptSync(src) {
    return new Promise((resolve, reject) => {
      var s = document.createElement('script');
      s.src = src;
      s.type = "text/javascript";
      s.async = false;

      s.addEventListener("load", () => {
          //console.log(`loadScriptSync("${src}") : finish`);
          resolve();
        });

      s.addEventListener("error", (err) => {
        console.log(`loadScriptSync("${src}") : error`);
        reject(err);
      });

      //console.log(`loadScriptSync("${src}") : start`);
      document.getElementsByTagName('head')[0].appendChild(s);
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
}