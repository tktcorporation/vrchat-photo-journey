// Logファイルの取得に失敗した場合のエラー
class VRChatLogFileReadError extends Error {
  vrchatLogfileDir: string;

  constructor(vrchatLogfileDir: string) {
    super(`Log file read error: ${vrchatLogfileDir}`);
    this.vrchatLogfileDir = vrchatLogfileDir;
  }
}

export { VRChatLogFileReadError };
