let Errors = {};

const errDef = [
  {
    "name": "Http404",
    "super": (arg) => `Resource not found.`,
    "httpResponse": {
      "status": 404
    }
  },
  {
    "name": "AcceptOnlyJsonBody",
    "super": (arg) => `Content-type must be "application/json".`,
    "httpResponse": {
      "status": 406,
      "contentType": "text/plain",
      "contentIndex": "message"
    }
  },
  {
    "name": "RespondOnlyJsonType",
    "super": (arg) => `Server only respond with "application/json".`,
    "httpResponse": {
      "status": 406,
      "contentType": "text/plain",
      "contentIndex": "message"
    }
  },
  {
    "name": "ErrorParameterNotFound",
    "extends": Error,
    "super": (arg) => `Error process not found parameter "${arg}".`,
    "httpResponse": {
      "status": 500,
      "contentType": "text/plain",
      "contentIndex": "stack"
    }
  },
  {
    "name": "ErrorObjectNotReturn",
    "extends": Error,
    "super": (arg) => `Error object not return.`,
    "httpResponse": {
      "status": 500,
      "contentType": "text/plain",
      "contentIndex": "stack"
    }
  },
  {
    "name": "DatabaseObjectUndefined",
    "extends": Error,
    "super": (arg) => `Database object is ${arg}.`,
    "httpResponse": {
      "status": 500,
      "contentType": "text/plain",
      "contentIndex": "stack"
    }
  },
  {
    "name": "InvalidConfigSchema",
    "extends": Error,
    "super": (arg) => JSON.stringify(arg),
    "httpResponse": {
      "status": 400,
      "contentType": "application/json",
      "contentIndex": "message"
    }
  },
  {
    "name": "FoundDuplicate",
    "extends": Error,
    "super": (arg) => `'${arg}' already exists.`,
    "httpResponse": {
      "status": 403,
      "contentType": "application/json",
      "contentIndex": "message"
    }
  },
  {
    "name": "FoundMultipleWebhookItem",
    "extends": Error,
    "super": (arg) => `Found multiple webhook with name '${arg}'.`,
    "httpResponse": {
      "status": 500,
      "contentType": "application/json",
      "contentIndex": "message"
    }
  },
  {
    "name": "ObjectNotFound",
    "extends": Error,
    "super": (arg) => `Object with name '${arg}' not found.`,
    "httpResponse": {
      "status": 404,
      "contentType": "application/json",
      "contentIndex": "message"
    }
  },
  {
    "name": "PathNotFound",
    "extends": Error,
    "super": (arg) => `Path '${arg}' not found.`,
    "httpResponse": {
      "status": 404,
      "contentType": "application/json",
      "contentIndex": "message"
    }
  },
  {
    "name": "PathInvalid",
    "extends": Error,
    "super": (arg) => `Path '${arg}' is invalid.`,
    "httpResponse": {
      "status": 400,
      "contentType": "application/json",
      "contentIndex": "message"
    }
  },
  {
    "name": "PathAlreadyExists",
    "extends": Error,
    "super": (arg) => `Path '${arg}' already exists.`,
    "httpResponse": {
      "status": 400,
      "contentType": "application/json",
      "contentIndex": "message"
    }
  },
  {
    "name": "QueryParameterNotFound",
    "extends": Error,
    "super": (arg) => `Parameter '${arg[0]}' with value '${arg[1]}' not found.`,
    "httpResponse": {
      "status": 400,
      "contentType": "application/json",
      "contentIndex": "message"
    }
  },
  {
    "name": "ObjectPathNameMismatch",
    "extends": Error,
    "super": (arg) => `Object url path mismatch to payload (found '${arg}').`,
    "httpResponse": {
      "status": 403,
      "contentType": "application/json",
      "contentIndex": "message"
    }
  },
  {
    "name": "FoundDuplicateServiceId",
    "extends": Error,
    "super": (arg) => `Found multiple service which id '${arg}'.`,
    "httpResponse": {
      "status": 403,
      "contentType": "application/json",
      "contentIndex": "message"
    }
  },
  {
    "name": "ParentObjectUnavailable",
    "extends": Error,
    "super": (arg) => `Parent object of '${arg}' is unavailable.`,
    "httpResponse": {
      "status": 500,
      "contentType": "application/json",
      "contentIndex": "message"
    }
  }
];

for(let i in errDef) {
  let elem = errDef[i];
  let extend = (elem.extends) ? elem.extends : Error;
  Errors[elem.name] = class extends extend {
    constructor(...arg) {
      super(elem.super(...arg));
      this.name = elem.name;
      Error.captureStackTrace(this, this.constructor);
    }
    
    getHttpResponse() {
      let res = Object.assign({}, elem.httpResponse);
      res.content = this[res.contentIndex];
      delete res.contentIndex;
      return res;
    }
  };
}

module.exports = Errors;