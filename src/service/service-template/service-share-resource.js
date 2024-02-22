class ServiceShareResource {
  constructor() {
    this.resource = new Map();
  }

  set(key, obj, overwrite = false) {
    if (overwrite || !this.resource.has(key))
      return this.resource.set(key, obj);
    return null;
  }

  get(key) {
    return this.resource.get(key);
  }
}

module.exports = ServiceShareResource;
