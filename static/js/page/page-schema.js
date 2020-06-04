var LimeExtensionLoadStructure = {
  "flow": [
    {
      "type": "loader",
      "load": {
        ""
      }
    }
  ],

  "define": {
    "jquery": {
      "type": "script",
      "path": "/js/jquery.min.js"
    },
    "popper": {
      "type": "script",
      "path": "/js/popper.min.js"
    }
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

    "page-vthings": {
      "type": "page",
      "path": "/views/page-vthings.html",
      "icon": "fas fa-user"
    },
    "script-vthings": {
      "type": "page-script",
      "path": "/js/page/vthings.js",
      "object": "LimeExtensionPageVthings"
    }

    "page-devices": {
      "type": "page",
      "path": "/views/page-devices.html",
      "icon": "fas fa-user"
    },
    "script-devices": {
      "type": "page-script",
      "path": "/js/page/devices.js",
      "object": "LimeExtensionPageDevices"
    }

    "page-scripts": {
      "type": "page",
      "path": "/views/page-scripts.html",
      "icon": "fas fa-user"
    },
    "script-scripts": {
      "type": "page-script",
      "path": "/js/page/scripts.js",
      "object": "LimeExtensionPageScripts"
    }

    "page-engines": {
      "type": "page",
      "path": "/views/page-engines.html",
      "icon": "fas fa-user"
    },
    "script-engines": {
      "type": "page-script",
      "path": "/js/page/engines.js",
      "object": "LimeExtensionPageEngines"
    }

    "page-sysport": {
      "type": "page",
      "path": "/views/page-sysport.html",
      "icon": "fas fa-user"
    },
    "script-sysport": {
      "type": "page-script",
      "path": "/js/page/sysport.js",
      "object": "LimeExtensionPageSysport"
    }
  }
};