/**
 * API 키 테스트 로직 훅
 */

import { useState } from 'react';
import { handleError } from '@/shared/utils/error-handler';
import { LLMConfig } from '@/shared/services/llm/types/llm.types';

export interface TestingStatus {
  testing: boolean;
  success: boolean;
  message: string;
}

export const useApiKeyTest = () => {
  const [testingStatus, setTestingStatus] = useState<{
    [key: string]: TestingStatus;
  }>({});

  // 테스트 상태 초기화
  const resetTestStatus = (category: string) => {
    setTestingStatus(prev => ({
      ...prev,
      [category]: { testing: false, success: false, message: '' }
    }));
  };

  // API 연결 테스트 (Electron IPC 사용)
  const testAPIConnection = async (
    provider: string,
    apiKey: string,
    category?: string,
    model?: string,
    size?: string,
    style?: string,
    quality?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await window.electronAPI?.testLLMConfig?.({
        provider,
        apiKey,
        category,
        model,
        size,
        style,
        quality
      });

      if (!result) {
        return { success: false, message: '테스트 응답을 받지 못했습니다.' };
      }

      if ('error' in result && !('message' in result)) {
        return {
          success: result.success,
          message: result.error || (result.success ? '연결 성공' : '연결 실패')
        };
      }

      return result as { success: boolean; message: string };
    } catch (error) {
      handleError(error, `❌ ${provider} API 테스트 실패:`);

      if (error instanceof Error) {
        return { success: false, message: `연결 오류: ${error.message}` };
      }

      return { success: false, message: `연결 테스트 실패: ${String(error)}` };
    }
  };

  // API 키 테스트 실행
  const testApiKey = async (
    category: string,
    settings: LLMConfig,
    onSuccess?: () => Promise<void>
  ) => {
    const { provider, apiKey, model, size, style, quality } = settings;

    if (!apiKey || !provider || !model) {
      setTestingStatus(prev => ({
        ...prev,
        [category]: {
          testing: false,
          success: false,
          message: '❌ 제공자, 모델, API 키를 모두 입력해주세요.'
        }
      }));
      return;
    }

    // 테스트 시작
    setTestingStatus(prev => ({
      ...prev,
      [category]: { testing: true, success: false, message: '연결 테스트 중...' }
    }));

    try {
      const result = await testAPIConnection(
        provider,
        apiKey,
        category,
        model,
        size,
        style,
        quality
      );

      if (result.success) {
        // 성공
        setTestingStatus(prev => ({
          ...prev,
          [category]: {
            testing: false,
            success: true,
            message: `✅ ${provider.toUpperCase()} API 연결 성공! ${model} 모델이 적용되었습니다.`
          }
        }));

        // 성공 콜백 실행
        if (onSuccess) {
          await onSuccess();
        }
      } else {
        // 실패
        setTestingStatus(prev => ({
          ...prev,
          [category]: {
            testing: false,
            success: false,
            message: `❌ 연결 실패: ${result.message}`
          }
        }));
      }
    } catch (error) {
      handleError(error, 'API 테스트 에러:');
      setTestingStatus(prev => ({
        ...prev,
        [category]: {
          testing: false,
          success: false,
          message: `❌ 연결 테스트 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        }
      }));
    }
  };

  return {
    testingStatus,
    testApiKey,
    resetTestStatus
  };
};
