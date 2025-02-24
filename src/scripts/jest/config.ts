export default {
  roots: ["<rootDir>/src/__tests__"],
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  automock: false,
  moduleFileExtensions: ["ts", "js", "json"],
  modulePaths: ["<rootDir>/src"],
  testRegex: ".*integration.test.ts",
  // setupFilesAfterEnv: ["<rootDir>/src/__tests__/global_teardown.ts"],
  verbose: true,
  testPathIgnorePatterns: ["/node_modules/", ".*test.ts.snap"]
};
