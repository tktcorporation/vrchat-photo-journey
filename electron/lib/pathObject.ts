import * as path from 'node:path';
import { z } from 'zod';
import { BaseValueObject } from '../module/vrchatLog/model.js';

const opaqueSymbol: unique symbol = Symbol('opaqueSymbol');

/**
 * 基本的なPathObject - 型安全なパス操作を提供
 */
export class PathObject extends BaseValueObject<'PathObject', string> {
  /**
   * パスをプラットフォーム固有の形式に正規化
   */
  normalize(): PathObject {
    return new PathObject(path.normalize(this.value));
  }

  /**
   * パスセグメントを安全に結合
   */
  join(...segments: string[]): PathObject {
    return new PathObject(path.join(this.value, ...segments));
  }

  /**
   * 絶対パスに解決
   */
  resolve(): AbsolutePathObject {
    return new AbsolutePathObject(path.resolve(this.value));
  }

  /**
   * 指定されたベースパス内にあるかチェック（ディレクトリトラバーサル防止）
   */
  isWithin(basePath: PathObject): boolean {
    const resolvedThis = path.resolve(this.value);
    const resolvedBase = path.resolve(basePath.value);
    return resolvedThis.startsWith(resolvedBase);
  }

  /**
   * パスからファイル名を取得
   */
  basename(ext?: string): string {
    return path.basename(this.value, ext);
  }

  /**
   * パスからディレクトリ名を取得
   */
  dirname(): PathObject {
    return new PathObject(path.dirname(this.value));
  }

  /**
   * 相対パスを取得
   */
  relative(to: PathObject): PathObject {
    return new PathObject(path.relative(this.value, to.value));
  }

  /**
   * glob用にフォワードスラッシュに正規化
   */
  toGlobPattern(): string {
    return this.value.replace(/\\/g, '/');
  }

  /**
   * パスが絶対パスかチェック
   */
  isAbsolute(): boolean {
    return path.isAbsolute(this.value);
  }
}

/**
 * 絶対パスを保証するPathObject
 */
export class AbsolutePathObject extends PathObject {
  // @ts-ignore TS1338
  private readonly [opaqueSymbol]: 'AbsolutePathObject';

  constructor(value: string) {
    const absolutePath = path.isAbsolute(value) ? value : path.resolve(value);
    super(absolutePath);
  }

  resolve(): AbsolutePathObject {
    return this; // 既に絶対パスなのでそのまま返す
  }
}

/**
 * エクスポートパス専用のPathObject
 */
export class ExportPathObject extends PathObject {
  // @ts-ignore TS1338
  private readonly [opaqueSymbol]: 'ExportPathObject';

  /**
   * エクスポートフォルダ名を抽出（vrchat-albums-export_YYYY-MM-DD_HH-mm-ss）
   */
  extractExportFolderName(): string | null {
    // すべてのパス区切り文字をスラッシュに統一して処理
    const normalizedPath = this.value.replace(/\\/g, '/');
    const parts = normalizedPath.split('/');
    const exportFolder = parts.find((part) =>
      part.startsWith('vrchat-albums-export_'),
    );
    return exportFolder || null;
  }

  /**
   * タイムスタンプ付きサブディレクトリを作成
   */
  withTimestampedSubdir(prefix = 'vrchat-albums-export'): ExportPathObject {
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/T/, '_')
      .replace(/:/g, '-')
      .slice(0, -5);
    const dirname = `${prefix}_${timestamp}`;
    return new ExportPathObject(path.join(this.value, dirname));
  }
}

/**
 * バックアップパス専用のPathObject
 */
export class BackupPathObject extends PathObject {
  // @ts-ignore TS1338
  private readonly [opaqueSymbol]: 'BackupPathObject';

  /**
   * バックアップIDからパスを生成
   */
  withBackupId(backupId: string): BackupPathObject {
    return new BackupPathObject(path.join(this.value, backupId));
  }

  /**
   * インポートバックアップ用のプレフィックスを追加
   */
  withImportBackupPrefix(): BackupPathObject {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}`;
    return new BackupPathObject(path.join(this.value, backupName));
  }
}

/**
 * Zodスキーマ
 */
export const PathObjectSchema = z
  .string()
  .transform((val) => new PathObject(val));
export const AbsolutePathObjectSchema = z
  .string()
  .transform((val) => new AbsolutePathObject(val));
export const ExportPathObjectSchema = z
  .string()
  .transform((val) => new ExportPathObject(val));
export const BackupPathObjectSchema = z
  .string()
  .transform((val) => new BackupPathObject(val));
