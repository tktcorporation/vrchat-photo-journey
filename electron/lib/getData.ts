import { type Result, err, ok } from 'neverthrow';
import { ofetch } from 'ofetch';
import type { QueryObject } from 'ufo';

// 独自エラークラスの定義
export class FetchError extends Error {
  status: number;
  url: string;
  method?: string;
  headers?: Headers;
  responseBody?: unknown;
  originalMessage?: string;

  constructor({
    message,
    status,
    url,
    method,
    headers,
    responseBody,
  }: {
    message: string;
    status: number;
    url: string;
    method?: string;
    headers?: Headers;
    responseBody?: unknown;
  }) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.url = url;
    this.method = method;
    this.headers = headers;
    this.responseBody = responseBody;
    this.originalMessage = message;
  }
}

// fetchWithResult 関数
const fetchWithResult = async <T = unknown>(
  url: string,
  options?: RequestInit & { query?: QueryObject },
): Promise<Result<T, FetchError>> => {
  try {
    // ちゃんとした User-Agent を設定する
    const userAgent = `Electron ${process.versions.electron}; ${process.platform}; ${process.arch}`;
    const response = await ofetch<T>(url, {
      headers: {
        'User-Agent': userAgent,
        ...options?.headers,
      },
      ...options,
      onResponseError: async ({ response }) => {
        throw new FetchError({
          message: response.statusText || 'Unknown error',
          status: response.status,
          url: response.url,
          method: options?.method,
          headers: response.headers,
          responseBody: response._data,
        });
      },
    });
    return ok(response);
  } catch (error: unknown) {
    if (error instanceof FetchError) {
      const fetchError = new FetchError({
        message: error.message,
        status: error.status,
        url: url,
        method: options?.method,
        headers: options?.headers as Headers,
        responseBody: error.responseBody,
      });
      return err(fetchError);
    }
    throw error; // FetchError でない場合はそのまま throw する
  }
};

// getData 関数の実装
export const getData = async <T>(
  url: string,
  options?: RequestInit & { query?: QueryObject },
): Promise<Result<T, FetchError>> => {
  return fetchWithResult<T>(url, options);
};
