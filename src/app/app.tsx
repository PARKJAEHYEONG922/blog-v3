import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { LogPanel } from '@/shared/components';
import ErrorBoundary from '@/shared/components/error/ErrorBoundary';
import LoadingFallback from '@/shared/components/ui/LoadingFallback';
import Header from '@/shared/components/layout/Header';
import Sidebar, { ModuleType } from '@/shared/components/layout/Sidebar';
import { DialogProvider } from './DialogContext';
import { WorkflowProvider } from '@/modules/blog-automation/contexts/WorkflowContext';
import { handleError } from '@/shared/utils/error-handler';
import type { UpdateInfo } from '@/shared/types/electron.types';

// Code Splitting: 필요한 시점에만 로드
const BlogAutomationPage = lazy(() => import('@/modules/blog-automation/BlogAutomationPage'));
const NeighborAddPage = lazy(() => import('@/modules/neighbor-add/NeighborAddPage'));
const LLMSettings = lazy(() => import('@/features/settings').then(module => ({ default: module.LLMSettings })));
const UpdateModal = lazy(() => import('@/features/settings').then(module => ({ default: module.UpdateModal })));

const AppContent: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<ModuleType>('blog');
  const [showLLMSettings, setShowLLMSettings] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  // AI 모델 상태
  const [aiModelStatus, setAiModelStatus] = useState({
    writing: '미설정',
    image: '미설정'
  });

  // 모델 상태 새로고침 함수
  const refreshModelStatus = useCallback(async () => {
    try {
      const llmSettings = await window.electronAPI?.getLLMSettings?.();
      if (llmSettings?.lastUsedSettings) {
        const { writing, image } = llmSettings.lastUsedSettings;

        setAiModelStatus({
          writing: writing?.provider && writing?.model ?
            `${writing.provider} ${writing.model}` : '미설정',
          image: image?.provider && image?.model ?
            `${image.provider} ${image.model}` : '미설정'
        });
      }
    } catch (error) {
      handleError(error, '모델 상태 확인 실패:');
    }
  }, []);

  // 초기화 시 모델 상태 로드
  useEffect(() => {
    refreshModelStatus();
  }, [refreshModelStatus]);

  // 업데이트 확인 결과 리스너
  useEffect(() => {
    const handleUpdateCheckResult = (data: UpdateInfo) => {
      setUpdateInfo(data);
      setShowUpdateModal(true);
    };

    const cleanup = window.electronAPI?.onUpdateCheckResult?.(handleUpdateCheckResult);
    return cleanup;
  }, []);

  const handleUpdateDownload = async (downloadUrl: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await window.electronAPI?.downloadUpdate?.(downloadUrl);
      if (result?.success) {
        console.log('업데이트 다운로드 시작됨');
        return { success: true };
      } else {
        handleError(new Error(result?.error || '다운로드 실패'), '업데이트 다운로드 실패:');
        return { success: false, error: result?.error || '다운로드 실패' };
      }
    } catch (error) {
      handleError(error, '업데이트 다운로드 오류:');
      return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
    }
  };

  const getModuleTitle = (): { title: string; subtitle: string } => {
    switch (currentModule) {
      case 'blog':
        return { title: 'AI 블로그 자동화', subtitle: '' };
      case 'neighbor':
        return { title: '서로이웃 추가', subtitle: '' };
      default:
        return { title: 'Blog Auto V3', subtitle: '' };
    }
  };

  const { title, subtitle } = getModuleTitle();

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar currentModule={currentModule} onModuleChange={setCurrentModule} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          title={title}
          subtitle={subtitle}
          aiModelStatus={aiModelStatus}
          onLLMSettings={() => setShowLLMSettings(true)}
          onShowLogs={() => setShowLogs(!showLogs)}
          showLogs={showLogs}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex">
          <div className={`${showLogs ? 'mr-64' : ''} w-full overflow-y-auto`}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback message="모듈 로딩 중..." fullScreen />}>
                {currentModule === 'blog' && <BlogAutomationPage />}
                {currentModule === 'neighbor' && <NeighborAddPage />}
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>

        {/* Fixed Log Panel */}
        <LogPanel isVisible={showLogs} />
      </div>

      {/* LLM Settings Modal */}
      {showLLMSettings && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback message="설정 로딩 중..." />}>
            <LLMSettings
              onClose={() => setShowLLMSettings(false)}
              onSettingsChange={() => {
                refreshModelStatus();
                // Step2에서도 감지할 수 있도록 전역 이벤트 발생
                window.dispatchEvent(new CustomEvent('app-llm-settings-changed'));
              }}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Update Modal */}
      <Suspense fallback={null}>
        <UpdateModal
          isVisible={showUpdateModal}
          updateInfo={updateInfo}
          onClose={() => setShowUpdateModal(false)}
          onDownload={handleUpdateDownload}
        />
      </Suspense>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DialogProvider>
      <WorkflowProvider>
        <AppContent />
      </WorkflowProvider>
    </DialogProvider>
  );
};

export default App;
