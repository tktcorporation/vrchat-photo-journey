import { describe, expect, it } from 'vitest';
import { VRChatLogLineSchema, VRChatPlayerId, VRChatWorldId } from '../model';
import { filterLogLinesByDate, parseLogDateTime } from './baseParser';

describe('baseParser', () => {
  describe('parseLogDateTime', () => {
    it('正しい日付時刻文字列をパースできる', () => {
      const result = parseLogDateTime('2023.10.08', '15:30:45');
      expect(result).toEqual(new Date('2023-10-08T15:30:45'));
    });
  });

  describe('VRChatWorldId.isValid', () => {
    it('有効なワールドIDを正しく判定する', () => {
      expect(
        VRChatWorldId.isValid('wrld_12345678-1234-1234-1234-123456789abc'),
      ).toBe(true);
      expect(
        VRChatWorldId.isValid('wrld_abcdef12-3456-7890-abcd-ef1234567890'),
      ).toBe(true);
    });

    it('無効なワールドIDを正しく判定する', () => {
      expect(VRChatWorldId.isValid('invalid-world-id')).toBe(false);
      expect(
        VRChatWorldId.isValid('world_12345678-1234-1234-1234-123456789abc'),
      ).toBe(false);
      expect(VRChatWorldId.isValid('wrld_invalid-format')).toBe(false);
      expect(
        VRChatWorldId.isValid('wrld_12345678-1234-1234-1234-123456789abcdef'),
      ).toBe(false); // too long
      expect(VRChatWorldId.isValid('')).toBe(false);
    });
  });

  describe('VRChatPlayerId.isValid', () => {
    it('有効なプレイヤーIDを正しく判定する', () => {
      expect(
        VRChatPlayerId.isValid('usr_12345678-1234-1234-1234-123456789abc'),
      ).toBe(true);
      expect(
        VRChatPlayerId.isValid('usr_abcdef12-3456-7890-abcd-ef1234567890'),
      ).toBe(true);
    });

    it('無効なプレイヤーIDを正しく判定する', () => {
      expect(VRChatPlayerId.isValid('invalid-player-id')).toBe(false);
      expect(
        VRChatPlayerId.isValid('user_12345678-1234-1234-1234-123456789abc'),
      ).toBe(false);
      expect(VRChatPlayerId.isValid('usr_invalid-format')).toBe(false);
      expect(
        VRChatPlayerId.isValid('usr_12345678-1234-1234-1234-123456789abcdef'),
      ).toBe(false); // too long
      expect(VRChatPlayerId.isValid('')).toBe(false);
    });
  });

  describe('filterLogLinesByDate', () => {
    it('指定日以降のログのみフィルタリングできる', () => {
      const logLines = [
        VRChatLogLineSchema.parse('2023.10.07 10:00:00 Log - Test log 1'),
        VRChatLogLineSchema.parse('2023.10.08 15:30:00 Log - Test log 2'),
        VRChatLogLineSchema.parse('2023.10.09 20:45:00 Log - Test log 3'),
      ];

      const startDate = new Date('2023-10-08T00:00:00');
      const result = filterLogLinesByDate(logLines, startDate);

      expect(result).toHaveLength(2);
      expect(result[0].value).toContain('2023.10.08');
      expect(result[1].value).toContain('2023.10.09');
    });

    it('日付形式が不正なログを除外する', () => {
      const logLines = [
        VRChatLogLineSchema.parse('2023.10.08 15:30:00 Log - Valid log'),
        VRChatLogLineSchema.parse('Invalid date format log'),
      ];

      const startDate = new Date('2023-10-08T00:00:00');
      const result = filterLogLinesByDate(logLines, startDate);

      expect(result).toHaveLength(1);
      expect(result[0].value).toContain('Valid log');
    });
  });
});
