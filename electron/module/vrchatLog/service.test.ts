import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseValueObject } from '../vrchatPhoto/valueObjects';
import { getLogLinesFromLogPhotoDirPath } from './service';

vi.mock('glob', () => ({
  glob: vi.fn(),
}));

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
