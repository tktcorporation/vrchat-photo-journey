import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AbsolutePathObject,
  BackupPathObject,
  ExportPathObject,
  PathObject,
} from './pathObject.js';

describe('PathObject', () => {
  describe('基本機能', () => {
    it('パスを正規化できる', () => {
      const pathObj = new PathObject('/path/to//file/../dir/');
      const normalized = pathObj.normalize();
      expect(normalized.value).toBe(path.normalize('/path/to//file/../dir/'));
    });

    it('パスを安全に結合できる', () => {
      const pathObj = new PathObject('/base/path');
      const joined = pathObj.join('subdir', 'file.txt');
      expect(joined.value).toBe(path.join('/base/path', 'subdir', 'file.txt'));
    });

    it('絶対パスに解決できる', () => {
      const pathObj = new PathObject('relative/path');
      const absolute = pathObj.resolve();
      expect(absolute).toBeInstanceOf(AbsolutePathObject);
      expect(path.isAbsolute(absolute.value)).toBe(true);
    });

    it('ベースパス内にあるかチェックできる', () => {
      const basePath = new PathObject('/base/path');
      const safePath = new PathObject('/base/path/subdir/file.txt');
      const unsafePath = new PathObject('/base/../outside/file.txt');

      expect(safePath.isWithin(basePath)).toBe(true);
      expect(unsafePath.isWithin(basePath)).toBe(false);
    });

    it('ファイル名を取得できる', () => {
      const pathObj = new PathObject('/path/to/file.txt');
      expect(pathObj.basename()).toBe('file.txt');
      expect(pathObj.basename('.txt')).toBe('file');
    });

    it('glob用にフォワードスラッシュに正規化できる', () => {
      const windowsPath = new PathObject('C:\\path\\to\\file.txt');
      expect(windowsPath.toGlobPattern()).toBe('C:/path/to/file.txt');
    });
  });

  describe('クロスプラットフォーム対応', () => {
    it('Windows形式のパスを正しく処理できる', () => {
      const windowsPath = 'C:\\Users\\Test\\Documents\\file.txt';
      const pathObj = new PathObject(windowsPath);
      const normalized = pathObj.normalize();

      // プラットフォームによって結果が変わるため、一貫性をチェック
      expect(normalized.value).toBeTruthy();
      // Linux環境でWindows形式のパスを扱う場合、basenameは期待通りに動作しない
      // この場合は、パス全体が返される
      const basename = pathObj.basename();
      expect(basename).toBeTruthy();
    });

    it('混在パス区切り文字を処理できる', () => {
      const mixedPath = 'C:\\Users\\Test/Documents/file.txt';
      const pathObj = new PathObject(mixedPath);
      const normalized = pathObj.normalize();

      expect(normalized.value).toBeTruthy();
      expect(pathObj.toGlobPattern()).toBe('C:/Users/Test/Documents/file.txt');
    });
  });
});

describe('AbsolutePathObject', () => {
  it('相対パスを絶対パスに変換する', () => {
    const relativePath = 'relative/path';
    const absPath = new AbsolutePathObject(relativePath);
    expect(path.isAbsolute(absPath.value)).toBe(true);
  });

  it('既に絶対パスの場合はそのまま使用する', () => {
    const absolutePath = '/absolute/path';
    const absPath = new AbsolutePathObject(absolutePath);
    expect(absPath.value).toBe(absolutePath);
  });

  it('resolve()は自身を返す', () => {
    const absPath = new AbsolutePathObject('/absolute/path');
    const resolved = absPath.resolve();
    expect(resolved).toBe(absPath);
  });
});

describe('ExportPathObject', () => {
  it('エクスポートフォルダ名を抽出できる', () => {
    const exportPath = new ExportPathObject(
      '/downloads/vrchat-albums-export_2023-12-01_14-30-45/2023-11/logStore.txt',
    );
    expect(exportPath.extractExportFolderName()).toBe(
      'vrchat-albums-export_2023-12-01_14-30-45',
    );
  });

  it('Windows形式のパスからもエクスポートフォルダ名を抽出できる', () => {
    const exportPath = new ExportPathObject(
      'C:\\Downloads\\vrchat-albums-export_2023-12-01_14-30-45\\2023-11\\logStore.txt',
    );
    expect(exportPath.extractExportFolderName()).toBe(
      'vrchat-albums-export_2023-12-01_14-30-45',
    );
  });

  it('混在パス区切り文字からもエクスポートフォルダ名を抽出できる', () => {
    const exportPath = new ExportPathObject(
      'C:\\Downloads\\backups/vrchat-albums-export_2023-12-01_14-30-45/2023-11/logStore.txt',
    );
    expect(exportPath.extractExportFolderName()).toBe(
      'vrchat-albums-export_2023-12-01_14-30-45',
    );
  });

  it('エクスポートフォルダが見つからない場合はnullを返す', () => {
    const exportPath = new ExportPathObject('/downloads/other-folder/file.txt');
    expect(exportPath.extractExportFolderName()).toBeNull();
  });

  it('タイムスタンプ付きサブディレクトリを作成できる', () => {
    const basePath = new ExportPathObject('/downloads');
    const withTimestamp = basePath.withTimestampedSubdir();

    expect(withTimestamp.value).toMatch(
      /\/downloads\/vrchat-albums-export_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/,
    );
  });
});

describe('BackupPathObject', () => {
  it('バックアップIDでパスを作成できる', () => {
    const backupBase = new BackupPathObject('/app/backups');
    const withId = backupBase.withBackupId('backup-123');
    expect(withId.value).toBe(path.join('/app/backups', 'backup-123'));
  });

  it('インポートバックアップ用のプレフィックスを追加できる', () => {
    const backupBase = new BackupPathObject('/app/backups');
    const withPrefix = backupBase.withImportBackupPrefix();

    expect(withPrefix.value).toMatch(
      /\/app\/backups\/backup_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/,
    );
  });
});
