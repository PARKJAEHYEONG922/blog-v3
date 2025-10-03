/**
 * 재시도 로직 유틸리티
 * API 호출 등 실패 가능한 작업에 재시도 로직 추가
 */
import { handleError } from './error-handler';

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  errorPrefix?: string;
}

/**
 * 함수를 최대 maxRetries번 재시도
 *
 * @param fn 실행할 비동기 함수
 * @param options 재시도 옵션
 * @returns 함수 실행 결과
 *
 * @example
 * const result = await withRetry(
 *   async () => {
 *     const response = await fetch(url);
 *     if (!response.ok) throw new Error('API 오류');
 *     return response.json();
 *   },
 *   { maxRetries: 2, delayMs: 500, errorPrefix: 'API 호출' }
 * );
 */
export async function withRetry<T>(
  fn: (attempt: number, maxRetries: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 2;
  const delayMs = options.delayMs ?? 500;
  const errorPrefix = options.errorPrefix ?? '작업';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt, maxRetries);
    } catch (error) {
      handleError(error, `${errorPrefix} 실패 (${attempt}/${maxRetries})`);

      if (attempt === maxRetries) {
        throw error;
      }

      // 재시도 전 지연 (attempt에 비례하여 증가)
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw new Error(`${errorPrefix}에 실패했습니다.`);
}
