const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
  customExportConditions: ["node", "node-addons"]
});

const config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1"
  },
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/", "<rootDir>/visual-tests/"],
  collectCoverageFrom: [
    "components/**/*.tsx",
    "pages/**/*.tsx",
    "services/**/*.ts",
    "utils/**/*.ts",
    "contexts/**/*.tsx",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!coverage/**"
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30
    }
  }
};

module.exports = createJestConfig(config);
