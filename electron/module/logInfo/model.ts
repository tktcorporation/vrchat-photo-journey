import { PrismaClient } from '@prisma/client';
import type { VRChatWorldJoinLog } from '../vrchatLog/service';

const createVRChatWorldJoinLog =
  (prisma: PrismaClient) =>
  async (vrchatWorldJoinLogList: VRChatWorldJoinLog[]) => {
    // すべての joinDateTime と worldInstanceId を取得
    const existingLogs = await prisma.vRChatWorldJoinLog.findMany({
      select: {
        joinDateTime: true,
        worldInstanceId: true,
      },
    });

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
    const vrchatWorldJoinLogList = await prisma.vRChatWorldJoinLog.findMany({
      orderBy: {
        joinDateTime: 'desc',
      },
    });
    return vrchatWorldJoinLogList;
  };

/**
 * 指定した日時の直前にjoinしたワールドの情報を取得する
 */
export const findRecentVRChatWorldJoinLog =
  (prisma: PrismaClient) => async (dateTime: Date) => {
    const vrchatWorldJoinLog = await prisma.vRChatWorldJoinLog.findFirst({
      where: {
        joinDateTime: {
          lte: dateTime,
        },
      },
      orderBy: {
        joinDateTime: 'desc',
      },
    });

    return vrchatWorldJoinLog;
  };

let rdbClient: ReturnType<typeof _getRDBClient> | null = null;
const _getRDBClient = (props: { db_url: string }) => {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: props.db_url,
      },
    },
  });
  return {
    __db_url: props.db_url,
    __client: client,
    createVRChatWorldJoinLog: createVRChatWorldJoinLog(client),
    findAllVRChatWorldJoinLogList: findAllVRChatWorldJoinLogList(client),
    findRecentVRChatWorldJoinLog: findRecentVRChatWorldJoinLog(client),
  };
};
export const initRDBClient = (props: { db_url: string }) => {
  if (rdbClient !== null) {
    if (rdbClient.__db_url !== props.db_url) {
      throw new Error(
        `rdbClient is already initialized with ${rdbClient.__db_url}`,
      );
    }
    return rdbClient;
  }
  rdbClient = _getRDBClient({
    db_url: props.db_url,
  });
  return rdbClient;
};
export const getRDBClient = () => {
  if (rdbClient === null) {
    throw new Error('rdbClient is not initialized');
  }
  return rdbClient;
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
