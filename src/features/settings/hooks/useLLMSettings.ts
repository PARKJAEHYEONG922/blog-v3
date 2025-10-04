/**
 * LLM 설정 상태 관리 훅
 */

import { useState, useEffect } from 'react';
import { LLMConfig } from '@/shared/services/llm/types/llm.types';
import { handleError } from '@/shared/utils/error-handler';
import { getDefaultImageOptions } from '../utils/provider-defaults';

export interface LLMSettings {
  writing: LLMConfig;
  image: LLMConfig;
}

export interface ProviderApiKeys {
  claude: string;
  openai: string;
  gemini: string;
  runware: string;
}

export interface LastUsedSettings {
  writing: { provider: string; model: string };
  image: { provider: string; model: string; style?: string; quality?: string; size?: string };
}

export const useLLMSettings = (onSettingsChange?: () => void) => {
  const [settings, setSettings] = useState<LLMSettings>({
    writing: { provider: 'gemini', model: 'gemini-2.0-flash-exp', apiKey: '' },
    image: { provider: 'gemini', model: 'gemini-2.5-flash-image-preview', apiKey: '', style: 'photographic', quality: 'high', size: '1024x1024' }
  });

  const [providerApiKeys, setProviderApiKeys] = useState<ProviderApiKeys>({
    claude: '',
    openai: '',
    gemini: '',
    runware: ''
  });

  const [lastUsedSettings, setLastUsedSettings] = useState<LastUsedSettings>({
    writing: { provider: 'gemini', model: '' },
    image: { provider: 'gemini', model: '', style: 'photographic', quality: 'high', size: '1024x1024' }
  });

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const cachedData = await window.electronAPI?.getLLMSettings?.();
        if (cachedData) {
          setProviderApiKeys(cachedData.providerApiKeys || { claude: '', openai: '', gemini: '', runware: '' });

          const lastUsed = cachedData.lastUsedSettings || {
            writing: { provider: '', model: '' },
            image: { provider: '', model: '', style: 'photographic', quality: 'high', size: '1024x1024' }
          };
          setLastUsedSettings(lastUsed);

          if (lastUsed.writing.provider) {
            const writingApiKey = cachedData.providerApiKeys?.[lastUsed.writing.provider as keyof ProviderApiKeys] || '';
            setSettings(prev => ({
              ...prev,
              writing: {
                provider: lastUsed.writing.provider as LLMConfig['provider'],
                model: lastUsed.writing.model,
                apiKey: writingApiKey
              }
            }));
          }

          if (lastUsed.image.provider) {
            const imageApiKey = cachedData.providerApiKeys?.[lastUsed.image.provider as keyof ProviderApiKeys] || '';
            setSettings(prev => ({
              ...prev,
              image: {
                provider: lastUsed.image.provider as LLMConfig['provider'],
                model: lastUsed.image.model,
                apiKey: imageApiKey,
                style: lastUsed.image.style || 'photographic',
                quality: lastUsed.image.quality || 'high',
                size: lastUsed.image.size || '1024x1024'
              }
            }));
          }
        }
      } catch (error) {
        // 기본값 사용
      }
    };
    loadSettings();
  }, []);

  // Provider 변경
  const handleProviderChange = (tab: keyof LLMSettings, provider: string) => {
    const newSettings = { ...settings };
    newSettings[tab] = {
      ...newSettings[tab],
      provider: provider as 'openai' | 'claude' | 'gemini' | 'runware',
      model: '',
      apiKey: providerApiKeys[provider as keyof ProviderApiKeys] || ''
    };

    if (tab === 'image') {
      const defaults = getDefaultImageOptions(provider);
      newSettings[tab].size = defaults.size;
      newSettings[tab].style = defaults.style;
      newSettings[tab].quality = defaults.quality;
    }

    setSettings(newSettings);
  };

  // Model 변경
  const handleModelChange = (tab: keyof LLMSettings, model: string) => {
    setSettings(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        model
      }
    }));
  };

  // Style 변경
  const handleStyleChange = (tab: keyof LLMSettings, style: string) => {
    setSettings(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        style
      }
    }));
  };

  // Size 변경
  const handleSizeChange = (tab: keyof LLMSettings, size: string) => {
    setSettings(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        size
      }
    }));
  };

  // Quality 변경
  const handleQualityChange = (tab: keyof LLMSettings, quality: string) => {
    setSettings(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        quality
      }
    }));
  };

  // API Key 변경
  const handleApiKeyChange = (provider: string, apiKey: string) => {
    const newKeys = { ...providerApiKeys };
    newKeys[provider as keyof ProviderApiKeys] = apiKey;
    setProviderApiKeys(newKeys);

    const newSettings = { ...settings };
    Object.keys(newSettings).forEach(tab => {
      if (newSettings[tab as keyof LLMSettings].provider === provider) {
        newSettings[tab as keyof LLMSettings].apiKey = apiKey;
      }
    });
    setSettings(newSettings);
  };

  // API Key 삭제
  const deleteApiKey = async (category: keyof LLMSettings) => {
    const newSettings = { ...settings };
    newSettings[category] = {
      ...newSettings[category],
      apiKey: '',
      model: ''
    };

    const newLastUsedSettings = { ...lastUsedSettings };
    if (category === 'image') {
      newLastUsedSettings[category] = { provider: 'gemini', model: '', style: 'photographic', quality: 'high', size: '1024x1024' };
    } else {
      newLastUsedSettings[category] = { provider: 'gemini', model: '' };
    }

    await window.electronAPI?.saveLLMSettings?.({
      providerApiKeys,
      lastUsedSettings: newLastUsedSettings
    });

    setSettings(newSettings);
    setLastUsedSettings(newLastUsedSettings);

    onSettingsChange?.();
  };

  // 설정 저장
  const saveSettings = async (testingStatus?: any) => {
    try {
      await window.electronAPI?.saveLLMSettings?.({
        lastUsedSettings,
        providerApiKeys,
        testingStatus
      });

      onSettingsChange?.();
    } catch (error) {
      handleError(error, '설정 저장 실패:');
    }
  };

  // 테스트 성공 시 설정 저장
  const saveAfterTest = async (category: keyof LLMSettings, testingStatus?: any) => {
    const { apiKey, ...settingsWithoutKey } = settings[category];
    const newLastUsedSettings = {
      ...lastUsedSettings,
      [category]: settingsWithoutKey
    };
    setLastUsedSettings(newLastUsedSettings);

    const provider = settings[category].provider;
    const newProviderApiKeys = {
      ...providerApiKeys,
      [provider]: apiKey
    };
    setProviderApiKeys(newProviderApiKeys);

    try {
      await window.electronAPI?.saveLLMSettings?.({
        lastUsedSettings: newLastUsedSettings,
        providerApiKeys: newProviderApiKeys,
        testingStatus
      });
    } catch (error) {
      handleError(error, '자동 저장 실패:');
    }

    onSettingsChange?.();

    // 커스텀 이벤트 발생
    window.dispatchEvent(new CustomEvent('llm-settings-changed', {
      detail: { category, provider, model: settings[category].model }
    }));
  };

  return {
    settings,
    providerApiKeys,
    lastUsedSettings,
    setLastUsedSettings,
    handleProviderChange,
    handleModelChange,
    handleStyleChange,
    handleSizeChange,
    handleQualityChange,
    handleApiKeyChange,
    deleteApiKey,
    saveSettings,
    saveAfterTest
  };
};
