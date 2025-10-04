/**
 * Step2 Generation 메인 훅
 * - 전문 훅들을 조합하여 전체 기능 제공
 */

import { useState, useEffect, useCallback } from 'react';
import { handleError } from '@/shared/utils/error-handler';
import { useWorkflow } from '@/app/WorkflowContext';
import { ContentProcessor } from '@/02-generation/services/content-processor';
import type { WorkflowData } from '@/shared/types/common.types';
import type { ImagePrompt } from '@/shared/services/content/blog-writing-service';

// 전문 훅들 임포트
import { useContentEditor } from './useContentEditor';
import { useImageGeneration } from './useImageGeneration';
import { useContentRefresh } from './useContentRefresh';
import { usePublish } from './usePublish';

export interface UseGenerationReturn {
  // WorkflowContext
  workflowData: WorkflowData;
  prevStep: () => void;
  reset: () => void;

  // AI 모델 상태
  aiModelStatus: {
    writing: string;
    image: string;
  };

  // 콘텐츠 상태 (from useContentEditor)
  originalContent: string;
  editedContent: string;
  charCount: number;
  charCountWithSpaces: number;
  currentFontSize: string;
  fontSizes: Array<{ name: string; size: string; weight: string }>;
  activeTab: 'original' | 'edited';

  // 이미지 관련 상태 (from useImageGeneration)
  imagePositions: string[];
  images: { [key: string]: string };
  imagePrompts: ImagePrompt[];
  isRegeneratingPrompts: boolean;
  imagePromptError: string | null;

  // 발행 관련 상태 (from usePublish + useContentRefresh)
  selectedPlatform: string;
  isRefreshingContent: boolean;

  // Refs
  editorRef: React.RefObject<HTMLDivElement>;

  // 상태 업데이트 함수
  setOriginalContent: (content: string) => void;
  setEditedContent: (content: string) => void;
  setCurrentFontSize: (size: string) => void;
  setActiveTab: (tab: 'original' | 'edited') => void;
  setImages: (images: { [key: string]: string }) => void;
  setImagePositions: (positions: string[]) => void;
  setImagePrompts: (prompts: any[]) => void;
  setImagePromptError: (error: string | null) => void;
  setSelectedPlatform: (platform: string) => void;

  // 비즈니스 로직 함수
  handleImagesChange: (newImages: { [key: string]: string }) => void;
  generateImagePrompts: () => Promise<void>;
  regenerateImagePrompts: () => Promise<void>;
  handleRefreshContent: () => Promise<void>;
  replaceImagesInContent: () => string;
  handlePublish: () => void;
  updateCharCount: () => void;
  handleContentChange: () => void;
  restoreOriginal: () => void;
  copyToClipboard: () => Promise<boolean>;
  handleFontSizeChange: (newSize: string) => void;
  applyFontSizeToSelection: (fontSize: string) => void;
  insertLink: () => void;
  insertSeparator: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  handleClick: () => void;

  // 유틸리티 함수
  processMarkdown: (content: string) => string;
  getPlatformName: (platform: string) => string;
}

export const useGeneration = (): UseGenerationReturn => {
  const { workflowData, prevStep, reset } = useWorkflow();

  // AI 모델 상태
  const [aiModelStatus, setAiModelStatus] = useState({
    writing: '미설정',
    image: '미설정'
  });

  // 마크다운 처리 함수
  const processMarkdown = useCallback((content: string): string => {
    return ContentProcessor.convertToNaverBlogHTML(content);
  }, []);

  // 모델 상태 새로고침 함수
  const refreshModelStatus = useCallback(async () => {
    try {
      // IPC 직접 호출
      const llmSettings = await window.electronAPI.getLLMSettings();
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

  // AI 설정 변경 이벤트 리스너
  useEffect(() => {
    const handleSettingsChanged = () => {
      refreshModelStatus();
    };

    window.addEventListener('app-llm-settings-changed', handleSettingsChanged);
    return () => {
      window.removeEventListener('app-llm-settings-changed', handleSettingsChanged);
    };
  }, [refreshModelStatus]);

  // 1. 콘텐츠 에디터 훅
  const contentEditor = useContentEditor({
    initialContent: workflowData.generatedContent || '',
    processMarkdown
  });

  // 2. 이미지 생성 훅
  const imageGeneration = useImageGeneration({
    initialImagePrompts: workflowData.imagePrompts
  });

  // 3. 발행 훅
  const publish = usePublish({
    editedContent: contentEditor.editedContent,
    imagePositions: imageGeneration.imagePositions,
    images: imageGeneration.images
  });

  // 4. 콘텐츠 새로고침 훅
  const contentRefresh = useContentRefresh({
    editorRef: contentEditor.editorRef,
    onContentUpdate: (originalContent, editedContent) => {
      contentEditor.setOriginalContent(originalContent);
      contentEditor.setEditedContent(editedContent);
    },
    onImageUpdate: (imagePositions, shouldRegenerate, expectedCount) => {
      imageGeneration.setImagePositions(imagePositions);
      imageGeneration.setImages({});
      imageGeneration.setImagePrompts([]);
      if (shouldRegenerate) {
        imageGeneration.setImagePromptError('새로운 글로 업데이트되었습니다. 이미지 프롬프트를 재생성해주세요.');
      } else {
        imageGeneration.setImagePromptError(null);
      }
    },
    updateCharCount: contentEditor.updateCharCount
  });

  // 이미지 프롬프트 재생성 (현재 콘텐츠 전달)
  const regenerateImagePrompts = useCallback(async () => {
    const currentContent = contentEditor.originalContent || workflowData.generatedContent || '';
    await imageGeneration.regenerateImagePrompts(currentContent);
  }, [contentEditor.originalContent, workflowData.generatedContent, imageGeneration]);

  // 스크롤을 최상단으로 이동
  useEffect(() => {
    const scrollableContainer = document.querySelector('main > div');
    const mainElement = document.querySelector('main');

    if (scrollableContainer) {
      scrollableContainer.scrollTop = 0;
    } else if (mainElement) {
      mainElement.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  return {
    // WorkflowContext
    workflowData,
    prevStep,
    reset,

    // AI 모델 상태
    aiModelStatus,

    // 콘텐츠 상태 (from useContentEditor)
    originalContent: contentEditor.originalContent,
    editedContent: contentEditor.editedContent,
    charCount: contentEditor.charCount,
    charCountWithSpaces: contentEditor.charCountWithSpaces,
    currentFontSize: contentEditor.currentFontSize,
    fontSizes: contentEditor.fontSizes,
    activeTab: contentEditor.activeTab,

    // 이미지 관련 상태 (from useImageGeneration)
    imagePositions: imageGeneration.imagePositions,
    images: imageGeneration.images,
    imagePrompts: imageGeneration.imagePrompts,
    isRegeneratingPrompts: imageGeneration.isRegeneratingPrompts,
    imagePromptError: imageGeneration.imagePromptError,

    // 발행 관련 상태
    selectedPlatform: publish.selectedPlatform,
    isRefreshingContent: contentRefresh.isRefreshingContent,

    // Refs
    editorRef: contentEditor.editorRef,

    // 상태 업데이트 함수
    setOriginalContent: contentEditor.setOriginalContent,
    setEditedContent: contentEditor.setEditedContent,
    setCurrentFontSize: contentEditor.setCurrentFontSize,
    setActiveTab: contentEditor.setActiveTab,
    setImages: imageGeneration.setImages,
    setImagePositions: imageGeneration.setImagePositions,
    setImagePrompts: imageGeneration.setImagePrompts,
    setImagePromptError: imageGeneration.setImagePromptError,
    setSelectedPlatform: publish.setSelectedPlatform,

    // 비즈니스 로직 함수
    handleImagesChange: imageGeneration.handleImagesChange,
    generateImagePrompts: imageGeneration.generateImagePrompts,
    regenerateImagePrompts,
    handleRefreshContent: contentRefresh.handleRefreshContent,
    replaceImagesInContent: publish.replaceImagesInContent,
    handlePublish: publish.handlePublish,
    updateCharCount: contentEditor.updateCharCount,
    handleContentChange: contentEditor.handleContentChange,
    restoreOriginal: contentEditor.restoreOriginal,
    copyToClipboard: contentEditor.copyToClipboard,
    handleFontSizeChange: contentEditor.handleFontSizeChange,
    applyFontSizeToSelection: contentEditor.applyFontSizeToSelection,
    insertLink: contentEditor.insertLink,
    insertSeparator: contentEditor.insertSeparator,
    handleKeyDown: contentEditor.handleKeyDown,
    handleClick: contentEditor.handleClick,

    // 유틸리티 함수
    processMarkdown,
    getPlatformName: publish.getPlatformName,
  };
};
