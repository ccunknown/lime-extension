const Defaults = {
  extension: {
    name: "lime",
    version: "0.1.0",
  },
  config: {
    service: {
      //  Port Service
      "sysport-service": {
        path: "sysport-service/sysport-service.js",
        enable: true,
        status: "unknow",
        description: "Port resource controller, provide port to engine.",
      },
      //  Engine Service
      "engines-service": {
        path: "/engines-service/engines-service.js",
        enable: true,
        status: "unknow",
        description:
          "Engine is a solution to provide data from port to script.",
      },
      //  Script Service
      "scripts-service": {
        path: "/scripts-service/scripts-service.js",
        enable: true,
        status: "unknow",
        description:
          "Controller of scripts of slave serial devices, used to translatation for devices-service.",
      },
      //  Device Service
      "devices-service": {
        path: "/devices-service/devices-service.js",
        enable: true,
        status: "unknow",
        description:
          "A combination of script and engine to define what was device should be.",
      },
      // Rtcpeer Service
      "rtcpeer-service": {
        path: "/rtcpeer-service/rtcpeer-service.js",
        enable: true,
        status: "unknow",
        description: "Client - Server communitaction service using WEBRTC.",
      },
    },
    "service-config": {
      //  Port Service
      "sysport-service": {
        list: {},
      },
      //  Engine Service
      "engines-service": {
        directory: "/engines",
        list: {},
      },
      //  Script Service
      "scripts-service": {
        directory: "/scripts",
        list: {},
      },
      //  Device Service
      "devices-service": {
        directory: "/devices",
        list: {},
      },
      // Rtcpeer Service
      "rtcpeer-service": {
        peerConnectionConfig: {
          iceServers: [
            {
              urls: [
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
              ],
            },
          ],
          iceCandidatePoolSize: 10,
        },
        session: {
          handshake: {
            // Handshake interval.
            period: 3000,
            // Counter of continuous fail handshake to be abort session.
            abortcountdown: 5,
          },
        },
        channel: {
          callrespond: {
            timeout: 3000,
          },
        },
      },
    },
  },
  schema: {
    type: "object",
    required: ["service"],
    additionalProperties: false,
    properties: {
      service: {
        type: "object",
        additionalProperties: false,
        patternProperties: {
          "^.+-service$": {
            type: "object",
            required: ["path", "enable"],
            additionalProperties: false,
            properties: {
              path: {
                type: "string",
              },
              enable: {
                type: "boolean",
              },
              status: {
                type: "string",
              },
              description: {
                type: "string",
              },
            },
          },
        },
      },
      "service-config": {
        type: "object",
        required: [
          "sysport-service",
          "engines-service",
          "scripts-service",
          "devices-service",
        ],
        additionalProperties: false,
        properties: {
          //  Port Service
          "sysport-service": {
            type: "object",
            required: ["list"],
            additionalProperties: false,
            properties: {
              list: {
                type: "object",
                default: {},
                additionalProperties: false,
                patternProperties: {
                  ".+": {
                    type: "object",
                  },
                },
              },
            },
          },
          //  Engine Service
          "engines-service": {
            type: "object",
            required: ["directory", "list"],
            additionalProperties: false,
            properties: {
              directory: {
                type: "string",
              },
              list: {
                type: "object",
                default: {},
                additionalProperties: false,
                patternProperties: {
                  ".+": {
                    type: "object",
                    // "required": ["name", "engine", "port"],
                    // "additionalProperties": false,
                    // "properties": {
                    //   "name": {
                    //     "type": "string"
                    //   },
                    //   "engine": {
                    //     "type": "string"
                    //   },
                    //   "port": {
                    //     "type": "string"
                    //   }
                    // }
                    required: ["name", "description", "template"],
                    additionalProperties: true,
                    properties: {
                      name: {
                        type: "string",
                      },
                      description: {
                        type: "string",
                      },
                      template: {
                        type: "string",
                      },
                      _config: {
                        type: "object",
                        required: ["addToService"],
                        additionalProperties: true,
                        properties: {
                          addToService: {
                            type: "boolean",
                            default: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          //  Script Service
          "scripts-service": {
            type: "object",
            required: ["directory"],
            additionalProperties: false,
            properties: {
              directory: {
                type: "string",
              },
              list: {
                type: "object",
                default: {},
                additionalProperties: false,
                patternProperties: {
                  ".+": {
                    $id: "#fileStructurObject",
                    type: "object",
                    required: ["name", "type", "meta", "children"],
                    additionalProperties: false,
                    properties: {
                      name: {
                        type: "string",
                      },
                      type: {
                        type: "string",
                        default: "directory",
                        enum: ["directory", "file"],
                      },
                      meta: {
                        type: "object",
                        required: [],
                        additionalProperties: false,
                        properties: {
                          title: {
                            type: "string",
                          },
                          description: {
                            type: "string",
                          },
                          tags: {
                            type: "array",
                            default: [],
                            items: {
                              type: "string",
                            },
                          },
                        },
                      },
                      children: {
                        type: "array",
                        default: [],
                        items: {
                          // eslint-disable-next-line no-template-curly-in-string
                          "${ref}": "#fileStructurObject",
                          required: ["name", "type"],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          //  Device Service
          "devices-service": {
            type: "object",
            required: ["directory", "list"],
            additionalProperties: false,
            properties: {
              directory: {
                type: "string",
              },
              list: {
                type: "object",
                default: {},
                additionalProperties: false,
                patternProperties: {
                  ".+": {
                    type: "object",
                    required: ["name", "description", "template", "properties"],
                    additionalProperties: true,
                    properties: {
                      name: {
                        type: "string",
                      },
                      description: {
                        type: "string",
                      },
                      template: {
                        type: "string",
                      },
                      properties: {
                        type: "object",
                        default: {},
                      },
                    },
                  },
                },
              },
            },
          },
          //  RTCPeer Service
          "rtcpeer-service": {
            type: "object",
            required: ["peerConnectionConfig", "session", "channel"],
            properties: {
              peerConnectionConfig: {
                type: "object",
              },
              session: {
                type: "object",
              },
              channel: {
                type: "object",
              },
            },
          },
        },
      },
    },
  },
};

module.exports = Defaults;
