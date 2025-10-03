/**
 * 이미지 생성 관련 훅
 * - 이미지 프롬프트 관리
 * - AI 이미지 생성
 * - 이미지 상태 관리
 */

import { useState, useCallback, useEffect } from 'react';
import { useDialog } from '@/app/DialogContext';
import { GenerationAutomationService } from '@/02-generation/services/generation-automation-service';
import { BlogWritingService } from '@/shared/services/content/blog-writing-service';

export interface UseImageGenerationParams {
  initialImagePrompts?: any[];
}

export interface UseImageGenerationReturn {
  // 이미지 상태
  imagePositions: string[];
  images: { [key: string]: string };
  imagePrompts: any[];
  isRegeneratingPrompts: boolean;
  imagePromptError: string | null;

  // 상태 업데이트
  setImages: (images: { [key: string]: string }) => void;
  setImagePositions: (positions: string[]) => void;
  setImagePrompts: (prompts: any[]) => void;
  setImagePromptError: (error: string | null) => void;

  // 비즈니스 로직
  handleImagesChange: (newImages: { [key: string]: string }) => void;
  generateImagePrompts: () => Promise<void>;
  regenerateImagePrompts: (currentContent: string) => Promise<void>;
}

export const useImageGeneration = ({
  initialImagePrompts = []
}: UseImageGenerationParams): UseImageGenerationReturn => {
  const { showAlert } = useDialog();

  const [imagePositions, setImagePositions] = useState<string[]>([]);
  const [images, setImages] = useState<{[key: string]: string}>({});
  const [imagePrompts, setImagePrompts] = useState<any[]>([]);
  const [isRegeneratingPrompts, setIsRegeneratingPrompts] = useState(false);
  const [imagePromptError, setImagePromptError] = useState<string | null>(null);

  // 이미지 변경 콜백
  const handleImagesChange = useCallback((newImages: { [key: string]: string }) => {
    setImages(newImages);
  }, []);

  // 이미지 생성 (프롬프트를 이용해 실제 이미지 생성)
  const generateImagePrompts = useCallback(async () => {
    if (imagePrompts.length === 0) {
      showAlert({ type: 'error', message: '이미지 프롬프트가 없습니다. 1단계에서 이미지 프롬프트 생성이 실패했을 수 있습니다.' });
      return;
    }

    try {
      console.log(`🎨 이미지 생성 시작: ${imagePrompts.length}개 프롬프트 사용`);

      const generatedImages = await GenerationAutomationService.generateImages(imagePrompts);

      setImages(generatedImages);
      console.log(`🎉 모든 이미지 생성 완료: ${Object.keys(generatedImages).length}개`);

    } catch (error) {
      console.error('❌ 이미지 생성 실패:', error);
      showAlert({ type: 'error', message: `이미지 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}` });
    }
  }, [imagePrompts, showAlert]);

  // 이미지 프롬프트 재생성
  const regenerateImagePrompts = useCallback(async (currentContent: string) => {
    if (!currentContent || isRegeneratingPrompts) return;

    setIsRegeneratingPrompts(true);
    setImagePromptError(null);

    // 이미지 프롬프트 재생성 시 기존 생성된 이미지도 초기화
    setImages({});

    try {
      console.log('🔄 이미지 프롬프트 재생성 시작');
      const result = await BlogWritingService.generateImagePrompts(currentContent);

      if (result.success && result.imagePrompts && result.imagePrompts.length > 0) {
        console.log(`✅ 이미지 프롬프트 재생성 성공: ${result.imagePrompts.length}개`);
        setImagePrompts(result.imagePrompts);
        setImagePromptError(null);
      } else {
        console.warn('⚠️ 이미지 프롬프트 재생성 실패:', result.error);
        setImagePromptError(result.error || '이미지 프롬프트 재생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 이미지 프롬프트 재생성 중 오류:', error);
      setImagePromptError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsRegeneratingPrompts(false);
    }
  }, [isRegeneratingPrompts]);

  // 초기 이미지 프롬프트 설정
  useEffect(() => {
    if (initialImagePrompts && Array.isArray(initialImagePrompts)) {
      setImagePrompts(initialImagePrompts);
    }
  }, [initialImagePrompts]);

  return {
    imagePositions,
    images,
    imagePrompts,
    isRegeneratingPrompts,
    imagePromptError,

    setImages,
    setImagePositions,
    setImagePrompts,
    setImagePromptError,

    handleImagesChange,
    generateImagePrompts,
    regenerateImagePrompts,
  };
};
