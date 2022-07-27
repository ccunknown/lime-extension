module.exports = {
  // Standard JavaScript Style Guide
  // extends: ["eslint:recommended", "prettier"],
  // extends: [
  //    "eslint:recommended",
  //    "plugin:prettier/recommended"
  // ],
  // Airbnb JavaScript Style Guide
  extends: ["airbnb", "plugin:prettier/recommended"],
  // Google JavaScript Style Guide
  // extends: ["google", "plugin:prettier/recommended"],
  plugins: [
    // "import",
    "prettier",
  ],

  rules: {
    semi: ["error", "always"],
   //  "no-underscore-dangle": "allow",
    "prettier/prettier": ["warn"],
  },
  parserOptions: {
    ecmaVersion: 2015,
    sourceType: "module",
  },
  env: {
    // es5: true,
    es6: true,
    // browser: true,
    node: true,
    // jest: true
  },
  ignorePatterns: ["node_modules"],
};
