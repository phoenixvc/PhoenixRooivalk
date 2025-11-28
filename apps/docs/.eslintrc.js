module.exports = {
  extends: ["eslint:recommended"],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  globals: {
    // Browser globals
    setTimeout: "readonly",
    clearTimeout: "readonly",
    setInterval: "readonly",
    clearInterval: "readonly",
    console: "readonly",
    window: "readonly",
    document: "readonly",
    fetch: "readonly",
    localStorage: "readonly",
    sessionStorage: "readonly",
    URL: "readonly",
    URLSearchParams: "readonly",
    FormData: "readonly",
    Blob: "readonly",
    File: "readonly",
    FileReader: "readonly",
    AbortController: "readonly",
    AbortSignal: "readonly",
    MutationObserver: "readonly",
    ResizeObserver: "readonly",
    IntersectionObserver: "readonly",
    TextEncoder: "readonly",
    TextDecoder: "readonly",
    requestAnimationFrame: "readonly",
    cancelAnimationFrame: "readonly",
    CustomEvent: "readonly",
  },
  rules: {
    // Allow Docusaurus imports
    "import/no-unresolved": "off",
    // Allow React imports
    "import/default": "off",
    // Allow unused variables that start with underscore
    "no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
  },
  overrides: [
    {
      // Test files
      files: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/__tests__/**/*.ts",
        "**/__tests__/**/*.tsx",
      ],
      env: {
        jest: true,
      },
      globals: {
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        test: "readonly",
      },
    },
  ],
};
