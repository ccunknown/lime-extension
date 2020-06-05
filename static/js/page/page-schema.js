var LimeExtensionLoadStructure = {

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
              "popper",
              "bootstrap",
              "lime-console",
              "lime-collector",
              "lime-api",
              "lime-raid",
              "lime-ui"
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
    "jquery": {
      "type": "script",
      "path": "/js/jquery.min.js"
    },
    "popper": {
      "type": "script",
      "path": "/js/popper.min.js"
    },
    "bootstrap": {
      "type": "script",
      "path": "/js/bootstrap.min.js"
    },
    "lime-console": {
      "type": "script",
      "path": "/js/sys/lime-console.js"
    },
    "lime-collector": {
      "type": "script",
      "path": "/js/sys/lime-collector.js"
    },
    "lime-api": {
      "type": "script",
      "path": "/js/sys/lime-api.js"
    },
    "lime-raid": {
      "type": "script",
      "path": "/js/sys/lime-raid.js"
    },
    "lime-ui": {
      "type": "script",
      "path": "/js/sys/lime-ui.js"
    },

    "page-main": {
      "type": "page-main",
      "path": "/views/main.html"
    },

    "page-vthings": {
      "type": "page",
      "path": "/views/page-vthings.html",
      "icon": "fas fa-user",
      "link-script": "script-vthings"
    },
    "script-vthings": {
      "type": "page-script",
      "path": "/js/page/vthings.js",
      "object": "LimeExtensionPageVthings"
    },

    "page-devices": {
      "type": "page",
      "path": "/views/page-devices.html",
      "icon": "fas fa-user",
      "link-script": "script-devices"
    },
    "script-devices": {
      "type": "page-script",
      "path": "/js/page/devices.js",
      "object": "LimeExtensionPageDevices"
    },

    "page-scripts": {
      "type": "page",
      "path": "/views/page-scripts.html",
      "icon": "fas fa-user",
      "link-script": "script-scripts"
    },
    "script-scripts": {
      "type": "page-script",
      "path": "/js/page/scripts.js",
      "object": "LimeExtensionPageScripts"
    },

    "page-engines": {
      "type": "page",
      "path": "/views/page-engines.html",
      "icon": "fas fa-user",
      "link-script": "script-engines"
    },
    "script-engines": {
      "type": "page-script",
      "path": "/js/page/engines.js",
      "object": "LimeExtensionPageEngines"
    },

    "page-sysport": {
      "type": "page",
      "path": "/views/page-sysport.html",
      "icon": "fas fa-user",
      "link-script": "script-sysport"
    },
    "script-sysport": {
      "type": "page-script",
      "path": "/js/page/sysport.js",
      "object": "LimeExtensionPageSysport"
    }
  }
};
