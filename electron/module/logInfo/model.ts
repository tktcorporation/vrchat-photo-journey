import { PrismaClient } from '@prisma/client';
import type { VRChatWorldJoinLog } from '../vrchatLog/service';

const prisma = new PrismaClient();

export const createVRChatWorldJoinLog = async (
  vrchatWorldJoinLogList: VRChatWorldJoinLog[],
) => {
  const vrchatWorldJoinLog = await prisma.vRChatWorldJoinLog.createMany({
    data: vrchatWorldJoinLogList.map((logInfo) => ({
      joinDateTime: logInfo.joinDate,
      worldId: logInfo.worldId,
      worldInstanceId: logInfo.worldInstanceId,
      worldName: logInfo.worldName,
    })),
  });

  return vrchatWorldJoinLog;
};

export const findAllVRChatWorldJoinLogList = async () => {
  const vrchatWorldJoinLogList = await prisma.vRChatWorldJoinLog.findMany();
  return vrchatWorldJoinLogList;
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
