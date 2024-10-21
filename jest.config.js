const commonConfig = {
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          transform: {
            decoratorMetadata: true,
          },
        },
      },
    ],
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/main/',
    '/playwright/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // 共通のエイリアス設定
  },
};

module.exports = {
  projects: [
    {
      ...commonConfig, // 共通の設定
      displayName: 'electron',
      testMatch: ['<rootDir>/electron/**/*.(spec|test).(ts|tsx|js|jsx)'], // electron 用のテストファイル
      setupFilesAfterEnv: ['<rootDir>/jest.electron.setup.js'], // electron 用の setup
    },
    {
      ...commonConfig, // 共通の設定
      displayName: 'src',
      testMatch: ['<rootDir>/src/**/*.(spec|test).(ts|tsx|js|jsx)'], // src 用のテストファイル
    },
  ],
};
