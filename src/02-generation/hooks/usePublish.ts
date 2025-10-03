/**
 * 발행 관련 훅
 * - 플랫폼 선택 관리
 * - 콘텐츠 발행 로직
 */

import { useState, useCallback } from 'react';
import { useDialog } from '@/app/DialogContext';
import { GenerationAutomationService } from '@/02-generation/services/generation-automation-service';

export interface UsePublishParams {
  editedContent: string;
  imagePositions: string[];
  images: { [key: string]: string };
}

export interface UsePublishReturn {
  selectedPlatform: string;
  setSelectedPlatform: (platform: string) => void;
  handlePublish: () => void;
  getPlatformName: (platform: string) => string;
  replaceImagesInContent: () => string;
}

export const usePublish = ({
  editedContent,
  imagePositions,
  images
}: UsePublishParams): UsePublishReturn => {
  const { showAlert } = useDialog();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');

  // 콘텐츠에 이미지 삽입 (발행 시 사용)
  const replaceImagesInContent = useCallback((): string => {
    let finalContent = editedContent;

    imagePositions.forEach((imageKey) => {
      const imageUrl = images[imageKey];
      if (imageUrl) {
        // 첫 번째 (이미지)를 실제 이미지로 교체
        finalContent = finalContent.replace('(이미지)', `![${imageKey}](${imageUrl})`);
      }
    });

    return finalContent;
  }, [editedContent, imagePositions, images]);

  // 플랫폼 이름 가져오기
  const getPlatformName = useCallback((platform: string): string => {
    const platformNames: { [key: string]: string } = {
      naver: '네이버 블로그',
      tistory: '티스토리'
    };
    return platformNames[platform] || platform;
  }, []);

  // 발행 시작
  const handlePublish = useCallback(() => {
    if (!selectedPlatform) {
      showAlert({ type: 'warning', message: '발행할 플랫폼을 선택해주세요.' });
      return;
    }

    const finalContent = replaceImagesInContent();

    if (selectedPlatform === 'naver') {
      // 네이버 블로그 발행
      GenerationAutomationService.publishToNaverBlog(finalContent);
    } else {
      showAlert({ type: 'info', message: `${getPlatformName(selectedPlatform)} 발행 기능은 곧 구현될 예정입니다.` });
    }
  }, [selectedPlatform, replaceImagesInContent, showAlert, getPlatformName]);

  return {
    selectedPlatform,
    setSelectedPlatform,
    handlePublish,
    getPlatformName,
    replaceImagesInContent,
  };
};
