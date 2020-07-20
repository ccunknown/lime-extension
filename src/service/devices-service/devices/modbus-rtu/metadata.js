let metadata = {
  "device-config": {
    "type": "object",
    "required": [],
    "additionalProperties": false,
    "properties": {
      "script": {
        "type": "string"
      },
      "engine": {
        "type": "string"
      },
      "device": {
        "type": "string"
      },
      "address": {
        "type": "number",
        "default": 1,
        "min": 1
      }
    }
  },
  "property-config": {
    "default-property": {
      "type": "object",
      "required": ["property", "address", "table", "periode"],
      "additionalProperties": false,
      "properties": {
        "property": {
          "type": "string",
          "default": "default-property"
        },
        "address": {
          "type": "number",
          "default": 0
        },
        "table": {
          "type": "string",
          "default": "inputRegisters",
          "enum": [
            "coils",
            "contacts",
            "inputRegisters",
            "holdingRegisters"
          ]
        },
        "periode": {
          "type": "number",
          "default": 1000,
          "min": 1000
        }
      }
    }
  }
};

module.exports = metadata;