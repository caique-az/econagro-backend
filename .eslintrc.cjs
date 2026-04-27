module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2022: true,
    jest: true,
  },
  extends: ["airbnb-base", "prettier"],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {
    "no-console": "off",

    // Controllers stateless em classe. Ou desliga isso, ou reescreve tudo para funções.
    "class-methods-use-this": "off",

    // MongoDB usa _id.
    "no-underscore-dangle": [
      "error",
      {
        allow: ["_id"],
        allowAfterThis: true,
      },
    ],

    // Express error middleware precisa do 4º arg mesmo se não usar.
    "no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],

    // Node moderno não precisa desse drama contra for..of.
    "no-restricted-syntax": [
      "error",
      "ForInStatement",
      "LabeledStatement",
      "WithStatement",
    ],

    "consistent-return": "off",
  },
};
