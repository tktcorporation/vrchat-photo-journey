import { PrismaClient } from '@prisma/client';
import type { VRChatWorldJoinLog } from '../vrchatLog/service';

// const prisma = new PrismaClient({
//   datasources: {
//     db: {
//       url: process.env.DATABASE_URL,
//     },
//   },
// });

// export const createVRChatWorldJoinLog = async (
//   vrchatWorldJoinLogList: VRChatWorldJoinLog[],
// ) => {
//   const vrchatWorldJoinLog = await prisma.vRChatWorldJoinLog.createMany({
//     data: vrchatWorldJoinLogList.map((logInfo) => ({
//       joinDateTime: logInfo.joinDate,
//       worldId: logInfo.worldId,
//       worldInstanceId: logInfo.worldInstanceId,
//       worldName: logInfo.worldName,
//     })),
//   });

//   return vrchatWorldJoinLog;
// };
const createVRChatWorldJoinLog =
  (prisma: PrismaClient) =>
  async (vrchatWorldJoinLogList: VRChatWorldJoinLog[]) => {
    console.log('vrchatWorldJoinLogList', vrchatWorldJoinLogList);

    // すべての joinDateTime と worldInstanceId を取得
    const existingLogs = await prisma.vRChatWorldJoinLog.findMany({
      select: {
        joinDateTime: true,
        worldInstanceId: true,
      },
    });

    console.log('existingLogs', existingLogs);

    // Set を使用して重複チェック用のデータ構造を構築
    const existingSet = new Set(
      existingLogs.map(
        (log) => `${log.joinDateTime.toISOString()}|${log.worldInstanceId}`,
      ),
    );

    const newLogs = vrchatWorldJoinLogList
      .filter((logInfo) => {
        const key = `${logInfo.joinDate.toISOString()}|${
          logInfo.worldInstanceId
        }`;
        return !existingSet.has(key);
      })
      .map((logInfo) => ({
        joinDateTime: logInfo.joinDate,
        worldId: logInfo.worldId,
        worldInstanceId: logInfo.worldInstanceId,
        worldName: logInfo.worldName,
      }));

    if (newLogs.length > 0) {
      const vrchatWorldJoinLog = await prisma.vRChatWorldJoinLog.createMany({
        data: newLogs,
      });

      return vrchatWorldJoinLog;
    }

    return { count: 0 };
  };

export const findAllVRChatWorldJoinLogList =
  (prisma: PrismaClient) => async () => {
    const vrchatWorldJoinLogList = await prisma.vRChatWorldJoinLog.findMany();
    return vrchatWorldJoinLogList;
  };

export const getRDBClient = (db_file_path: string) => {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: `file:${db_file_path}`,
      },
    },
  });
  return {
    createVRChatWorldJoinLog: createVRChatWorldJoinLog(client),
    findAllVRChatWorldJoinLogList: findAllVRChatWorldJoinLogList(client),
  };
};

// createVRChatWorldJoinLog()
//   .then(async () => {
//     await prisma.$disconnect()
//   })
//   .catch(async (e) => {
//     console.error(e)
//     await prisma.$disconnect()
//     process.exit(1)
//   })
