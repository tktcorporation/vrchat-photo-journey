import { PrismaClient } from '@prisma/client';
import {
  type VRChatWorldJoinLog,
  getVRChaLogInfoFromLogPath,
} from '../vrchatLog/service';
import { getValidVRChatLogFileDir } from '../vrchatLogFileDir/service';

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

  console.log(vrchatWorldJoinLog);
};

export const findAllVRChatWorldJoinLogList = async () => {
  const vrchatWorldJoinLogList = await prisma.vRChatWorldJoinLog.findMany();
  console.log(vrchatWorldJoinLogList);
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
