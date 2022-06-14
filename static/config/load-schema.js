(function() {

  let schema = {
    "extension": {
      "short": "lime",
      "full": "lime-extension",
      "html": "extension-lime",
      "code": "LimeExtension",
      "title-short": "LiME",
      "title-full": "LiME Extension",
      "debug": false,
      "config": {
        "config-sync": {
          "enable": false,
          "period": 10000
        },
        "api": {
          "timeout": 5000
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
                "vue",
                // "vue-multiselect",
                "vue-tags-input",
                "vue-toasted",
                "popper",
                "bootstrap",
                
                "extension-script-collector",
                "extension-script-api",
                "extension-script-raid",
                "extension-script-ui",
                "extension-script-page",
                "extension-script-webrtc-channel-pair",
                "extension-script-webrtc-session",
                "extension-script-webrtc-rtcpeer"
              ]
            },
            {
              "type": "parallel",
              "load": [
                "page-devices",
                "page-scripts",
                "page-engines",
                "page-sysport"
              ]
            },
            {
              "type": "parallel",
              "load": [
                "vue-component-json-schema-template",
                "vue-component-json-schema-script"
              ]
            }
          ]
        },
        {
          "type": "parallel",
          "load": [
            "extension-view-main",
            "extension-view-resource",
            "custom-rest",
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
      "extension-script-webrtc-rtcpeer": {
        "type": "core-script",
        "path": "/core/js/webrtc/rtcpeer.js",
        "object-name": "ExtensionRTCPeer",
        "core": "rtcPeer",
      },
      "extension-script-webrtc-session": {
        "type": "global-script",
        "path": "/core/js/webrtc/session.js",
        "object-name": "ExtensionRTCSession",
        // "windowObj": "ExtensionRTCSession",
        // "core": "rtcSession"
      },
      "extension-script-webrtc-channel-pair": {
        "type": "global-script",
        "path": "/core/js/webrtc/channel-pair.js",
        "object-name": "ExtensionRTCChannelPair",
        // "windowObj": "ExtensionRTCChannelPair",
        // "core": "rtcChannelPair"
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
        "path": "/resource/js/jquery.min.js",
        "windowObj": "jQuery"
      },
      "mustache": {
        "type": "script",
        "path": "/resource/js/mustache.js"
      },
      "vue": {
        "type": "script",
        "path": "/resource/js/vue.js"
      },
      "vue-multiselect": {
        "type": "script",
        "path": "/resource/js/vue-multiselect.min.js"
      },
      "vue-tags-input": {
        "type": "script",
        "path": "/resource/js/vue-tags-input.js"
      },
      "vue-toasted": {
        "type": "script",
        "path": "/resource/js/vue-toasted.js"
      },
      "popper": {
        "type": "script",
        "path": "/resource/js/popper.min.js",
        "windowObj": "Popper"
      },
      "bootstrap": {
        "type": "script",
        "path": "/resource/js/bootstrap.min.js",
        "windowObj": "bootstrap"
      },

      "vue-component-json-schema-template": {
        "type": "vue-component-template",
        "path": "/custom/vue/template/jsonSchemaVue/template.html"
      },
      "vue-component-json-schema-script": {
        "type": "vue-component-script",
        "path": "/custom/vue/template/jsonSchemaVue/script.js",
        "object-name": "jsonSchemaVue"
      },


      "page-devices": {
        "name": "devices",
        "type": "custom-view",
        "path": "/custom/views/devices.html",
        // "icon": "fas fa-calculator",
        "icon": "fas fa-network-wired",
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
      },

      "custom-rest": {
        "type": "custom-script",
        "path": "/custom/js/custom-rest.js",
        "object-name": "CustomRest"
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
