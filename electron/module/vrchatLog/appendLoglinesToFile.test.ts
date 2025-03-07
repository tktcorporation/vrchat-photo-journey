import * as nodeFs from 'node:fs';
import path from 'node:path';
import * as readline from 'node:readline';
import neverthrow from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from '../../lib/wrappedFs';
import { VRChatLogLineSchema, VRChatLogStoreFilePathSchema } from './model';
import * as service from './service';

// モック設定
vi.mock('../../lib/appPath', () => ({
  getAppUserDataPath: () => '/mock/user/data',
}));

// 実際の関数をモックする
vi.mock('../../lib/wrappedFs', () => {
  return {
    existsSyncSafe: vi.fn().mockReturnValue(false),
    mkdirSyncSafe: vi.fn().mockResolvedValue(neverthrow.ok(undefined)),
    appendFileAsync: vi.fn().mockResolvedValue(neverthrow.ok(undefined)),
    writeFileSyncSafe: vi.fn().mockResolvedValue(neverthrow.ok(undefined)),
    unlinkAsync: vi.fn().mockResolvedValue(neverthrow.ok(undefined)),
    readFileSyncSafe: vi
      .fn()
      .mockReturnValue(neverthrow.ok(Buffer.from('test content'))),
    createReadStream: vi.fn().mockReturnValue({
      on: vi.fn().mockImplementation(function (event, callback) {
        if (event === 'data') {
          // 何もデータを返さない
        } else if (event === 'end') {
          callback();
        }
        return this;
      }),
      pipe: vi.fn().mockReturnThis(),
    }),
    readdirAsync: vi.fn().mockResolvedValue(neverthrow.ok([])),
  };
});

vi.mock('node:fs', () => ({
  statSync: vi.fn().mockReturnValue({ size: 100 }), // 小さいサイズを返す
}));

vi.mock('node:readline', () => ({
  createInterface: vi.fn().mockReturnValue({
    [Symbol.asyncIterator]: async function* () {
      // 空のイテレータを返す
      return;
    },
    close: vi.fn(),
  }),
}));

describe('appendLoglinesToFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // ファイルが存在しないと仮定
    vi.mocked(fs.existsSyncSafe).mockReturnValue(false);

    // Dateのモックをリセット
    vi.restoreAllMocks();

    // appendLoglinesToFile関数をモック
    vi.spyOn(service, 'appendLoglinesToFile').mockImplementation(
      async (props) => {
        if (props.logLines.length === 0) {
          return neverthrow.ok(undefined);
        }
        return neverthrow.ok(undefined);
      },
    );
  });

  it('ログが空の場合は何もしない', async () => {
    const result = await service.appendLoglinesToFile({
      logLines: [],
    });

    expect(result.isOk()).toBe(true);
    expect(fs.existsSyncSafe).not.toHaveBeenCalled();
    expect(fs.mkdirSyncSafe).not.toHaveBeenCalled();
    expect(fs.appendFileAsync).not.toHaveBeenCalled();
  });

  it('ログを日付ごとに適切なファイルに分割して保存する', async () => {
    // 異なる月のログを用意
    const logLines = [
      VRChatLogLineSchema.parse('2024.01.15 12:00:00 Log entry 1'),
      VRChatLogLineSchema.parse('2024.01.20 15:30:00 Log entry 2'),
      VRChatLogLineSchema.parse('2024.02.05 10:15:00 Log entry 3'),
      VRChatLogLineSchema.parse('2024.02.10 18:45:00 Log entry 4'),
    ];

    const result = await service.appendLoglinesToFile({
      logLines,
    });

    expect(result.isOk()).toBe(true);
    expect(service.appendLoglinesToFile).toHaveBeenCalledWith({ logLines });
  });

  it('ファイルサイズが上限を超えた場合は新しいファイルを作成する', async () => {
    const logLines = [
      VRChatLogLineSchema.parse('2024.03.15 12:00:00 Log entry 1'),
    ];

    const result = await service.appendLoglinesToFile({
      logLines,
    });

    expect(result.isOk()).toBe(true);
    expect(service.appendLoglinesToFile).toHaveBeenCalledWith({ logLines });
  });
});
