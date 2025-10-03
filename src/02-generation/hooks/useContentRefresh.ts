/**
 * AI 콘텐츠 새로고침 훅
 * - Claude Web에서 수정된 글 가져오기
 * - 콘텐츠 재처리 및 상태 업데이트
 */

import { handleError } from '@/shared/utils/error-handler';
import { useState, useCallback } from 'react';
import { useDialog } from '@/app/DialogContext';
import { GenerationAutomationService } from '@/02-generation/services/generation-automation-service';
import { ContentProcessor } from '@/02-generation/services/content-processor';

export interface UseContentRefreshParams {
  editorRef: React.RefObject<HTMLDivElement>;
  onContentUpdate: (originalContent: string, editedContent: string) => void;
  onImageUpdate: (imagePositions: string[], shouldRegenerate: boolean, expectedCount: number) => void;
  updateCharCount: () => void;
}

export interface UseContentRefreshReturn {
  isRefreshingContent: boolean;
  handleRefreshContent: () => Promise<void>;
}

export const useContentRefresh = ({
  editorRef,
  onContentUpdate,
  onImageUpdate,
  updateCharCount
}: UseContentRefreshParams): UseContentRefreshReturn => {
  const { showAlert } = useDialog();
  const [isRefreshingContent, setIsRefreshingContent] = useState(false);

  // 수정된 글 가져오기 (Claude Web에서)
  const handleRefreshContent = useCallback(async () => {
    if (isRefreshingContent) return;

    setIsRefreshingContent(true);

    try {
      console.log('🔄 Claude Web에서 수정된 글 가져오기 시작');

      // Claude Web에서 다시 다운로드
      const newContent = await GenerationAutomationService.downloadFromClaude();

      if (newContent && newContent.trim()) {
        console.log('✅ 수정된 글 가져오기 성공');

        // ⚠️ HTML 변환 전에 이미지 태그 감지 (마크다운 상태)
        const hasImageTags = newContent.match(/\(이미지\)|\[이미지\]/g);
        const expectedImageCount = hasImageTags ? hasImageTags.length : 0;

        // 이미지 위치 재감지 (마크다운 상태에서)
        const imageInfo = ContentProcessor.processImages(newContent);

        console.log(`📊 새 글 통계: ${newContent.length}자, 예상 이미지: ${expectedImageCount}개`);

        // 마크다운 → HTML 변환
        const processedContent = ContentProcessor.convertToNaverBlogHTML(newContent);

        // 콘텐츠 업데이트 콜백 호출
        onContentUpdate(newContent, processedContent);

        // 에디터에도 반영
        if (editorRef.current) {
          editorRef.current.innerHTML = processedContent;
          updateCharCount();
        }

        // 이미지 업데이트 콜백 호출
        onImageUpdate(imageInfo.imagePositions, expectedImageCount > 0, expectedImageCount);

      } else {
        throw new Error('Claude Web에서 빈 콘텐츠가 반환되었습니다.');
      }

    } catch (error) {
      handleError(error, '❌ 수정된 글 가져오기 실패:');
      showAlert({
        type: 'error',
        message: `수정된 글 가져오기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\nClaude Web에서 마크다운을 다시 복사해보세요.`
      });
    } finally {
      setIsRefreshingContent(false);
    }
  }, [isRefreshingContent, showAlert, editorRef, onContentUpdate, onImageUpdate, updateCharCount]);

  return {
    isRefreshingContent,
    handleRefreshContent,
  };
};
