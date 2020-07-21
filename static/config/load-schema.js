(function() {

  let schema = {
    "extension": {
      "short": "lime",
      "full": "lime-extension",
      "html": "extension-lime",
      "title-short": "LiME",
      "title-full": "LiME Extension",
      "debug": true,
      "config": {
        "config-sync": {
          "enable": false,
          "period": 10000
        }
      }
    },
    "flow": {
      "type": "sequential",
      "load": [
        {
          "type": "parallel",
          "load": [
            {
              "type": "sequential",
              "load": [
                "jquery",
                "mustache",
                //"crypto-js",
                "vue",
                "vue-multiselect",
                "vue-tags-input",
                "popper",
                "bootstrap",
                
                "extension-script-collector",
                "extension-script-api",
                "extension-script-raid",
                "extension-script-ui",
                "extension-script-page"
              ]
            },
            {
              "type": "parallel",
              "load": [
                "page-vthings",
                "page-devices",
                "page-scripts",
                "page-engines",
                "page-sysport"
              ]
            }
          ]
        },
        {
          "type": "parallel",
          "load": [
            "extension-view-main",
            "extension-view-resource",
            "script-vthings",
            "script-devices",
            "script-scripts",
            "script-engines",
            "script-sysport"
          ]
        }
      ]
    },

    "define": {

      "extension-script-collector": {
        "type": "core-script",
        "path": "/core/js/collector.js",
        "object-name": "ExtensionConsole",
        "core": "collector"
      },
      "extension-script-api": {
        "type": "core-script",
        "path": "/core/js/api.js",
        "object-name": "ExtensionApi",
        "core": "api"
      },
      "extension-script-raid": {
        "type": "core-script",
        "path": "/core/js/raid.js",
        "object-name": "ExtensionRaid",
        "core": "raid"
      },
      "extension-script-ui": {
        "type": "core-script",
        "path": "/core/js/ui.js",
        "object-name": "ExtensionUi",
        "core": "ui"
      },
      "extension-script-page": {
        "type": "core-script",
        "path": "/core/js/page.js",
        "object-name": "ExtensionPage",
        "core": "page"
      },

      "extension-view-resource": {
        "type": "core-view",
        "path": "/core/views/resource.html",
        "core": "page-resource"
      },
      "extension-view-main": {
        "type": "core-view",
        "path": "/core/views/main.html",
        "core": "page-main"
      },

      "jquery": {
        "type": "script",
        "path": "/js/jquery.min.js"
      },
      "mustache": {
        "type": "script",
        "path": "/js/mustache.js"
      },
      /*
      "crypto-js": {
        "type": "script",
        "path": "/js/crypto-js.min.js"
      },
      */
      "vue": {
        "type": "script",
        "path": "/js/vue.js"
      },
      "vue-multiselect": {
        "type": "script",
        "path": "/js/vue-multiselect.min.js"
      },
      "vue-tags-input": {
        "type": "script",
        "path": "/js/vue-tags-input.js"
      },
      "popper": {
        "type": "script",
        "path": "/js/popper.min.js"
      },
      "bootstrap": {
        "type": "script",
        "path": "/js/bootstrap.min.js"
      },


      "page-vthings": {
        "name": "vthings",
        "type": "custom-view",
        "path": "/custom/views/vthings.html",
        "icon": "fas fa-paper-plane",
        "link-script": "script-vthings"
      },
      "script-vthings": {
        "type": "custom-script",
        "path": "/custom/js/vthings.js",
        "object-name": "LimeExtensionPageVthings"
      },


      "page-devices": {
        "name": "devices",
        "type": "custom-view",
        "path": "/custom/views/devices.html",
        "icon": "fas fa-calculator",
        "link-script": "script-devices"
      },
      "script-devices": {
        "type": "custom-script",
        "path": "/custom/js/devices.js",
        "object-name": "LimeExtensionPageDevices"
      },


      "page-scripts": {
        "name": "scripts",
        "type": "custom-view",
        "path": "/custom/views/scripts.html",
        "icon": "fas fa-file-code",
        "link-script": "script-scripts"
      },
      "script-scripts": {
        "type": "custom-script",
        "path": "/custom/js/scripts.js",
        "object-name": "LimeExtensionPageScripts"
      },


      "page-engines": {
        "name": "engines",
        "type": "custom-view",
        "path": "/custom/views/engines.html",
        "icon": "fas fa-cogs",
        "link-script": "script-engines"
      },
      "script-engines": {
        "type": "custom-script",
        "path": "/custom/js/engines.js",
        "object-name": "LimeExtensionPageEngines"
      },


      "page-sysport": {
        "name": "sysport",
        "type": "custom-view",
        "path": "/custom/views/sysport.html",
        "icon": "fab fa-usb",
        "link-script": "script-sysport"
      },
      "script-sysport": {
        "type": "custom-script",
        "path": "/custom/js/sysport.js",
        "object-name": "PageSysport"
      }
    }
  };

  return new Promise(async (resolve, reject) => {
    let Extension = (await import(`/extensions/${schema.extension.full}/static/core/js/extension.js`)).default;
    //console.log(Extension);
    new Extension(schema);
    resolve();
  });

}) ();
