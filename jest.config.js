module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  collectCoverage:true,
  collectCoverageFrom: [
    "entities.ts"
  ]
};