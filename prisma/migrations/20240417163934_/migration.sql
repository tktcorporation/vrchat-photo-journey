-- CreateTable
CREATE TABLE "VRChatWorldJoinLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worldId" TEXT NOT NULL,
    "worldName" TEXT NOT NULL,
    "worldInstanceId" TEXT NOT NULL,
    "joinDateTime" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VRChatPlayerJoinLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerName" TEXT NOT NULL,
    "joinDateTime" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "VRChatWorldJoinLog_worldInstanceId_joinDateTime_key" ON "VRChatWorldJoinLog"("worldInstanceId", "joinDateTime");

-- CreateIndex
CREATE UNIQUE INDEX "VRChatPlayerJoinLog_playerName_joinDateTime_key" ON "VRChatPlayerJoinLog"("playerName", "joinDateTime");
