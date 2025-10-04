import React, { useState, useEffect } from 'react';
import Button from '@/shared/components/ui/Button';
import { IMAGE_GENERATION_OPTIONS } from '@/shared/utils/constants';
import { LLMConfig } from '@/shared/services/llm/types/llm.types';
import { handleError } from '@/shared/utils/error-handler';

interface LLMSettingsProps {
  onClose: () => void;
  onSettingsChange?: () => void;
}

interface LLMSettings {
  writing: LLMConfig;
  image: LLMConfig;
}

interface ProviderApiKeys {
  claude: string;
  openai: string;
  gemini: string;
  runware: string;
}

interface Provider {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  tier: string;
}

const LLMSettings: React.FC<LLMSettingsProps> = ({ onClose, onSettingsChange }) => {
  const [activeTab, setActiveTab] = useState<'writing' | 'image'>('writing');
  const [providerApiKeys, setProviderApiKeys] = useState<ProviderApiKeys>({
    claude: '',
    openai: '',
    gemini: '',
    runware: ''
  });

  // LLM 설정 (UI에서 임시로 입력하는 값)
  const [settings, setSettings] = useState<LLMSettings>({
    writing: { provider: 'gemini', model: 'gemini-2.0-flash-exp', apiKey: '' },
    image: { provider: 'gemini', model: 'gemini-2.5-flash-image-preview', apiKey: '', style: 'photographic', quality: 'high', size: '1024x1024' }
  });

  // 마지막 사용 설정 (provider, model, style/quality/size만 저장)
  // API 키는 providerApiKeys에서 조회
  const [lastUsedSettings, setLastUsedSettings] = useState<{
    writing: { provider: string; model: string };
    image: { provider: string; model: string; style?: string; quality?: string; size?: string };
  }>({
    writing: { provider: 'gemini', model: '' },
    image: { provider: 'gemini', model: '', style: 'photographic', quality: 'high', size: '1024x1024' }
  });

  // API 키 테스트 상태
  const [testingStatus, setTestingStatus] = useState<{
    [key: string]: {
      testing: boolean;
      success: boolean;
      message: string;
    }
  }>({});

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const cachedData = await window.electronAPI?.getLLMSettings?.();
        if (cachedData) {
          // Provider별 API 키 로드
          setProviderApiKeys(cachedData.providerApiKeys || { claude: '', openai: '', gemini: '', runware: '' });

          // 마지막 사용 설정 로드
          const lastUsed = cachedData.lastUsedSettings || {
            writing: { provider: '', model: '' },
            image: { provider: '', model: '', style: 'photographic', quality: 'high', size: '1024x1024' }
          };
          setLastUsedSettings(lastUsed);

          // UI에 마지막 사용 설정 반영 (provider, model만)
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

  const providers = [
    { id: 'claude', name: 'Claude', icon: '🟠', color: 'orange' },
    { id: 'openai', name: 'OpenAI', icon: '🔵', color: 'blue' },
    { id: 'gemini', name: 'Gemini', icon: '🟢', color: 'green' },
    { id: 'runware', name: 'Runware', icon: '⚡', color: 'purple' }
  ];

  const modelsByProvider = {
    claude: {
      text: [
        { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: '최신 고품질 모델', tier: 'premium' },
        { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1', description: '최고품질 모델', tier: 'premium' },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: '빠르고 경제적', tier: 'basic' }
      ]
    },
    openai: {
      text: [
        { id: 'gpt-5', name: 'GPT-5', description: '최고 성능 모델', tier: 'enterprise' },
        { id: 'gpt-5-mini', name: 'GPT-5 Mini', description: '균형잡힌 성능', tier: 'premium' },
        { id: 'gpt-5-nano', name: 'GPT-5 Nano', description: '빠르고 경제적', tier: 'basic' }
      ],
      image: [
        { id: 'dall-e-3', name: 'DALL-E 3', description: '고품질 이미지 생성 (권장)', tier: 'basic' },
        { id: 'gpt-image-1', name: 'GPT Image 1', description: '최신 모델 (Limited Access 필요)', tier: 'premium' }
      ]
    },
    gemini: {
      text: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: '최고성능 모델', tier: 'premium' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: '경제적 모델', tier: 'basic' }
      ],
      image: [
        { id: 'gemini-2.5-flash-image-preview', name: 'Gemini 2.5 Flash Image', description: '이미지 생성 및 편집', tier: 'enterprise' }
      ]
    },
    runware: {
      image: [
        { id: 'sdxl-base', name: 'Stable Diffusion XL', description: '다양한 스타일 지원 모델', tier: 'basic' },
        { id: 'flux-base', name: 'FLUX.1', description: '고품질 세밀한 생성 모델', tier: 'premium' }
      ]
    }
  };

  const handleProviderChange = (tab: keyof LLMSettings, provider: string) => {
    const newSettings = { ...settings };
    newSettings[tab] = {
      ...newSettings[tab],
      provider: provider as 'openai' | 'claude' | 'gemini' | 'runware',
      model: '', // 모델 초기화 (사용자가 직접 선택)
      apiKey: providerApiKeys[provider as keyof ProviderApiKeys] || ''
    };

    // 이미지 탭에서 provider 변경 시 해당 provider의 기본값으로 초기화
    if (tab === 'image') {
      if (provider === 'gemini') {
        newSettings[tab].size = '1024x1024';
        newSettings[tab].style = 'photographic';
        newSettings[tab].quality = 'high';
      } else if (provider === 'openai') {
        newSettings[tab].size = '1024x1024';
        newSettings[tab].style = undefined; // OpenAI는 스타일 없음
        newSettings[tab].quality = 'high';
      } else if (provider === 'runware') {
        newSettings[tab].size = '1024x1024';
        newSettings[tab].style = 'realistic';
        newSettings[tab].quality = 'high';
      }
    }

    setSettings(newSettings);

    // provider 변경 시 테스트 상태 초기화
    setTestingStatus(prev => ({
      ...prev,
      [tab]: { testing: false, success: false, message: '' }
    }));
  };

  const handleModelChange = (tab: keyof LLMSettings, model: string) => {
    const newSettings = { ...settings };
    newSettings[tab] = {
      ...newSettings[tab],
      model
    };
    setSettings(newSettings);

    // 모델 변경 시 테스트 상태 초기화
    setTestingStatus(prev => ({
      ...prev,
      [tab]: { testing: false, success: false, message: '' }
    }));
  };

  const handleStyleChange = (tab: keyof LLMSettings, style: string) => {
    const newSettings = { ...settings };
    newSettings[tab] = {
      ...newSettings[tab],
      style
    };
    setSettings(newSettings);

    // 스타일 변경 시 테스트 상태 초기화
    setTestingStatus(prev => ({
      ...prev,
      [tab]: { testing: false, success: false, message: '' }
    }));
  };

  const handleSizeChange = (tab: keyof LLMSettings, size: string) => {
    const newSettings = { ...settings };
    newSettings[tab] = {
      ...newSettings[tab],
      size
    };
    setSettings(newSettings);

    // 사이즈 변경 시 테스트 상태 초기화
    setTestingStatus(prev => ({
      ...prev,
      [tab]: { testing: false, success: false, message: '' }
    }));
  };

  const handleQualityChange = (tab: keyof LLMSettings, quality: string) => {
    const newSettings = { ...settings };
    newSettings[tab] = {
      ...newSettings[tab],
      quality
    };
    setSettings(newSettings);

    // 품질 변경 시 테스트 상태 초기화
    setTestingStatus(prev => ({
      ...prev,
      [tab]: { testing: false, success: false, message: '' }
    }));
  };

  const handleApiKeyChange = (provider: string, apiKey: string) => {
    const newKeys = { ...providerApiKeys };
    newKeys[provider as keyof ProviderApiKeys] = apiKey;
    setProviderApiKeys(newKeys);

    // 같은 provider를 사용하는 모든 탭에 API 키 적용
    const newSettings = { ...settings };
    Object.keys(newSettings).forEach(tab => {
      if (newSettings[tab as keyof LLMSettings].provider === provider) {
        newSettings[tab as keyof LLMSettings].apiKey = apiKey;
      }
    });
    setSettings(newSettings);
  };

  const testApiKey = async (category: keyof LLMSettings) => {
    const { provider, apiKey, model, size, style, quality } = settings[category];

    if (!apiKey || !provider || !model) {
      setTestingStatus(prev => ({
        ...prev,
        [category]: { testing: false, success: false, message: '❌ 제공자, 모델, API 키를 모두 입력해주세요.' }
      }));
      return;
    }

    // 테스트 시작
    setTestingStatus(prev => ({
      ...prev,
      [category]: { testing: true, success: false, message: '연결 테스트 중...' }
    }));

    try {
      // 실제 API 테스트 (category, model, size, style, quality 전달)
      const result = await testAPIConnection(provider, apiKey, category, model, size, style, quality);
      
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

        // 커스텀 이벤트 발생 (2단계에서 실시간 감지용)
        window.dispatchEvent(new CustomEvent('llm-settings-changed', {
          detail: { category, provider, model }
        }));
        
        // 테스트 성공한 설정을 lastUsedSettings에 반영 (API 키 제외)
        const { apiKey, ...settingsWithoutKey } = settings[category];
        const newLastUsedSettings = {
          ...lastUsedSettings,
          [category]: settingsWithoutKey
        };
        setLastUsedSettings(newLastUsedSettings);

        // Provider별 API 키 업데이트
        const newProviderApiKeys = {
          ...providerApiKeys,
          [provider]: apiKey
        };
        setProviderApiKeys(newProviderApiKeys);

        // 파일에도 자동 저장
        try {
          await window.electronAPI?.saveLLMSettings?.({
            lastUsedSettings: newLastUsedSettings,
            providerApiKeys: newProviderApiKeys,
            testingStatus
          });
        } catch (error) {
          handleError(error, '자동 저장 실패:');
        }
        
        // 설정 변경 시 부모 컴포넌트에 알림
        if (onSettingsChange) {
          onSettingsChange();
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
      // 에러
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

  // API 키 삭제 함수
  const deleteApiKey = async (category: keyof LLMSettings) => {
    // 해당 카테고리의 설정만 초기화 (다른 카테고리의 API 키는 유지)
    const newSettings = { ...settings };
    newSettings[category] = {
      ...newSettings[category],
      apiKey: '',
      model: ''
    };

    // 마지막 사용 설정 초기화
    const newLastUsedSettings = { ...lastUsedSettings };
    if (category === 'image') {
      newLastUsedSettings[category] = { provider: 'gemini', model: '', style: 'photographic', quality: 'high', size: '1024x1024' };
    } else {
      newLastUsedSettings[category] = { provider: 'gemini', model: '' };
    }

    // 설정 파일에 직접 저장
    await window.electronAPI?.saveLLMSettings?.({
      ...newSettings,
      lastUsedSettings: newLastUsedSettings
    });

    // State 업데이트 (providerApiKeys는 건드리지 않음 - 다른 카테고리가 사용 중일 수 있음)
    setSettings(newSettings);
    setLastUsedSettings(newLastUsedSettings);

    // 테스트 상태 초기화
    setTestingStatus(prev => ({
      ...prev,
      [category]: { testing: false, success: false, message: '' }
    }));

    // 설정 변경 시 부모 컴포넌트에 알림
    if (onSettingsChange) {
      onSettingsChange();
    }
  };

  // 실제 API 연결 테스트 (Electron IPC 사용)
  const testAPIConnection = async (provider: string, apiKey: string, category?: string, model?: string, size?: string, style?: string, quality?: string): Promise<{success: boolean, message: string}> => {
    console.log(`🔍 Testing ${provider} API with key: ${apiKey.substring(0, 10)}...`);

    try {
      // Electron IPC를 통해 Main process에서 API 테스트 실행
      const result = await window.electronAPI?.testLLMConfig?.({ provider, apiKey, category, model, size, style, quality });
      
      console.log(`📡 ${provider} API 테스트 결과:`, result);
      
      if (!result) {
        return { success: false, message: '테스트 응답을 받지 못했습니다.' };
      }
      
      // result에 message가 없고 error가 있으면 error를 message로 변환
      if ('error' in result && !('message' in result)) {
        return { 
          success: result.success, 
          message: result.error || (result.success ? '연결 성공' : '연결 실패') 
        };
      }
      
      return result as { success: boolean, message: string };
      
    } catch (error) {
      handleError(error, `❌ ${provider} API 테스트 실패:`);
      
      if (error instanceof Error) {
        return { success: false, message: `연결 오류: ${error.message}` };
      }
      
      return { success: false, message: `연결 테스트 실패: ${String(error)}` };
    }
  };

  const saveSettings = async () => {
    try {
      await window.electronAPI?.saveLLMSettings?.({
        lastUsedSettings,
        providerApiKeys,
        testingStatus
      });
      
      onSettingsChange?.();
      onClose();
    } catch (error) {
      handleError(error, '설정 저장 실패:');
    }
  };

  const getAvailableModels = (tab: keyof LLMSettings, provider: string) => {
    const providerModels = modelsByProvider[provider as keyof typeof modelsByProvider];
    if (!providerModels) return [];
    
    if (tab === 'image') {
      return ('image' in providerModels) ? providerModels.image || [] : [];
    }
    return ('text' in providerModels) ? providerModels.text || [] : [];
  };

  const getWritingProviders = () => {
    return providers.filter(p => p.id !== 'runware'); // Runware는 이미지 전용이므로 글쓰기에서 제외
  };

  const getImageProviders = () => {
    return providers.filter(p => ['gemini', 'openai', 'runware'].includes(p.id)); // 이미지 모델 지원하는 provider들
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-4xl w-11/12 max-h-[85vh] overflow-auto text-gray-700 shadow-2xl transform transition-all duration-300 scale-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg">
              🤖
            </div>
            <h2 className="text-2xl font-bold text-gray-800">AI 모델 설정</h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="w-8 h-8 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50"
          >
            ✕
          </Button>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex mb-8 bg-gray-50 rounded-xl p-1 shadow-inner">
          <button
            onClick={() => setActiveTab('writing')}
            className={`flex-1 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'writing'
                ? 'bg-white text-blue-600 shadow-md border-2 border-blue-200'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center justify-center space-x-2">
              <span>✍️</span>
              <span>글쓰기 AI</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'image'
                ? 'bg-white text-purple-600 shadow-md border-2 border-purple-200'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center justify-center space-x-2">
              <span>🎨</span>
              <span>이미지 AI</span>
            </span>
          </button>
        </div>

        {/* 글쓰기 AI 탭 */}
        {activeTab === 'writing' && (
          <div>
            <div className="mb-6">
              <label className="block mb-3 text-sm font-semibold text-gray-700">
                제공업체
              </label>
              <div className="flex gap-3 flex-wrap">
                {getWritingProviders().map((provider: Provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderChange('writing', provider.id)}
                    className={`px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center space-x-2 hover:-translate-y-0.5 shadow-sm hover:shadow-md ${
                      settings.writing.provider === provider.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-blue-100'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>{provider.icon}</span>
                    <span>{provider.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {settings.writing.provider && (
              <>
                <div className="mb-6">
                  <label className="block mb-3 text-sm font-semibold text-gray-700">
                    모델
                  </label>
                  <select
                    value={settings.writing.model}
                    onChange={(e) => handleModelChange('writing', e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 cursor-pointer"
                  >
                    <option value="">모델을 선택하세요</option>
                    {getAvailableModels('writing', settings.writing.provider).map((model: ModelInfo) => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block mb-3 text-sm font-semibold text-gray-700">
                    API 키
                  </label>
                  <input
                    type="password"
                    value={providerApiKeys[settings.writing.provider as keyof ProviderApiKeys] || ''}
                    onChange={(e) => handleApiKeyChange(settings.writing.provider, e.target.value)}
                    placeholder={`${settings.writing.provider} API 키를 입력하세요`}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 placeholder-gray-400"
                  />
                </div>

                {/* 테스트 및 적용, 삭제 버튼 */}
                <div className="flex justify-end space-x-3 mt-4 mb-4">
                  <Button
                    onClick={() => deleteApiKey('writing')}
                    disabled={testingStatus.writing?.testing || !settings.writing.apiKey}
                    variant="danger"
                    size="sm"
                    className="inline-flex items-center space-x-2"
                  >
                    <span>🗑️</span>
                    <span>삭제</span>
                  </Button>
                  
                  <Button
                    onClick={() => testApiKey('writing')}
                    disabled={!settings.writing.apiKey || testingStatus.writing?.testing}
                    loading={testingStatus.writing?.testing}
                    variant={testingStatus.writing?.success ? "success" : "primary"}
                    size="sm"
                    className="inline-flex items-center space-x-2"
                  >
                    {!testingStatus.writing?.testing && (
                      <span>{testingStatus.writing?.success ? '✅' : '🧪'}</span>
                    )}
                    <span>{testingStatus.writing?.testing ? '테스트 중...' : testingStatus.writing?.success ? '적용 완료' : '테스트 및 적용'}</span>
                  </Button>
                </div>
                
                {/* 테스트 결과 메시지 */}
                {testingStatus.writing?.message && (
                  <div className={`p-4 rounded-xl mt-3 border-2 ${
                    testingStatus.writing.success 
                      ? 'bg-green-50 border-green-200' 
                      : testingStatus.writing.testing 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <p className={`text-sm font-medium m-0 ${
                      testingStatus.writing.success 
                        ? 'text-green-700' 
                        : testingStatus.writing.testing 
                        ? 'text-blue-700' 
                        : 'text-red-700'
                    }`}>
                      {testingStatus.writing.message}
                    </p>
                  </div>
                )}

                {/* 현재 적용된 설정 */}
                {lastUsedSettings.writing.provider && (
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl mt-6 shadow-sm">
                    <h4 className="font-semibold text-sm text-blue-800 mb-3 m-0 flex items-center space-x-2">
                      <span>⚙️</span>
                      <span>현재 적용된 설정</span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-600 block mb-1">제공자</span>
                        <span className="font-semibold text-blue-700">{lastUsedSettings.writing.provider.toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block mb-1">모델</span>
                        <span className="font-semibold text-blue-700">{lastUsedSettings.writing.model || '미선택'}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block mb-1">API 키</span>
                        <div className={`flex items-center space-x-1 font-semibold ${
                          providerApiKeys[lastUsedSettings.writing.provider as keyof ProviderApiKeys] ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          <span>{providerApiKeys[lastUsedSettings.writing.provider as keyof ProviderApiKeys] ? '🔑' : '🔒'}</span>
                          <span>{providerApiKeys[lastUsedSettings.writing.provider as keyof ProviderApiKeys] ? '설정됨' : '미설정'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-600 block mb-1">연결 상태</span>
                        <div className={`flex items-center space-x-1 font-semibold ${
                          testingStatus.writing?.success || (lastUsedSettings.writing.provider && providerApiKeys[lastUsedSettings.writing.provider as keyof ProviderApiKeys])
                            ? 'text-emerald-600'
                            : testingStatus.writing?.message && !testingStatus.writing?.success
                            ? 'text-red-500'
                            : 'text-slate-500'
                        }`}>
                          <span>
                            {testingStatus.writing?.testing
                              ? '🔄'
                              : testingStatus.writing?.success
                              ? '✅'
                              : (lastUsedSettings.writing.provider && providerApiKeys[lastUsedSettings.writing.provider as keyof ProviderApiKeys])
                              ? '✅'
                              : testingStatus.writing?.message && !testingStatus.writing?.success
                              ? '❌'
                              : '⚪'}
                          </span>
                          <span>
                            {testingStatus.writing?.testing
                              ? '테스트 중...'
                              : testingStatus.writing?.success
                              ? '연결됨'
                              : (lastUsedSettings.writing.provider && providerApiKeys[lastUsedSettings.writing.provider as keyof ProviderApiKeys])
                              ? '연결됨'
                              : testingStatus.writing?.message && !testingStatus.writing?.success
                              ? '연결 실패'
                              : '미확인'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* API 키 발급 가이드 */}
                {settings.writing.provider && (
                  <div className={`p-5 rounded-xl mt-6 border-2 ${
                    settings.writing.provider === 'claude' 
                      ? 'bg-orange-50 border-orange-200' 
                      : settings.writing.provider === 'openai' 
                      ? 'bg-blue-50 border-blue-200' 
                      : settings.writing.provider === 'gemini' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h4 className={`font-semibold mb-3 flex items-center space-x-2 ${
                      settings.writing.provider === 'claude' 
                        ? 'text-orange-700' 
                        : settings.writing.provider === 'openai' 
                        ? 'text-blue-700' 
                        : settings.writing.provider === 'gemini' 
                        ? 'text-green-700' 
                        : 'text-gray-700'
                    }`}>
                      <span>📝</span>
                      <span>{
                        settings.writing.provider === 'claude' ? 'Claude' :
                        settings.writing.provider === 'openai' ? 'OpenAI' :
                        settings.writing.provider === 'gemini' ? 'Gemini' : ''
                      } API 키 발급 방법</span>
                    </h4>
                    <ol className={`text-sm leading-relaxed m-0 pl-5 ${
                      settings.writing.provider === 'claude' 
                        ? 'text-orange-600' 
                        : settings.writing.provider === 'openai' 
                        ? 'text-blue-600' 
                        : settings.writing.provider === 'gemini' 
                        ? 'text-green-600' 
                        : 'text-gray-600'
                    }`}>
                      {settings.writing.provider === 'claude' && (
                        <>
                          <li><a href="#" onClick={(e) => { e.preventDefault(); window.electronAPI?.openExternal?.('https://console.anthropic.com'); }} className="underline cursor-pointer">Claude Console</a> 접속</li>
                          <li>계정 생성 또는 로그인</li>
                          <li>"Get API Keys" 또는 "API Keys" 메뉴 선택</li>
                          <li>"Create Key" 버튼 클릭하여 새 API 키 생성</li>
                          <li>API 키를 복사해서 위에 입력</li>
                          <li>"테스트 및 적용" 버튼 클릭</li>
                        </>
                      )}
                      {settings.writing.provider === 'openai' && (
                        <>
                          <li><a href="#" onClick={(e) => { e.preventDefault(); window.electronAPI?.openExternal?.('https://platform.openai.com'); }} className="underline cursor-pointer">OpenAI Platform</a> 접속</li>
                          <li>계정 생성 또는 로그인</li>
                          <li>우상단 프로필 → "View API keys" 선택</li>
                          <li>"Create new secret key" 버튼 클릭</li>
                          <li>API 키를 복사해서 위에 입력</li>
                          <li>"테스트 및 적용" 버튼 클릭</li>
                        </>
                      )}
                      {settings.writing.provider === 'gemini' && (
                        <>
                          <li><a href="#" onClick={(e) => { e.preventDefault(); window.electronAPI?.openExternal?.('https://aistudio.google.com/app/apikey'); }} className="underline cursor-pointer">Google AI Studio</a> 접속</li>
                          <li>구글 계정으로 로그인</li>
                          <li>"Create API key" 버튼 클릭</li>
                          <li>프로젝트 선택 또는 새 프로젝트 생성</li>
                          <li>API 키를 복사해서 위에 입력</li>
                          <li>"테스트 및 적용" 버튼 클릭</li>
                        </>
                      )}
                    </ol>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 이미지 AI 탭 */}
        {activeTab === 'image' && (
          <div>
            <div className="mb-6">
              <label className="block mb-3 text-sm font-semibold text-gray-700">
                제공업체
              </label>
              <div className="flex gap-3 flex-wrap">
                {getImageProviders().map((provider: Provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderChange('image', provider.id)}
                    className={`px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center space-x-2 hover:-translate-y-0.5 shadow-sm hover:shadow-md ${
                      settings.image.provider === provider.id
                        ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-purple-100'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>{provider.icon}</span>
                    <span>{provider.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {settings.image.provider && (
              <>
                <div className="mb-6">
                  <label className="block mb-3 text-sm font-semibold text-gray-700">
                    모델
                  </label>
                  <select
                    value={settings.image.model}
                    onChange={(e) => handleModelChange('image', e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 cursor-pointer"
                  >
                    <option value="">모델을 선택하세요</option>
                    {getAvailableModels('image', settings.image.provider).map((model: ModelInfo) => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 이미지 생성 옵션 */}
                {settings.image.provider && (
                  <div className="space-y-6 mb-6">
                    {/* OpenAI GPT/DALL-E 옵션 */}
                    {settings.image.provider === 'openai' && (
                      <div className="space-y-4">
                        {/* 품질 선택 */}
                        <div>
                          <label className="block mb-3 text-sm font-semibold text-gray-700">
                            이미지 품질
                          </label>
                          <select
                            value={settings.image.quality || 'medium'}
                            onChange={(e) => handleQualityChange('image', e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 cursor-pointer"
                          >
                            <option value="low">저품질 - $0.01/이미지 (빠른 생성)</option>
                            <option value="medium">중품질 - $0.04/이미지 (균형)</option>
                            <option value="high">고품질 - $0.17/이미지 (최고 품질, 권장)</option>
                          </select>
                        </div>

                        {/* 해상도 선택 */}
                        <div>
                          <label className="block mb-3 text-sm font-semibold text-gray-700">
                            이미지 크기
                          </label>
                          <select
                            value={settings.image.size || '1024x1024'}
                            onChange={(e) => handleSizeChange('image', e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 cursor-pointer"
                          >
                            <option value="1024x1024">1024x1024 (정사각형)</option>
                            <option value="1024x1536">1024x1536 (세로형)</option>
                            <option value="1536x1024">1536x1024 (가로형)</option>
                          </select>
                        </div>

                        {/* 비용 정보 */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <div className="text-sm text-blue-700 space-y-1">
                            <div><strong>💰 비용:</strong> {
                              settings.image.quality === 'low' ? '$0.01/이미지' :
                              settings.image.quality === 'high' ? '$0.17/이미지' :
                              '$0.04/이미지'
                            }</div>
                            <div><strong>📐 해상도:</strong> {settings.image.size || '1024x1024'}</div>
                            <div><strong>⚙️ 품질:</strong> {
                              settings.image.quality === 'low' ? '저품질 (빠름)' :
                              settings.image.quality === 'high' ? '고품질 (최고)' :
                              '중품질 (권장)'
                            }</div>
                            <div><strong>✨ 특징:</strong> GPT 기반, 정확한 텍스트 렌더링, 이미지 편집 지원</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Runware 옵션 */}
                    {settings.image.provider === 'runware' && (
                      <div className="space-y-4">
                        {/* 품질 선택 */}
                        <div>
                          <label className="block mb-3 text-sm font-semibold text-gray-700">
                            이미지 품질 (Steps)
                          </label>
                          <select
                            value={settings.image.quality || 'medium'}
                            onChange={(e) => handleQualityChange('image', e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 cursor-pointer"
                          >
                            <option value="low">저품질 - 10 steps (빠른 생성)</option>
                            <option value="medium">중품질 - 15 steps (권장)</option>
                            <option value="high">고품질 - 25 steps (최고 품질)</option>
                          </select>
                        </div>

                        {/* 해상도 선택 */}
                        <div>
                          <label className="block mb-3 text-sm font-semibold text-gray-700">
                            이미지 크기
                          </label>
                          <select
                            value={settings.image.size || '1024x1024'}
                            onChange={(e) => handleSizeChange('image', e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 cursor-pointer"
                          >
                            <option value="1024x1024">1024x1024 (정사각형)</option>
                            <option value="1024x1536">1024x1536 (세로형)</option>
                            <option value="1536x1024">1536x1024 (가로형)</option>
                            <option value="512x768">512x768 (초저가 세로형)</option>
                            <option value="768x512">768x512 (초저가 가로형)</option>
                          </select>
                        </div>

                        {/* 스타일 선택 */}
                        <div>
                          <label className="block mb-3 text-sm font-semibold text-gray-700">
                            이미지 스타일
                          </label>
                          <select
                            value={settings.image.style || 'realistic'}
                            onChange={(e) => handleStyleChange('image', e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 cursor-pointer"
                          >
                            {IMAGE_GENERATION_OPTIONS.runware.styles.map(style => (
                              <option key={style.value} value={style.value}>{style.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* 비용 정보 */}
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                          <div className="text-sm text-purple-700 space-y-1">
                            <div><strong>💰 비용:</strong> $0.0006~$0.003/이미지 (초저가!)</div>
                            <div><strong>📐 해상도:</strong> {settings.image.size || '1024x1024'}</div>
                            <div><strong>🎛️ 품질:</strong> {
                              settings.image.quality === 'low' ? '10 steps (빠름)' :
                              settings.image.quality === 'high' ? '25 steps (최고)' :
                              '15 steps (권장)'
                            }</div>
                            <div><strong>🎨 스타일:</strong> {settings.image.style || 'realistic'}</div>
                            <div><strong>⚡ 특징:</strong> 업계 최저가, 초고속 생성, 다양한 모델 지원</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Gemini 옵션 */}
                    {settings.image.provider === 'gemini' && (
                      <div className="space-y-4">
                        {/* 스타일 선택 */}
                        <div>
                          <label className="block mb-3 text-sm font-semibold text-gray-700">
                            이미지 스타일
                          </label>
                          <select
                            value={settings.image.style || 'photographic'}
                            onChange={(e) => handleStyleChange('image', e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 cursor-pointer"
                          >
                            {IMAGE_GENERATION_OPTIONS.gemini.styles.map(style => (
                              <option key={style.value} value={style.value}>{style.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* 품질 선택 (Gemini는 고정) */}
                        <div>
                          <label className="block mb-3 text-sm font-semibold text-gray-700">
                            이미지 품질
                          </label>
                          <select
                            value={settings.image.quality || 'high'}
                            onChange={(e) => handleQualityChange('image', e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 cursor-pointer"
                          >
                            <option value="high">고품질 (고정)</option>
                          </select>
                        </div>

                        {/* 크기 선택 (Gemini는 정사각형만) */}
                        <div>
                          <label className="block mb-3 text-sm font-semibold text-gray-700">
                            이미지 크기
                          </label>
                          <select
                            value={settings.image.size || '1024x1024'}
                            onChange={(e) => handleSizeChange('image', e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 cursor-pointer"
                          >
                            <option value="1024x1024">1024x1024 (정사각형만 지원)</option>
                          </select>
                        </div>

                        {/* 비용 정보 */}
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <div className="text-sm text-green-700 space-y-1">
                            <div><strong>💰 비용:</strong> $0.039/이미지 (고정)</div>
                            <div><strong>📐 해상도:</strong> {settings.image.size || '1024x1024'} (정사각형만 지원)</div>
                            <div><strong>⚙️ 품질:</strong> {settings.image.quality || 'high'}</div>
                            <div><strong>🎨 스타일:</strong> {settings.image.style || 'photographic'}</div>
                            <div><strong>⚠️ 참고:</strong> Gemini는 정사각형(1:1) 비율만 지원</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-6">
                  <label className="block mb-3 text-sm font-semibold text-gray-700">
                    API 키
                  </label>
                  <input
                    type="password"
                    value={providerApiKeys[settings.image.provider as keyof ProviderApiKeys] || ''}
                    onChange={(e) => handleApiKeyChange(settings.image.provider, e.target.value)}
                    placeholder={`${settings.image.provider} API 키를 입력하세요`}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 placeholder-gray-400"
                  />
                </div>

                {/* 테스트 및 적용, 삭제 버튼 */}
                <div className="flex justify-end space-x-3 mt-4 mb-4">
                  <Button
                    onClick={() => deleteApiKey('image')}
                    disabled={testingStatus.image?.testing || !settings.image.apiKey}
                    variant="danger"
                    size="sm"
                    className="inline-flex items-center space-x-2"
                  >
                    <span>🗑️</span>
                    <span>삭제</span>
                  </Button>
                  
                  <Button
                    onClick={() => testApiKey('image')}
                    disabled={!settings.image.apiKey || testingStatus.image?.testing}
                    loading={testingStatus.image?.testing}
                    variant={testingStatus.image?.success ? "success" : "primary"}
                    size="sm"
                    className="inline-flex items-center space-x-2"
                  >
                    {!testingStatus.image?.testing && (
                      <span>{testingStatus.image?.success ? '✅' : '🧪'}</span>
                    )}
                    <span>{testingStatus.image?.testing ? '테스트 중...' : testingStatus.image?.success ? '적용 완료' : '테스트 및 적용'}</span>
                  </Button>
                </div>
                
                {/* 테스트 결과 메시지 */}
                {testingStatus.image?.message && (
                  <div className={`p-4 rounded-xl mt-3 border-2 ${
                    testingStatus.image.success 
                      ? 'bg-green-50 border-green-200' 
                      : testingStatus.image.testing 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <p className={`text-sm font-medium m-0 ${
                      testingStatus.image.success 
                        ? 'text-green-700' 
                        : testingStatus.image.testing 
                        ? 'text-blue-700' 
                        : 'text-red-700'
                    }`}>
                      {testingStatus.image.message}
                    </p>
                  </div>
                )}

                {/* 현재 적용된 설정 */}
                {lastUsedSettings.image.provider && (
                  <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl mt-6 shadow-sm">
                    <h4 className="font-semibold text-sm text-purple-800 mb-3 m-0 flex items-center space-x-2">
                      <span>⚙️</span>
                      <span>현재 적용된 설정</span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-600 block mb-1">제공자</span>
                        <span className="font-semibold text-purple-700">{lastUsedSettings.image.provider.toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block mb-1">모델</span>
                        <span className="font-semibold text-purple-700">{lastUsedSettings.image.model || '미선택'}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block mb-1">API 키</span>
                        <div className={`flex items-center space-x-1 font-semibold ${
                          providerApiKeys[lastUsedSettings.image.provider as keyof ProviderApiKeys] ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          <span>{providerApiKeys[lastUsedSettings.image.provider as keyof ProviderApiKeys] ? '🔑' : '🔒'}</span>
                          <span>{providerApiKeys[lastUsedSettings.image.provider as keyof ProviderApiKeys] ? '설정됨' : '미설정'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-600 block mb-1">연결 상태</span>
                        <div className={`flex items-center space-x-1 font-semibold ${
                          testingStatus.image?.success || (lastUsedSettings.image.provider && providerApiKeys[lastUsedSettings.image.provider as keyof ProviderApiKeys])
                            ? 'text-emerald-600'
                            : testingStatus.image?.message && !testingStatus.image?.success
                            ? 'text-red-500'
                            : 'text-slate-500'
                        }`}>
                          <span>
                            {testingStatus.image?.testing
                              ? '🔄'
                              : testingStatus.image?.success
                              ? '✅'
                              : (lastUsedSettings.image.provider && providerApiKeys[lastUsedSettings.image.provider as keyof ProviderApiKeys])
                              ? '✅'
                              : testingStatus.image?.message && !testingStatus.image?.success
                              ? '❌'
                              : '⚪'}
                          </span>
                          <span>
                            {testingStatus.image?.testing
                              ? '테스트 중...'
                              : testingStatus.image?.success
                              ? '연결됨'
                              : (lastUsedSettings.image.provider && providerApiKeys[lastUsedSettings.image.provider as keyof ProviderApiKeys])
                              ? '연결됨'
                              : testingStatus.image?.message && !testingStatus.image?.success
                              ? '연결 실패'
                              : '미확인'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* API 키 발급 가이드 */}
                {settings.image.provider && (
                  <div className={`p-5 rounded-xl mt-6 border-2 ${
                    settings.image.provider === 'gemini' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h4 className={`font-semibold mb-3 flex items-center space-x-2 ${
                      settings.image.provider === 'gemini' 
                        ? 'text-green-700' 
                        : 'text-gray-700'
                    }`}>
                      <span>📝</span>
                      <span>{settings.image.provider === 'gemini' ? 'Gemini' : ''} API 키 발급 방법</span>
                    </h4>
                    <ol className={`text-sm leading-relaxed m-0 pl-5 ${
                      settings.image.provider === 'gemini' 
                        ? 'text-green-600' 
                        : 'text-gray-600'
                    }`}>
                      {settings.image.provider === 'gemini' && (
                        <>
                          <li><a href="#" onClick={(e) => { e.preventDefault(); window.electronAPI?.openExternal?.('https://aistudio.google.com/app/apikey'); }} className="underline cursor-pointer">Google AI Studio</a> 접속</li>
                          <li>구글 계정으로 로그인</li>
                          <li>"Create API key" 버튼 클릭</li>
                          <li>프로젝트 선택 또는 새 프로젝트 생성</li>
                          <li>API 키를 복사해서 위에 입력</li>
                          <li>"테스트 및 적용" 버튼 클릭</li>
                        </>
                      )}
                    </ol>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-gray-500/25"
          >
            취소
          </button>
          <button
            onClick={saveSettings}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-emerald-500/25"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default LLMSettings;
