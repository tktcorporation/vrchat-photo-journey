import * as nodeFs from 'node:fs';
import * as path from 'node:path';
import * as datefns from 'date-fns';
import neverthrow from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAppUserDataPath } from '../../lib/wrappedApp';
import * as fs from '../../lib/wrappedFs';
import { VRChatLogLineSchema } from './model';
import {
  appendLoglinesToFile,
  getLegacyLogStoreFilePath,
  getLogStoreFilePathForDate,
  getLogStoreFilePathsInRange,
} from './service';

// getAppUserDataPathのモック
vi.mock('../../lib/wrappedApp', () => ({
  getAppUserDataPath: vi.fn().mockReturnValue('/mock/user/data'),
}));

// node:fsのモック
vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
  mkdirSync: vi.fn().mockReturnValue(undefined),
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
    rmdir: vi.fn().mockResolvedValue(undefined),
  },
  statSync: vi.fn().mockReturnValue({ size: 100 }),
}));

// fs操作のモック
vi.mock('../../lib/wrappedFs', () => ({
  existsSyncSafe: vi.fn().mockReturnValue(false),
  mkdirSyncSafe: vi.fn().mockReturnValue(neverthrow.ok(undefined)),
  appendFileAsync: vi.fn().mockReturnValue(neverthrow.ok(undefined)),
  writeFileSyncSafe: vi.fn().mockReturnValue(neverthrow.ok(undefined)),
  unlinkAsync: vi.fn().mockReturnValue(neverthrow.ok(undefined)),
  readFileSyncSafe: vi.fn().mockImplementation(() => {
    return neverthrow.ok(Buffer.from('test content'));
  }),
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
}));

describe('getLogStoreFilePathForDate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAppUserDataPath).mockReturnValue('/mock/user/data');
  });

  it('指定された日付に基づいて正しいパスを生成する', () => {
    const testDate = new Date('2024-05-15');
    const result = getLogStoreFilePathForDate(testDate);

    expect(result.value).toBe(
      path.join('/mock/user/data/logStore', '2024-05', 'logStore-2024-05.txt'),
    );
  });

  it('日付が指定されない場合は現在の日付を使用する', () => {
    // 現在の日付をモック
    const mockDate = new Date('2024-06-20');
    vi.setSystemTime(mockDate);

    try {
      const result = getLogStoreFilePathForDate(new Date());
      expect(result.value).toBe(
        path.join(
          '/mock/user/data/logStore',
          '2024-06',
          'logStore-2024-06.txt',
        ),
      );
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('getLogStoreFilePathsInRange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAppUserDataPath).mockReturnValue('/mock/user/data');
  });

  it('指定された日付からのログファイルパスを取得する', async () => {
    const startDate = new Date('2024-01-15');
    const mockDate = new Date('2024-03-20');
    vi.setSystemTime(mockDate);

    try {
      const result = await getLogStoreFilePathsInRange(startDate, mockDate);

      // 2024-01から2024-03までの3ヶ月分のパスが生成されることを確認
      expect(result).toHaveLength(3);
      expect(result[0].value).toBe(
        path.join(
          '/mock/user/data/logStore',
          '2024-01',
          'logStore-2024-01.txt',
        ),
      );
      expect(result[1].value).toBe(
        path.join(
          '/mock/user/data/logStore',
          '2024-02',
          'logStore-2024-02.txt',
        ),
      );
      expect(result[2].value).toBe(
        path.join(
          '/mock/user/data/logStore',
          '2024-03',
          'logStore-2024-03.txt',
        ),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('startDateが指定されない場合は現在の日付のファイルのみを取得する', async () => {
    const mockDate = new Date('2024-04-10');
    vi.setSystemTime(mockDate);

    try {
      const result = await getLogStoreFilePathsInRange(mockDate, mockDate);

      // 現在の月（2024-04）のパスのみが生成されることを確認
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(
        path.join(
          '/mock/user/data/logStore',
          '2024-04',
          'logStore-2024-04.txt',
        ),
      );
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('appendLoglinesToFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.existsSyncSafe).mockReturnValue(false);
  });

  it('ログを日付ごとに適切なファイルに分割して保存する', async () => {
    // 異なる月のログを用意
    const logLines = [
      VRChatLogLineSchema.parse('2024.01.15 12:00:00 Log entry 1'),
      VRChatLogLineSchema.parse('2024.01.20 15:30:00 Log entry 2'),
      VRChatLogLineSchema.parse('2024.02.05 10:15:00 Log entry 3'),
      VRChatLogLineSchema.parse('2024.02.10 18:45:00 Log entry 4'),
    ];

    const result = await appendLoglinesToFile({
      logLines,
    });

    expect(result.isOk()).toBe(true);

    // 2つの異なるディレクトリが作成されたことを確認
    expect(nodeFs.mkdirSync).toHaveBeenCalledTimes(4); // ルートディレクトリと月別ディレクトリの2つずつ
    expect(nodeFs.mkdirSync).toHaveBeenCalledWith(
      path.join('/mock/user/data/logStore', '2024-01'),
      { recursive: true },
    );
    expect(nodeFs.mkdirSync).toHaveBeenCalledWith(
      path.join('/mock/user/data/logStore', '2024-02'),
      { recursive: true },
    );

    // 2つの異なるファイルに書き込まれたことを確認
    expect(fs.writeFileSyncSafe).toHaveBeenCalledTimes(2);
    expect(fs.writeFileSyncSafe).toHaveBeenCalledWith(
      path.join('/mock/user/data/logStore', '2024-01', 'logStore-2024-01.txt'),
      '2024.01.15 12:00:00 Log entry 1\n2024.01.20 15:30:00 Log entry 2\n',
    );
    expect(fs.writeFileSyncSafe).toHaveBeenCalledWith(
      path.join('/mock/user/data/logStore', '2024-02', 'logStore-2024-02.txt'),
      '2024.02.05 10:15:00 Log entry 3\n2024.02.10 18:45:00 Log entry 4\n',
    );
  });

  it('ファイルサイズが上限を超えた場合は新しいファイルを作成する', async () => {
    const logLines = [
      VRChatLogLineSchema.parse('2024.03.15 12:00:00 Log entry 1'),
    ];

    // ファイルが存在すると仮定
    vi.mocked(fs.existsSyncSafe).mockReturnValue(true);

    // ファイルサイズが上限を超えていると仮定 (10MB以上)
    vi.mocked(nodeFs.statSync).mockReturnValue({
      size: 11 * 1024 * 1024, // 11MB
    } as ReturnType<typeof nodeFs.statSync>);

    // 現在の日時をモック
    const mockDate = new Date('2024-03-15T14:30:45');
    vi.setSystemTime(mockDate);

    try {
      const result = await appendLoglinesToFile({
        logLines,
      });

      expect(result.isOk()).toBe(true);

      // ディレクトリが作成されることを確認
      expect(nodeFs.mkdirSync).toHaveBeenCalledTimes(2); // ルートディレクトリと月別ディレクトリ

      // 新しいファイルに書き込まれたことを確認
      expect(fs.writeFileSyncSafe).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSyncSafe).toHaveBeenCalledWith(
        path.join(
          '/mock/user/data/logStore',
          '2024-03',
          'logStore-2024-03-20240315143045.txt',
        ),
        '2024.03.15 12:00:00 Log entry 1\n',
      );
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('vrchatLog service', () => {
  const mockUserDataPath = '/mock/user/data';
  const legacyLogPath = path.join(mockUserDataPath, 'logStore', 'logStore.txt');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAppUserDataPath).mockReturnValue(mockUserDataPath);
  });

  describe('getLegacyLogStoreFilePath', () => {
    it('should return null when legacy file does not exist', async () => {
      vi.mocked(nodeFs.existsSync).mockReturnValue(false);
      const result = await getLegacyLogStoreFilePath();
      expect(result).toBeNull();
    });

    it('should return path when legacy file exists', async () => {
      vi.mocked(nodeFs.existsSync).mockReturnValue(true);
      const result = await getLegacyLogStoreFilePath();
      expect(result).not.toBeNull();
      expect(result?.value).toBe(legacyLogPath);
    });
  });

  describe('getLogStoreFilePathsInRange', () => {
    it('should include both new and legacy format files when available', async () => {
      // レガシーファイルが存在すると仮定
      vi.mocked(nodeFs.existsSync).mockReturnValue(true);

      // 3ヶ月前からのログを取得
      const startDate = datefns.subMonths(new Date(), 3);
      const currentDate = new Date();
      const paths = await getLogStoreFilePathsInRange(startDate, currentDate);

      // 新形式のログファイル（4つの月：3ヶ月前、2ヶ月前、1ヶ月前、現在の月）
      expect(paths.length).toBe(4 + 1); // +1 はレガシーファイル

      // レガシーファイルが含まれていることを確認
      expect(paths.some((p) => p.value === legacyLogPath)).toBe(true);
    });

    it('should only include new format files when legacy file does not exist', async () => {
      // レガシーファイルが存在しないと仮定
      vi.mocked(nodeFs.existsSync).mockReturnValue(false);

      const startDate = datefns.subMonths(new Date(), 2);
      const currentDate = new Date();
      const paths = await getLogStoreFilePathsInRange(startDate, currentDate);

      // 新形式のログファイルのみ（3つの月：2ヶ月前、1ヶ月前、現在の月）
      expect(paths.length).toBe(3);

      // すべてのパスが新形式であることを確認
      for (const p of paths) {
        expect(p.value).not.toBe(legacyLogPath);
        expect(p.value).toMatch(/logStore-\d{4}-\d{2}\.txt$/);
      }
    });
  });
});
