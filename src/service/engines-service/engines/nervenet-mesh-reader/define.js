const ValidateConfigSchema = {
  "type": "object",
  "required": ["host", "dbpath", "period"],
  "additionalProperties": false,
  "properties": {
    "host": {
      "title": "NerveNet Host IP Address",
      "type": "string"
    },
    "username": {
      "title": "Username",
      "type": "string"
    },
    "password": {
      "title": "Password",
      "type": "string"
    },
    "dbpath": {
      "title": "Database Path",
      "type": "string",
      "default": "/var/tmp/loramesh.sqlite3"
    },
    "period": {
      "title": "Database Synconize Period (ms)",
      "type": "number",
      "default": 10000
    }
  }
};

const AlternateList = [];

const AttributeList = [];

module.exports = {
  ValidateConfigSchema,
  AttributeList,
  AlternateList
};