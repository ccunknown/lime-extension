const AsyncLock = require('async-lock');

class ItemMetrics {
  constructor(metrics) {
    this.metrics = (metrics) ? metrics : {};
    this.lock = {
      "key": `period`,
      "locker": new AsyncLock()
    };
  }

  get(id, metrics) {
    // console.log(`ItemMetrics: get(${id}) >> `);
    metrics = (metrics) ? metrics : this.metrics;

    if(id) {
      let idArr = id.split(`.`);
      let currId = idArr.shift();
      return (idArr.length) ? 
        this.get(idArr.join(`.`), metrics[currId]) : 
        metrics[currId];
    }
    else
      return JSON.parse(JSON.stringify(metrics));
  }

  lockCaller(callback, ...args) {
    let locker = this.lock.locker;
    let key = this.lock.key;
    return new Promise((resolve, reject) => {
      locker.acquire(key, () => callback(...args))
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }

  increase(id) {
    // console.log(`ItemMetrics: increase(${id}) >> `);
    return this.lockCaller(this._increase.bind(this), id);
  }

  _increase(id, metrics) {
    // console.log(`ItemMetrics: _increase(${id}) >> `);
    let idArr = id.split(`.`);
    let currId = idArr.shift();
    metrics = (metrics) ? metrics : this.metrics;

    metrics[currId] = (idArr.length) ?
      (metrics.hasOwnProperty(currId)) ? metrics[currId] : {} :
      (metrics.hasOwnProperty(currId)) ? metrics[currId] + 1 : 1;
    return (idArr.length) ? 
      this._increase(idArr.join(`.`), metrics[currId]) : 
      metrics[currId];
  }

  set(id, value) {
    // console.log(`ItemMetrics: set(${id}, ${value}) >> `);
    return this.lockCaller(this._set.bind(this), id, value);
  }

  _set(id, value, metrics) {
    // console.log(`ItemMetrics: _set(${id}, ${value}) >> `);
    let idArr = id.split(`.`);
    let currId = idArr.shift();
    metrics = (metrics) ? metrics : this.metrics;
    
    metrics[currId] = (idArr.length) ?
      (metrics.hasOwnProperty(currId)) ? metrics[currId] : {} :
      value;
    return (idArr.length) ? 
      this._set(idArr.join(`.`), value, metrics[currId]) : 
      metrics[currId];
  }
}

module.exports = ItemMetrics;