import * as client from './electron/lib/sequelize';

// Sentryのモック設定
jest.mock('@sentry/electron/main', () => ({
  captureException: jest.fn(),
  init: jest.fn(),
}));

// beforeAll(async () => {
//   client.__initTestRDBClient();
// }, 10000);

// beforeEach(async () => {
//   await client.syncRDBClient({
//     checkRequired: false,
//   });
// });

afterAll(async () => {
  await client.__cleanupTestRDBClient();
});
