import * as client from './electron/lib/sequelize';

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
