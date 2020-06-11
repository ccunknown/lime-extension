(function() {
  'use strict'
  class Main {
    constructor() {
      console.log(`This is a Main class.`);
      this.init()
      .then((object) => {
        let obj = new object();
        obj.hello();
      });
    }

    init() {
      return new Promise(async(resolve, reject) => {
        const Module1 = (await import(`./module1.js`)).default;
        //const Module1 = (await import(`./module1.js`))[`Module1`];
        //import(`./module1.js`);
        //const module1 = require(`./module1.js`);
        console.log(Module1);
        resolve(Module1);
        //let obj = new Module1();
        //resolve(obj);
      });
    }
  }

  new Main();
}) ();
