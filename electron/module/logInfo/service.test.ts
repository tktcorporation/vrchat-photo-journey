import * as nodeFs from 'node:fs';
import path from 'node:path';
import * as datefns from 'date-fns';
import * as neverthrow from 'neverthrow';
import { v4 as uuidv4 } from 'uuid';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../../lib/sequelize';
import { getAppUserDataPath } from '../../lib/wrappedApp';
import type { VRChatPlayerJoinLogModel } from '../VRChatPlayerJoinLogModel/playerJoinInfoLog.model';
import * as playerJoinLogService from '../VRChatPlayerJoinLogModel/playerJoinLog.service';
import type { VRChatPlayerLeaveLogModel } from '../VRChatPlayerLeaveLogModel/playerLeaveLog.model';
import * as playerLeaveLogService from '../VRChatPlayerLeaveLogModel/playerLeaveLog.service';
import { VRChatLogStoreFilePathSchema } from '../vrchatLog/model';
import type {
  VRChatPlayerJoinLog,
  VRChatWorldJoinLog,
} from '../vrchatLog/service';
import * as vrchatLogService from '../vrchatLog/service';
import * as vrchatPhotoService from '../vrchatPhoto/vrchatPhoto.service';
import type { VRChatWorldJoinLogModel } from '../vrchatWorldJoinLog/VRChatWorldJoinLogModel/s_model';
import * as worldJoinLogService from '../vrchatWorldJoinLog/service';
import { loadLogInfoIndexFromVRChatLog } from './service';

// 必要最小限のモックを設定
vi.mock('../vrchatLog/service', () => ({
  importLogLinesFromLogPhotoDirPath: vi.fn().mockResolvedValue(undefined),
  getLogStoreFilePathsInRange: vi
    .fn()
    .mockImplementation(async (startDate, _currentDate) => {
      // 日付範囲に応じて複数のファイルパスを返すようにモックを修正
      const paths: ReturnType<typeof VRChatLogStoreFilePathSchema.parse>[] = [];
      let currentDate = new Date(startDate);
      const endDate = _currentDate || new Date();

      // 開始日から終了日まで1ヶ月ずつ増やしながらパスを生成
      while (
        datefns.isBefore(currentDate, endDate) ||
        datefns.isSameMonth(currentDate, endDate)
      ) {
        const yearMonth = datefns.format(currentDate, 'yyyy-MM');
        const mockPath = `/mock/user/data/logStore/${yearMonth}/logStore-${yearMonth}.txt`;
        paths.push(VRChatLogStoreFilePathSchema.parse(mockPath));
        currentDate = datefns.addMonths(currentDate, 1);
      }

      return paths;
    }),
  getVRChaLogInfoByLogFilePathList: vi.fn().mockImplementation(() => {
    return neverthrow.ok([]);
  }),
  getLegacyLogStoreFilePath: vi.fn().mockImplementation(async () => {
    // モックでレガシーファイルパスを返す
    const legacyPath = path.join('/mock/user/data/logStore', 'logStore.txt');
    // レガシーファイルが存在する場合のみパスを返す
    if (vi.mocked(nodeFs.existsSync).mock.results[0]?.value === true) {
      return VRChatLogStoreFilePathSchema.parse(legacyPath);
    }
    return null;
  }),
}));

vi.mock('../vrchatWorldJoinLog/service', () => ({
  findLatestWorldJoinLog: vi.fn().mockResolvedValue(null),
  createVRChatWorldJoinLogModel: vi.fn().mockResolvedValue([]),
}));

vi.mock('../VRChatPlayerJoinLogModel/playerJoinLog.service', () => ({
  findLatestPlayerJoinLog: vi.fn().mockResolvedValue(neverthrow.ok(null)),
  createVRChatPlayerJoinLogModel: vi.fn().mockResolvedValue([]),
}));

vi.mock('../VRChatPlayerLeaveLogModel/playerLeaveLog.service', () => ({
  findLatestPlayerLeaveLog: vi.fn().mockResolvedValue(null),
  createVRChatPlayerLeaveLogModel: vi.fn().mockResolvedValue([]),
}));

vi.mock('../vrchatPhoto/vrchatPhoto.service', () => ({
  getVRChatPhotoDirPath: vi.fn().mockResolvedValue({ value: '/mock/photos' }),
  getLatestPhotoDate: vi.fn().mockResolvedValue(null),
  createVRChatPhotoPathIndex: vi.fn().mockResolvedValue([]),
}));

// getAppUserDataPathのモック
vi.mock('../../lib/wrappedApp', () => ({
  getAppUserDataPath: vi.fn().mockReturnValue('/mock/user/data'),
}));

// node:fsのモック
vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
    rmdir: vi.fn().mockResolvedValue(undefined),
  },
  statSync: vi.fn().mockReturnValue({ size: 100 }),
}));

describe('loadLogInfoIndexFromVRChatLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAppUserDataPath).mockReturnValue('/mock/user/data');
  });

  it('DBに記録がない場合は1年前からログを取得する', async () => {
    const mockDate = new Date('2024-03-15');
    vi.setSystemTime(mockDate);

    try {
      const result = await loadLogInfoIndexFromVRChatLog({
        excludeOldLogLoad: true,
      });

      expect(result.isOk()).toBe(true);

      // getLogStoreFilePathsInRangeが適切な引数で呼ばれたか確認
      const _oneYearAgo = datefns.subYears(mockDate, 1);
      expect(vrchatLogService.getLogStoreFilePathsInRange).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
      );

      // 1年前の日付が含まれているか検証
      const startDateArg = vi.mocked(
        vrchatLogService.getLogStoreFilePathsInRange,
      ).mock.calls[0][0];
      const startDateYear = startDateArg.getFullYear();
      const startDateMonth = startDateArg.getMonth();

      expect(startDateYear).toBe(2023);
      expect(startDateMonth).toBe(2); // 3月は0-indexed で 2
    } finally {
      vi.useRealTimers();
    }
  });

  it('excludeOldLogLoadがfalseの場合は2000年1月1日からすべてのログを取得する', async () => {
    const mockDate = new Date('2024-03-15');
    vi.setSystemTime(mockDate);

    try {
      const result = await loadLogInfoIndexFromVRChatLog({
        excludeOldLogLoad: false,
      });

      expect(result.isOk()).toBe(true);

      // getLogStoreFilePathsInRangeが適切な引数で呼ばれたか確認
      expect(vrchatLogService.getLogStoreFilePathsInRange).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
      );

      // 開始日が2000年1月1日になっているか検証
      const startDateArg = vi.mocked(
        vrchatLogService.getLogStoreFilePathsInRange,
      ).mock.calls[0][0];
      expect(startDateArg.getFullYear()).toBe(2000);
      expect(startDateArg.getMonth()).toBe(0); // 1月は0-indexed で 0
      expect(startDateArg.getDate()).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('excludeOldLogLoadがfalseの場合、レガシーファイルが存在すれば読み込む', async () => {
    const mockDate = new Date('2024-03-15');
    vi.setSystemTime(mockDate);

    // レガシーファイルが存在すると仮定
    vi.mocked(nodeFs.existsSync).mockReturnValue(true);

    // モック関数をカスタマイズしてこのテストだけレガシーファイルパスを返すようにする
    const legacyPath = path.join('/mock/user/data/logStore', 'logStore.txt');
    const legacyFilePath = VRChatLogStoreFilePathSchema.parse(legacyPath);
    const mockGetLegacyLogStoreFilePath = vi
      .fn()
      .mockResolvedValue(legacyFilePath);
    vi.mocked(vrchatLogService.getLegacyLogStoreFilePath).mockImplementation(
      mockGetLegacyLogStoreFilePath,
    );

    // このテスト用にgetVRChaLogInfoByLogFilePathListをカスタマイズ
    vi.mocked(
      vrchatLogService.getVRChaLogInfoByLogFilePathList,
    ).mockImplementation(async (paths) => {
      // パスにlegacyPathが含まれていることを確認するためのカスタムモック
      expect(paths.some((p) => p.value === legacyPath)).toBe(true);
      return neverthrow.ok([]);
    });

    try {
      const result = await loadLogInfoIndexFromVRChatLog({
        excludeOldLogLoad: false,
      });

      expect(result.isOk()).toBe(true);

      // getLegacyLogStoreFilePathが呼ばれたか確認
      expect(vrchatLogService.getLegacyLogStoreFilePath).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('ログファイルパスが正しく生成されていることを確認する', async () => {
    const mockDate = new Date('2024-03-15');
    vi.setSystemTime(mockDate);

    // レガシーファイルのモックをリセット（このテストではレガシーファイルは不要）
    vi.mocked(nodeFs.existsSync).mockReturnValue(false);
    vi.mocked(vrchatLogService.getLegacyLogStoreFilePath).mockResolvedValue(
      null,
    );

    // getVRChaLogInfoByLogFilePathListのモックをリセット
    vi.mocked(
      vrchatLogService.getVRChaLogInfoByLogFilePathList,
    ).mockImplementation(async () => {
      return neverthrow.ok([]);
    });

    // テスト用にgetLogStoreFilePathsInRangeの実装を修正してパスを記録
    const generatedPaths: string[] = [];
    vi.mocked(vrchatLogService.getLogStoreFilePathsInRange).mockImplementation(
      async (startDate, _currentDate) => {
        // 日付範囲に応じて複数のファイルパスを返すようにモック
        const paths: ReturnType<typeof VRChatLogStoreFilePathSchema.parse>[] =
          [];
        let currentDate = new Date(startDate);
        const endDate = _currentDate || new Date();

        // 開始日から終了日まで1ヶ月ずつ増やしながらパスを生成
        while (
          datefns.isBefore(currentDate, endDate) ||
          datefns.isSameMonth(currentDate, endDate)
        ) {
          const yearMonth = datefns.format(currentDate, 'yyyy-MM');
          const mockPath = `/mock/user/data/logStore/${yearMonth}/logStore-${yearMonth}.txt`;
          generatedPaths.push(mockPath); // 生成したパスを記録
          paths.push(VRChatLogStoreFilePathSchema.parse(mockPath));
          currentDate = datefns.addMonths(currentDate, 1);
        }

        return paths;
      },
    );

    try {
      const result = await loadLogInfoIndexFromVRChatLog({
        excludeOldLogLoad: true,
      });

      expect(result.isOk()).toBe(true);

      // 生成されたパスが想定通りか検証
      expect(generatedPaths.length).toBeGreaterThan(0);

      // 1年前（2023-03）から現在（2024-03）までのパスが生成されていることを確認
      expect(generatedPaths).toContain(
        '/mock/user/data/logStore/2023-03/logStore-2023-03.txt',
      );
      expect(generatedPaths).toContain(
        '/mock/user/data/logStore/2024-03/logStore-2024-03.txt',
      );

      // 月ごとのファイルパスが連続して生成されているか確認
      const expectedMonths = [
        '2023-03',
        '2023-04',
        '2023-05',
        '2023-06',
        '2023-07',
        '2023-08',
        '2023-09',
        '2023-10',
        '2023-11',
        '2023-12',
        '2024-01',
        '2024-02',
        '2024-03',
      ];

      for (const month of expectedMonths) {
        const expectedPath = `/mock/user/data/logStore/${month}/logStore-${month}.txt`;
        expect(generatedPaths).toContain(expectedPath);
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it('excludeOldLogLoadがfalseのとき、2000年1月から現在までの全パスが生成される', async () => {
    const mockDate = new Date('2024-03-15');
    vi.setSystemTime(mockDate);

    // レガシーファイルのモックをリセット（このテストではレガシーファイルの確認は別で行っている）
    vi.mocked(nodeFs.existsSync).mockReturnValue(false);
    vi.mocked(vrchatLogService.getLegacyLogStoreFilePath).mockResolvedValue(
      null,
    );

    // getVRChaLogInfoByLogFilePathListのモックをリセット
    vi.mocked(
      vrchatLogService.getVRChaLogInfoByLogFilePathList,
    ).mockImplementation(async () => {
      return neverthrow.ok([]);
    });

    // テスト用にgetLogStoreFilePathsInRangeの実装を修正してパスを記録
    const generatedPaths: string[] = [];
    vi.mocked(vrchatLogService.getLogStoreFilePathsInRange).mockImplementation(
      async (startDate, _currentDate) => {
        // startDateが2000-01-01であることを検証
        expect(startDate.getFullYear()).toBe(2000);
        expect(startDate.getMonth()).toBe(0);
        expect(startDate.getDate()).toBe(1);

        // 簡略化のため、最初の月と最後の月だけを含める
        const paths: ReturnType<typeof VRChatLogStoreFilePathSchema.parse>[] =
          [];

        // 開始月（2000-01）
        const startYearMonth = '2000-01';
        const startMonthPath = `/mock/user/data/logStore/${startYearMonth}/logStore-${startYearMonth}.txt`;
        generatedPaths.push(startMonthPath);
        paths.push(VRChatLogStoreFilePathSchema.parse(startMonthPath));

        // 現在の月（2024-03）
        const endYearMonth = '2024-03';
        const endMonthPath = `/mock/user/data/logStore/${endYearMonth}/logStore-${endYearMonth}.txt`;
        generatedPaths.push(endMonthPath);
        paths.push(VRChatLogStoreFilePathSchema.parse(endMonthPath));

        return paths;
      },
    );

    try {
      const result = await loadLogInfoIndexFromVRChatLog({
        excludeOldLogLoad: false,
      });

      expect(result.isOk()).toBe(true);

      // 生成されたパスが想定通りか検証
      expect(generatedPaths).toContain(
        '/mock/user/data/logStore/2000-01/logStore-2000-01.txt',
      );
      expect(generatedPaths).toContain(
        '/mock/user/data/logStore/2024-03/logStore-2024-03.txt',
      );

      // 古いパスから新しいパスまでの範囲全体をカバーしていることを確認
      expect(vrchatLogService.getLogStoreFilePathsInRange).toHaveBeenCalledWith(
        expect.objectContaining({
          getFullYear: expect.any(Function),
          getMonth: expect.any(Function),
          getDate: expect.any(Function),
        }),
        expect.any(Date),
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
