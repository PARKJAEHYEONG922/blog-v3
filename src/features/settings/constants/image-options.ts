/**
 * 이미지 생성 옵션 상수
 */

export interface OptionItem {
  value: string;
  label: string;
}

/**
 * Provider별 이미지 생성 옵션
 */
export const IMAGE_GENERATION_OPTIONS = {
  openai: {
    styles: [], // OpenAI는 스타일 옵션 없음
    qualities: [
      { value: 'low', label: '저품질 - $0.01/이미지' },
      { value: 'medium', label: '중품질 - $0.04/이미지' },
      { value: 'high', label: '고품질 - $0.17/이미지' }
    ],
    sizes: [
      { value: '1024x1024', label: '1024x1024 (정사각형)' },
      { value: '1024x1536', label: '1024x1536 (세로형)' },
      { value: '1536x1024', label: '1536x1024 (가로형)' }
    ]
  },
  runware: {
    styles: [
      { value: 'realistic', label: '사실적' },
      { value: 'photographic', label: '사진적' },
      { value: 'illustration', label: '일러스트' },
      { value: 'anime', label: '애니메이션' },
      { value: 'dreamy', label: '몽환적' }
    ],
    qualities: [
      { value: 'low', label: '저품질 - 10 steps' },
      { value: 'medium', label: '중품질 - 15 steps' },
      { value: 'high', label: '고품질 - 25 steps' }
    ],
    sizes: [
      { value: '512x768', label: '512x768 (초저가 세로)' },
      { value: '768x512', label: '768x512 (초저가 가로)' },
      { value: '1024x1024', label: '1024x1024 (정사각형)' },
      { value: '1024x1536', label: '1024x1536 (세로형)' },
      { value: '1536x1024', label: '1536x1024 (가로형)' }
    ]
  },
  gemini: {
    styles: [
      { value: 'photographic', label: '실사/사진' },
      { value: 'illustration', label: '일러스트' },
      { value: 'minimalist', label: '미니멀' },
      { value: 'natural', label: '자연스러운' }
    ],
    qualities: [
      { value: 'high', label: '고품질 (고정)' }
    ],
    sizes: [
      { value: '1024x1024', label: '1024x1024 (정사각형만)' }
    ]
  }
} as const;

/**
 * Provider와 옵션 타입에 맞는 선택지 가져오기
 */
export const getImageOptions = (
  provider: string,
  optionType: 'styles' | 'qualities' | 'sizes'
): OptionItem[] => {
  const providerOptions = IMAGE_GENERATION_OPTIONS[provider as keyof typeof IMAGE_GENERATION_OPTIONS];
  return providerOptions?.[optionType] || [];
};
