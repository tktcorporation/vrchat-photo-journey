import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('ValueObject Linter', () => {
  const testDir = path.join(process.cwd(), 'test-valueobjects');

  beforeAll(() => {
    // Create test directory
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    // Clean up test directory
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should pass for valid ValueObject', () => {
    const validValueObject = `
import { BaseValueObject } from '../electron/lib/baseValueObject.js';
import { z } from 'zod';

class TestId extends BaseValueObject<'TestId', string> {}

export type { TestId };
export const TestIdSchema = z.string().transform(val => new TestId(val));
`;

    fs.writeFileSync(path.join(testDir, 'valid.ts'), validValueObject);

    // Run linter on test file
    const result = execSync('npx tsx scripts/lint-valueobjects.ts', {
      cwd: process.cwd(),
      encoding: 'utf-8',
      env: { ...process.env, NODE_ENV: 'test' },
    });

    expect(result).toContain(
      'All ValueObject implementations follow the correct pattern!',
    );
  });

  it('should fail for ValueObject with mismatched brand type', () => {
    const invalidValueObject = `
import { BaseValueObject } from '../electron/lib/baseValueObject.js';

class TestId extends BaseValueObject<'WrongBrand', string> {}
`;

    fs.writeFileSync(path.join(testDir, 'invalid.ts'), invalidValueObject);

    // Run linter on test file and expect it to fail
    expect(() => {
      execSync('npx tsx scripts/lint-valueobjects.ts', {
        cwd: process.cwd(),
        encoding: 'utf-8',
        env: { ...process.env, NODE_ENV: 'test' },
      });
    }).toThrow();
  });

  it('should fail for ValueObject exported as class', () => {
    const invalidExport = `
import { BaseValueObject } from '../electron/lib/baseValueObject.js';
import { z } from 'zod';

class TestId extends BaseValueObject<'TestId', string> {}

export { TestId };
export const TestIdSchema = z.string().transform(val => new TestId(val));
`;

    fs.writeFileSync(path.join(testDir, 'invalid-export.ts'), invalidExport);

    // Run linter on test file and expect it to fail
    expect(() => {
      execSync('npx tsx scripts/lint-valueobjects.ts', {
        cwd: process.cwd(),
        encoding: 'utf-8',
        env: { ...process.env, NODE_ENV: 'test' },
      });
    }).toThrow();
  });

  it('should fail for ValueObject with export class syntax', () => {
    const invalidExportClass = `
import { BaseValueObject } from '../electron/lib/baseValueObject.js';
import { z } from 'zod';

export class TestId extends BaseValueObject<'TestId', string> {}

export const TestIdSchema = z.string().transform(val => new TestId(val));
`;

    fs.writeFileSync(
      path.join(testDir, 'invalid-export-class.ts'),
      invalidExportClass,
    );

    // Run linter on test file and expect it to fail
    expect(() => {
      execSync('npx tsx scripts/lint-valueobjects.ts', {
        cwd: process.cwd(),
        encoding: 'utf-8',
        env: { ...process.env, NODE_ENV: 'test' },
      });
    }).toThrow();
  });
});
