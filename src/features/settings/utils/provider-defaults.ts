/**
 * Provider별 기본값 유틸리티
 */

import { LLMConfig } from '@/shared/services/llm/types/llm.types';

/**
 * Provider별 기본 이미지 생성 옵션
 */
export const PROVIDER_IMAGE_DEFAULTS = {
  gemini: {
    size: '1024x1024',
    style: 'photographic',
    quality: 'high'
  },
  openai: {
    size: '1024x1024',
    style: undefined, // OpenAI는 스타일 옵션 없음
    quality: 'high'
  },
  runware: {
    size: '1024x1024',
    style: 'realistic',
    quality: 'high'
  }
} as const;

/**
 * Provider가 이미지 생성을 지원하는지 확인
 */
export const isImageProvider = (provider: string): boolean => {
  return ['openai', 'gemini', 'runware'].includes(provider);
};

/**
 * Provider가 텍스트 생성을 지원하는지 확인
 */
export const isTextProvider = (provider: string): boolean => {
  return ['claude', 'openai', 'gemini'].includes(provider);
};

/**
 * Provider 변경 시 이미지 설정 초기화
 */
export const getDefaultImageOptions = (
  provider: string
): { size?: string; style?: string; quality?: string } => {
  if (provider === 'gemini') {
    return PROVIDER_IMAGE_DEFAULTS.gemini;
  } else if (provider === 'openai') {
    return PROVIDER_IMAGE_DEFAULTS.openai;
  } else if (provider === 'runware') {
    return PROVIDER_IMAGE_DEFAULTS.runware;
  }
  // 기본값
  return {
    size: '1024x1024',
    style: undefined,
    quality: 'high'
  };
};

/**
 * Provider별 첫 번째 기본 모델 ID 가져오기 (초기화용)
 */
export const getDefaultModelId = (provider: string, category: 'text' | 'image'): string => {
  // 이 함수는 나중에 llm-models.ts와 통합하여 실제 모델 목록에서 가져올 수 있음
  // 현재는 빈 문자열 반환 (모델 선택 필수)
  return '';
};
