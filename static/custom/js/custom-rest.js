export default class CustomRest {
  constructor(extension, meta) {
    this.console = extension.console;
    this.api = extension.api;
    this.ui = extension.ui;
    this.serviceId = meta[`service-id`];
    this.serviceTitle = meta[`service-title`];
    this.resourceId = meta[`resource-id`];
    this.resourceTitle = meta[`resource-title`];
  }

  init() {
    return new Promise((resolve) => {
      this.initRest();
      resolve();
    });
  }

  initRest() {
    Object.assign(this, {
      configSchema: {
        post: (param) => {
          this.console.log(
            `CustomRest[${this.resourceId}]: generateConfigSchema() >> `
          );
          return new Promise((resolve, reject) => {
            Promise.resolve()
              .then(() =>
                this.api.restCall(
                  `post`,
                  `/api/service/${this.resourceId}/config-schema`,
                  param || undefined
                )
              )
              .then((res) => resolve(res))
              .catch((err) => reject(err));
          });
        },
      },

      objects: (id) => {
        return !id
          ? {
              config: {
                get: () => {
                  this.console.log(
                    `CustomRest[${this.serviceId}]`,
                    `objects.config.get()`
                  );
                  return new Promise((resolve, reject) => {
                    Promise.resolve()
                      .then(() =>
                        this.api.restCall(
                          `get`,
                          `/api/service/${this.resourceId}/objects/config`
                        )
                      )
                      .then((res) =>
                        res.error ? reject(res.error) : resolve(res)
                      )
                      .catch((err) => reject(err));
                  });
                },
              },
              configWithState: {
                get: () => {
                  this.console.log(
                    `CustomRest[${this.serviceId}]`,
                    `objects.configWithState.get()`
                  );
                  return new Promise((resolve, reject) => {
                    Promise.resolve()
                      .then(() =>
                        this.api.restCall(
                          `get`,
                          `/api/service/${this.resourceId}/objects/config-with-state`
                        )
                      )
                      .then((res) =>
                        res.error ? reject(res.error) : resolve(res)
                      )
                      .catch((err) => reject(err));
                  });
                },
              },
            }
          : {
              update: (config) => {
                this.console.log(
                  `CustomRest[${this.serviceId}]`,
                  `objects(${id}).put()`
                );
                return new Promise((resolve, reject) => {
                  Promise.resolve()
                    .then(() =>
                      this.api.restCall(
                        `put`,
                        `/api/service/${this.resourceId}/objects/${id}`,
                        config
                      )
                    )
                    .then((res) =>
                      res.error ? reject(res.error) : resolve(res)
                    )
                    .catch((err) => reject(err));
                });
              },
              config: {
                get: () => {
                  this.console.log(
                    `CustomRest[${this.serviceId}]`,
                    `objects(${id}).config.get()`
                  );
                  return new Promise((resolve, reject) => {
                    Promise.resolve()
                      .then(() =>
                        this.api.restCall(
                          `get`,
                          `/api/service/${this.resourceId}/objects/${id}/config`
                        )
                      )
                      .then((res) =>
                        res.error ? reject(res.error) : resolve(res)
                      )
                      .catch((err) => reject(err));
                  });
                },
              },
              configWithState: {
                get: () => {
                  this.console.log(
                    `CustomRest[${this.serviceId}]`,
                    `objects(${id}).configWithState.get()`
                  );
                  return new Promise((resolve, reject) => {
                    Promise.resolve()
                      .then(() =>
                        this.api.restCall(
                          `get`,
                          `/api/service/${this.resourceId}/objects/${id}/config-with-state`
                        )
                      )
                      .then((res) =>
                        res.error ? reject(res.error) : resolve(res)
                      )
                      .catch((err) => reject(err));
                  });
                },
              },
              metric: {
                get: () => {
                  this.console.log(
                    `CustomRest[${this.serviceId}]`,
                    `objects(${id}).metric.get()`
                  );
                  return new Promise((resolve, reject) => {
                    Promise.resolve()
                      .then(() =>
                        this.api.restCall(
                          `get`,
                          `/api/service/${this.resourceId}/objects/${id}/metric`
                        )
                      )
                      .then((res) => (res.error ? reject(res.error) : resolve(res)))
                      .catch((err) => reject(err));
                  });
                },
                delete: () => {
                  this.console.log(
                    `CustomRest[${this.serviceId}]`,
                    `objects(${id}).metric.delete()`
                  );
                  return new Promise((resolve, reject) => {
                    Promise.resolve()
                      .then(() =>
                        this.api.restCall(
                          `delete`,
                          `/api/service/${this.resourceId}/objects/${id}/metric`
                        )
                      )
                      .then((res) =>
                        res.error ? reject(res.error) : resolve(res)
                      )
                      .catch((err) => reject(err));
                  });
                },
              },
              cmd: {
                start: () => {
                  this.console.log(
                    `CustomRest[${this.serviceId}]`,
                    `objects(${id}).cmd.start()`
                  );
                  return new Promise((resolve, reject) => {
                    Promise.resolve()
                      .then(() =>
                        this.api.restCall(
                          `get`,
                          `/api/service/${this.resourceId}/objects/${id}/cmd/start`
                        )
                      )
                      .then((res) =>
                        res.error ? reject(res.error) : resolve(res)
                      )
                      .catch((err) => reject(err));
                  });
                },
                stop: () => {
                  this.console.log(
                    `CustomRest[${this.serviceId}]`,
                    `objects(${id}).cmd.stop()`
                  );
                  return new Promise((resolve, reject) => {
                    Promise.resolve()
                      .then(() =>
                        this.api.restCall(
                          `get`,
                          `/api/service/${this.resourceId}/objects/${id}/cmd/stop`
                        )
                      )
                      .then((res) =>
                        res.error ? reject(res.error) : resolve(res)
                      )
                      .catch((err) => reject(err));
                  });
                },
              },
            };
      },

      // getItemConfig: (id) => {
      //   this.console.log(
      //     `CustomRest[${this.serviceId}]: getItemConfig(${
      //       id ? `${id}` : ``
      //     }) >> `
      //   );
      //   return new Promise((resolve, reject) => {
      //     Promise.resolve()
      //       .then(() =>
      //         this.api.restCall(
      //           `get`,
      //           `/api/service/${this.serviceId}/config-${this.resourceId}${
      //             id ? `/${id}` : ``
      //           }`
      //         )
      //       )
      //       .then((res) => (res.error ? reject(res.error) : resolve(res)))
      //       .catch((err) => reject(err));
      //   });
      // },
      getObjectConfig: (id) => {
        this.console.log(
          `CustomRest[${this.serviceId}]: getObjectConfig(${
            id ? `${id}` : ``
          }) >> `
        );
        return new Promise((resolve, reject) => {
          Promise.resolve()
            .then(() =>
              this.api.restCall(
                `get`,
                `/api/service/${this.resourceId}/objects-config${id ? `/${id}` : ``}`
              )
            )
            .then((res) => (res.error ? reject(res.error) : resolve(res)))
            .catch((err) => reject(err));
        });
      },

      updateObject: (id, config) => {
        this.console.log(
          `CustomRest[${this.serviceId}]:`,
          `updateObjectConfig(${id || ``})`
        );
        return new Promise((resolve, reject) => {
          Promise.resolve()
            .then(() =>
              this.api.restCall(
                `put`,
                `/api/service/${this.resourceId}/objects/${id}`,
                config
              )
            )
            .then((res) => (res.error ? reject(res.error) : resolve(res)))
            .catch((err) => reject(err));
        });
      },

      // getServicedItem: (id) => {
      //   this.console.log(
      //     `CustomRest[${this.serviceId}]: getServicedItem(${
      //       id ? `${id}` : ``
      //     }) >> `
      //   );
      //   return new Promise((resolve, reject) => {
      //     Promise.resolve()
      //       .then(() =>
      //         this.api.restCall(
      //           `get`,
      //           `/api/service/${this.serviceId}/service-${this.resourceId}${
      //             id ? `/${id}` : ``
      //           }`
      //         )
      //       )
      //       .then((res) => (res.error ? reject(res.error) : resolve(res)))
      //       .catch((err) => reject(err));
      //   });
      // },
      getObjectConfigWithState: (id) => {
        this.console.log(
          `CustomRest[${this.serviceId}]: getServicedItem(${
            id ? `${id}` : ``
          }) >> `
        );
        return new Promise((resolve, reject) => {
          Promise.resolve()
            .then(() =>
              this.api.restCall(
                `get`,
                `/api/service/${this.resourceId}/objects${id ? `/${id}` : ``}`
              )
            )
            .then((res) => (res.error ? reject(res.error) : resolve(res)))
            .catch((err) => reject(err));
        });
      },

      // getObjectMetric: (id) => {
      //   this.console.log(
      //     `CustomRest[${this.serviceId}]:`,
      //     `getObjectMetric(${id})`
      //   );
      //   return new Promise((resolve, reject) => {
      //     Promise.resolve()
      //       .then(() =>
      //         this.api.restCall(
      //           `get`,
      //           `/api/service/${this.serviceId}/service-${this.resourceId}/${id}/metrics`
      //         )
      //       )
      //       .then((res) => (res.error ? reject(res.error) : resolve(res)))
      //       .catch((err) => reject(err));
      //   });
      // },
      getObjectMetric: (id) => {
        this.console.log(
          `CustomRest[${this.serviceId}]:`,
          `getObjectMetric(${id})`
        );
        return new Promise((resolve, reject) => {
          Promise.resolve()
            .then(() =>
              this.api.restCall(
                `get`,
                `/api/service/${this.resourceId}/objects/${id}/metric`
              )
            )
            .then((res) => (res.error ? reject(res.error) : resolve(res)))
            .catch((err) => reject(err));
        });
      },

      deleteObjectMetric: (id) => {
        this.console.log(
          `CustomRest[${this.serviceId}]:`,
          `deleteObjectMetric(${id})`
        );
        return new Promise((resolve, reject) => {
          Promise.resolve()
            .then(() =>
              this.api.restCall(
                `delete`,
                `/api/service/${this.resourceId}/objects/${id}/metric`
              )
            )
            .then((res) => (res.error ? reject(res.error) : resolve(res)))
            .catch((err) => reject(err));
        });
      },

      startServicedItem: (id) => {
        this.console.log(
          `CustomRest[${this.serviceId}]: startServicedItem(${id}) >> `
        );
        return new Promise((resolve, reject) => {
          const toast = this.ui.toast.info(
            `Starting ${this.resourceTitle.toLowerCase()} "${id}".`
          );
          Promise.resolve()
            .then(() =>
              this.api.restCall(
                `get`,
                `/api/service/${this.serviceId}/service-${this.resourceId}/${id}/start`
              )
            )
            .then((res) => {
              this.ui.toast.success(
                `${this.resourceTitle} "${id}" is running.`,
                { icon: `fa-play` }
              );
              resolve(res);
            })
            .catch((err) => reject(err))
            .finally(() => toast.remove());
        });
      },

      stopServicedItem: (id) => {
        this.console.log(
          `CustomRest[${this.serviceId}]: stopServicedItem(${id}) >> `
        );
        return new Promise((resolve, reject) => {
          const toast = this.ui.toast.info(
            `Stopping ${this.resourceTitle.toLowerCase()} "${id}".`
          );
          Promise.resolve()
            .then(() =>
              this.api.restCall(
                `get`,
                `/api/service/${this.serviceId}/service-${this.resourceId}/${id}/stop`
              )
            )
            .then((res) => {
              this.ui.toast.success(
                `${this.resourceTitle} "${id}" stoped.`,
                { icon: `fa-stop` }
                //
              );
              resolve(res);
            })
            .catch((err) => reject(err))
            .finally(() => toast.remove());
        });
      },

      addToService: (id) => {
        this.console.log(
          `CustomRest[${this.serviceId}]: addToService(${id}) >> `
        );
        return new Promise((resolve, reject) => {
          const toast = this.ui.toast.info(
            `Add ${this.resourceTitle.toLowerCase()} "${id}" to service.`
          );
          Promise.resolve()
            .then(() =>
              this.api.restCall(
                `get`,
                `/api/service/${this.serviceId}/service-${this.resourceId}/${id}/add-to-service`
              )
            )
            .then((res) => {
              this.ui.toast.success(
                `${this.resourceTitle} "${id}" serviced.`,
                { icon: `fa-history` }
                //
              );
              resolve(res);
            })
            .catch((err) => reject(err))
            .finally(() => toast.remove());
        });
      },

      removeFromService: (id) => {
        this.console.log(
          `CustomRest[${this.serviceId}]: removeFromService(${id}) >> `
        );
        return new Promise((resolve, reject) => {
          const toast = this.ui.toast.info(
            `Add ${this.resourceTitle.toLowerCase()} "${id}" to service.`
          );
          Promise.resolve()
            .then(() =>
              this.api.restCall(
                `get`,
                `/api/service/${this.serviceId}/service-${this.resourceId}/${id}/remove-from-service`
              )
            )
            .then((res) => {
              this.ui.toast.success(
                `${this.resourceTitle} "${id}" serviced.`,
                { icon: `fa-caret-down` }
                //
              );
              resolve(res);
            })
            .catch((err) => reject(err))
            .finally(() => toast.remove());
        });
      },

      addConfig: (config) => {
        this.console.log(`CustomRest[${this.serviceId}]: addConfig() >> `);
        return new Promise((resolve, reject) => {
          const toast = this.ui.toast.info(
            `Adding new ${this.resourceTitle.toLowerCase()}.`
          );
          Promise.resolve()
            .then(() =>
              this.api.restCall(
                `post`,
                `/api/service/${this.serviceId}/config-${this.resourceId}`,
                config
              )
            )
            .then((res) => {
              this.ui.toast.success(
                `${this.resourceTitle} saving complete.`,
                { icon: `fa-save` }
                //
              );
              resolve(res);
            })
            .catch((err) => reject(err))
            .finally(() => toast.remove());
        });
      },

      editConfig: (id, config) => {
        this.console.log(`CustomRest[${this.serviceId}]: editConfig() >> `);
        return new Promise((resolve, reject) => {
          const toast = this.ui.toast.info(
            `Edit ${this.resourceTitle.toLowerCase()} "${id}".`
          );
          Promise.resolve()
            .then(() =>
              this.api.restCall(
                `put`,
                `/api/service/${this.serviceId}/config-${this.resourceId}/${id}`,
                config
              )
            )
            .then((res) => {
              this.ui.toast.success(
                `${this.resourceTitle} "${id}" edit complete.`,
                { icon: `fa-save` }
              );
              resolve(res);
            })
            .catch((err) => reject(err))
            .finally(() => toast.remove());
        });
      },

      deleteConfig: (id) => {
        this.console.log(`CustomRest[${this.serviceId}]: deleteConfig() >> `);
        return new Promise((resolve, reject) => {
          const toast = this.ui.toast.info(
            `Delete ${this.resourceTitle.toLowerCase()} "${id}".`,
            { icon: `fa-trash-alt` }
          );
          Promise.resolve()
            .then(() =>
              this.api.restCall(
                `delete`,
                `/api/service/${this.serviceId}/config-${this.resourceId}/${id}`
              )
            )
            .then((res) => {
              this.ui.toast.success(
                `${this.resourceTitle} "${id}" delete complete.`,
                { icon: `fa-trash-alt` }
              );
              resolve(res);
            })
            .catch((err) => reject(err))
            .finally(() => toast.remove());
        });
      },
    });
  }
}
