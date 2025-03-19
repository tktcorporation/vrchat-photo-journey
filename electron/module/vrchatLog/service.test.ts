import * as path from 'node:path';
import * as datefns from 'date-fns';
import neverthrow from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モックを先に定義
vi.mock('glob', () => ({
  glob: vi.fn(),
}));

vi.mock('../../lib/wrappedFs', () => ({
  existsSyncSafe: vi.fn(),
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

vi.mock('node:fs', () => ({
  statSync: vi.fn().mockReturnValue({ size: 100 }), // 小さいサイズを返す
}));

// getAppUserDataPathのモックを修正
vi.mock('../../lib/wrappedApp', () => ({
  getAppUserDataPath: vi.fn().mockReturnValue('/mock/user/data'),
}));

vi.mock('node:readline', () => ({
  createInterface: vi.fn().mockReturnValue({
    [Symbol.asyncIterator]: async function* () {
      // 空のイテレータを返す
      yield null;
      return;
    },
    close: vi.fn(),
  }),
}));

import * as nodeFs from 'node:fs';
import { getAppUserDataPath } from '../../lib/wrappedApp';
import * as fs from '../../lib/wrappedFs';
// モックの後に他のインポートを行う
import { BaseValueObject } from '../vrchatPhoto/valueObjects';
import { VRChatLogLine, VRChatLogLineSchema } from './model';
import {
  appendLoglinesToFile,
  getLegacyLogStoreFilePath,
  getLogLinesFromLogPhotoDirPath,
  getLogStoreFilePathForDate,
  getLogStoreFilePathsInRange,
} from './service';

describe('getLogLinesFromLogPhotoDirPath', () => {
  const mockPhotoDirPath = new (class extends BaseValueObject<
    'VRChatPhotoDirPath',
    string
  > {
    constructor() {
      super('/mock/photo/dir');
    }
  })();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('globが正しい引数で呼び出される', async () => {
    const { glob } = await import('glob');
    vi.mocked(glob).mockResolvedValue([]);

    await getLogLinesFromLogPhotoDirPath({
      vrChatPhotoDirPath: mockPhotoDirPath,
    });

    expect(glob).toHaveBeenCalledTimes(1);
    expect(glob).toHaveBeenCalledWith('/mock/photo/dir/**/VRChat_*_wrld_*');
  });

  it('正しい形式のファイル名からワールド訪問ログを抽出できる', async () => {
    const mockFiles = [
      '/mock/photo/dir/VRChat_2024-01-06_23-18-51.000_wrld_f5db5fd3-7541-407e-a218-04fbdd84f2b7.jpeg',
      '/mock/photo/dir/VRChat_2024-01-07_12-30-45.123_wrld_abcdef12-3456-7890-abcd-ef1234567890.png',
    ];

    const { glob } = await import('glob');
    vi.mocked(glob).mockResolvedValue(mockFiles);

    const result = await getLogLinesFromLogPhotoDirPath({
      vrChatPhotoDirPath: mockPhotoDirPath,
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      joinDate: new Date('2024-01-06T23:18:51.000'),
      worldId: 'wrld_f5db5fd3-7541-407e-a218-04fbdd84f2b7',
    });
    expect(result[1]).toEqual({
      joinDate: new Date('2024-01-07T12:30:45.123'),
      worldId: 'wrld_abcdef12-3456-7890-abcd-ef1234567890',
    });
  });

  it('不正な形式のファイル名は無視される', async () => {
    const mockFiles = [
      '/mock/photo/dir/VRChat_2024-01-06_23-18-51.000_wrld_f5db5fd3-7541-407e-a218-04fbdd84f2b7.jpeg',
      '/mock/photo/dir/invalid_file_name.jpg',
      '/mock/photo/dir/VRChat_invalid_date_wrld_12345.png',
    ];

    const { glob } = await import('glob');
    vi.mocked(glob).mockResolvedValue(mockFiles);

    const result = await getLogLinesFromLogPhotoDirPath({
      vrChatPhotoDirPath: mockPhotoDirPath,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      joinDate: new Date('2024-01-06T23:18:51.000'),
      worldId: 'wrld_f5db5fd3-7541-407e-a218-04fbdd84f2b7',
    });
  });

  it('ファイルが存在しない場合は空配列を返す', async () => {
    const { glob } = await import('glob');
    vi.mocked(glob).mockResolvedValue([]);

    const result = await getLogLinesFromLogPhotoDirPath({
      vrChatPhotoDirPath: mockPhotoDirPath,
    });

    expect(result).toHaveLength(0);
  });
});

describe('getLogStoreFilePathForDate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // getAppUserDataPathが正しい値を返すことを確認
    vi.mocked(getAppUserDataPath).mockReturnValue('/mock/user/data');
  });

  it('指定された日付に基づいて正しいパスを生成する', () => {
    const testDate = new Date('2024-05-15');
    const result = getLogStoreFilePathForDate(testDate);

    expect(result.value).toBe(
      '/mock/user/data/logStore/2024-05/logStore-2024-05.txt',
    );
  });

  it('日付が指定されない場合は現在の日付を使用する', () => {
    // 現在の日付をモック
    const RealDate = global.Date;
    const mockDate = new RealDate('2024-06-20');

    // Dateコンストラクタをモック
    const mockDateConstructor = function (this: Date, ...args: unknown[]) {
      if (args.length === 0) {
        return new RealDate(mockDate);
      }
      // 型アサーションを使用して引数を渡す
      return new RealDate(...(args as [string | number | Date]));
    } as unknown as DateConstructor;

    // 元のDate.UTCとDate.parseを保持
    mockDateConstructor.UTC = RealDate.UTC;
    mockDateConstructor.parse = RealDate.parse;

    // Dateをモック
    global.Date = mockDateConstructor;

    try {
      const result = getLogStoreFilePathForDate();
      expect(result.value).toBe(
        '/mock/user/data/logStore/2024-06/logStore-2024-06.txt',
      );
    } finally {
      // モックをリセット
      global.Date = RealDate;
    }
  });
});

describe('getLogStoreFilePathsInRange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // getAppUserDataPathが正しい値を返すことを確認
    vi.mocked(getAppUserDataPath).mockReturnValue('/mock/user/data');
  });

  it('指定された日付からのログファイルパスを取得する', async () => {
    const startDate = new Date('2024-01-15');

    // 現在の日付をモック
    const RealDate = global.Date;
    const mockDate = new RealDate('2024-03-20');
    const mockDateConstructor = function (this: Date, ...args: unknown[]) {
      if (args.length === 0) {
        return new RealDate(mockDate);
      }
      return new RealDate(...(args as [string | number | Date]));
    } as unknown as DateConstructor;
    mockDateConstructor.UTC = RealDate.UTC;
    mockDateConstructor.parse = RealDate.parse;
    global.Date = mockDateConstructor;

    try {
      const result = await getLogStoreFilePathsInRange(startDate);

      // 2024-01から2024-03までの3ヶ月分のパスが生成されることを確認
      expect(result).toHaveLength(3);
      expect(result[0].value).toBe(
        '/mock/user/data/logStore/2024-01/logStore-2024-01.txt',
      );
      expect(result[1].value).toBe(
        '/mock/user/data/logStore/2024-02/logStore-2024-02.txt',
      );
      expect(result[2].value).toBe(
        '/mock/user/data/logStore/2024-03/logStore-2024-03.txt',
      );
    } finally {
      global.Date = RealDate;
    }
  });

  it('startDateが指定されない場合は現在の日付のファイルのみを取得する', async () => {
    // 現在の日付をモック
    const RealDate = global.Date;
    const mockDate = new RealDate('2024-04-10');
    const mockDateConstructor = function (this: Date, ...args: unknown[]) {
      if (args.length === 0) {
        return new RealDate(mockDate);
      }
      return new RealDate(...(args as [string | number | Date]));
    } as unknown as DateConstructor;
    mockDateConstructor.UTC = RealDate.UTC;
    mockDateConstructor.parse = RealDate.parse;
    global.Date = mockDateConstructor;

    try {
      const result = await getLogStoreFilePathsInRange();

      // 現在の月（2024-04）のパスのみが生成されることを確認
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(
        '/mock/user/data/logStore/2024-04/logStore-2024-04.txt',
      );
    } finally {
      global.Date = RealDate;
    }
  });
});

describe('appendLoglinesToFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // ファイルが存在しないと仮定
    vi.mocked(fs.existsSyncSafe).mockReturnValue(false);
    // getAppUserDataPathが正しい値を返すことを確認
    vi.mocked(getAppUserDataPath).mockReturnValue('/mock/user/data');
  });

  it('ログが空の場合は何もしない', async () => {
    const result = await appendLoglinesToFile({
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

    const result = await appendLoglinesToFile({
      logLines,
    });

    expect(result.isOk()).toBe(true);

    // 2つの異なるディレクトリが作成されたことを確認
    expect(fs.mkdirSyncSafe).toHaveBeenCalledTimes(2);
    expect(fs.mkdirSyncSafe).toHaveBeenCalledWith(
      '/mock/user/data/logStore/2024-01',
    );
    expect(fs.mkdirSyncSafe).toHaveBeenCalledWith(
      '/mock/user/data/logStore/2024-02',
    );

    // 2つの異なるファイルに書き込まれたことを確認
    expect(fs.writeFileSyncSafe).toHaveBeenCalledTimes(2);
    expect(fs.writeFileSyncSafe).toHaveBeenCalledWith(
      '/mock/user/data/logStore/2024-01/logStore-2024-01.txt',
      '2024.01.15 12:00:00 Log entry 1\n2024.01.20 15:30:00 Log entry 2\n',
    );
    expect(fs.writeFileSyncSafe).toHaveBeenCalledWith(
      '/mock/user/data/logStore/2024-02/logStore-2024-02.txt',
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
    const RealDate = global.Date;
    const mockDate = new RealDate('2024-03-15T14:30:45');

    // Dateコンストラクタをモック
    const mockDateConstructor = function (this: Date, ...args: unknown[]) {
      if (args.length === 0) {
        return new RealDate(mockDate);
      }
      // 型アサーションを使用して引数を渡す
      return new RealDate(...(args as [string | number | Date]));
    } as unknown as DateConstructor;

    // 元のDate.UTCとDate.parseを保持
    mockDateConstructor.UTC = RealDate.UTC;
    mockDateConstructor.parse = RealDate.parse;

    // Dateをモック
    global.Date = mockDateConstructor;

    try {
      const result = await appendLoglinesToFile({
        logLines,
      });

      expect(result.isOk()).toBe(true);

      // 新しいファイルに書き込まれたことを確認
      expect(fs.writeFileSyncSafe).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSyncSafe).toHaveBeenCalledWith(
        expect.stringContaining(
          '/mock/user/data/logStore/2024-03/logStore-2024-03-',
        ),
        '2024.03.15 12:00:00 Log entry 1\n',
      );
    } finally {
      // モックをリセット
      global.Date = RealDate;
    }
  });
});

describe('vrchatLog service', () => {
  const mockUserDataPath = '/mock/user/data/path';

  beforeEach(() => {
    vi.mocked(getAppUserDataPath).mockReturnValue(mockUserDataPath);
  });

  describe('getLegacyLogStoreFilePath', () => {
    const legacyLogPath = path.join(
      mockUserDataPath,
      'logStore',
      'logStore.txt',
    );

    beforeEach(async () => {
      // レガシーログファイルのディレクトリを作成
      await nodeFs.promises.mkdir(path.dirname(legacyLogPath), {
        recursive: true,
      });
    });

    afterEach(async () => {
      // テスト後にファイルとディレクトリを削除
      try {
        await nodeFs.promises.unlink(legacyLogPath);
        await nodeFs.promises.rmdir(path.dirname(legacyLogPath));
      } catch (_error) {
        // ファイルが存在しない場合は無視
      }
    });

    it('should return null when legacy file does not exist', async () => {
      const result = await getLegacyLogStoreFilePath();
      expect(result).toBeNull();
    });

    it('should return path when legacy file exists', async () => {
      // レガシーファイルを作成
      await nodeFs.promises.writeFile(legacyLogPath, '');

      const result = await getLegacyLogStoreFilePath();
      expect(result).not.toBeNull();
      expect(result?.value).toBe(legacyLogPath);
    });
  });

  describe('getLogStoreFilePathsInRange', () => {
    const legacyLogPath = path.join(
      mockUserDataPath,
      'logStore',
      'logStore.txt',
    );

    beforeEach(async () => {
      await nodeFs.promises.mkdir(path.dirname(legacyLogPath), {
        recursive: true,
      });
    });

    afterEach(async () => {
      try {
        await nodeFs.promises.unlink(legacyLogPath);
        await nodeFs.promises.rmdir(path.dirname(legacyLogPath));
      } catch (_error) {
        // ファイルが存在しない場合は無視
      }
    });

    it('should include both new and legacy format files when available', async () => {
      // レガシーファイルを作成
      await nodeFs.promises.writeFile(legacyLogPath, '');

      // 3ヶ月前からのログを取得
      const startDate = datefns.subMonths(new Date(), 3);
      const paths = await getLogStoreFilePathsInRange(startDate);

      // 新形式のログファイル（4つの月：3ヶ月前、2ヶ月前、1ヶ月前、現在の月）
      expect(paths.length).toBe(4 + 1); // +1 はレガシーファイル

      // レガシーファイルが含まれていることを確認
      expect(paths.some((p) => p.value === legacyLogPath)).toBe(true);
    });

    it('should only include new format files when legacy file does not exist', async () => {
      const startDate = datefns.subMonths(new Date(), 2);
      const paths = await getLogStoreFilePathsInRange(startDate);

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
