import { useState, useCallback, useEffect } from 'react';
import { handleError } from '@/shared/utils/error-handler';

// LLM 설정 타입 정의
export interface LLMConfig {
  provider: 'openai' | 'claude' | 'gemini' | 'runware';
  model: string;
  apiKey: string;
  style?: string;
  quality?: string;
  size?: string;
}

export interface LLMSettings {
  writing: LLMConfig;
  image: LLMConfig;
}

export interface LLMSettingsData {
  appliedSettings: LLMSettings;
  providerApiKeys: {
    openai: string;
    claude: string;
    gemini: string;
    runware: string;
  };
}

export interface SaveSettingsResult {
  success: boolean;
  error?: string;
}

// 레거시 인터페이스 (기존 코드 호환성)
export interface LLMSettingsLegacy {
  appliedSettings?: {
    writing?: {
      provider: string;
      model: string;
      apiKey: string;
    };
    image?: {
      provider: string;
      model: string;
      apiKey: string;
      style?: string;
      quality?: string;
      size?: string;
    };
  };
}

export const useSettings = () => {
  const [settingsData, setSettingsData] = useState<LLMSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await window.electronAPI.getLLMSettings();
      setSettingsData(data);
    } catch (error) {
      handleError(error, '설정 로드 실패:');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings: LLMSettingsData): Promise<SaveSettingsResult> => {
    setIsLoading(true);
    try {
      await window.electronAPI.saveLLMSettings(newSettings);
      setSettingsData(newSettings);
      return { success: true };
    } catch (error) {
      handleError(error, '설정 저장 실패:');
      return { success: false, error: error instanceof Error ? error.message : '설정 저장 실패' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testAPIConnection = useCallback(async (config: LLMConfig) => {
    setIsTesting(true);
    try {
      const result = await window.electronAPI.testLLMConfig(config);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API 테스트 실패'
      };
    } finally {
      setIsTesting(false);
    }
  }, []);

  const getModelStatus = useCallback(() => {
    if (!settingsData) {
      return { writing: '미설정', image: '미설정' };
    }

    const writing = settingsData.appliedSettings.writing.model || '미설정';
    const image = settingsData.appliedSettings.image.model || '미설정';

    return { writing, image };
  }, [settingsData]);

  // 컴포넌트 마운트 시 설정 로드
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings: settingsData?.appliedSettings, // 레거시 호환성
    settingsData, // 새로운 전체 데이터
    isLoading,
    isTesting,
    loadSettings,
    saveSettings,
    testAPIConnection,
    getModelStatus
  };
};
