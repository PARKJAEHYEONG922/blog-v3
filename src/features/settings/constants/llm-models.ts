/**
 * LLM Model 정보
 */

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  tier: string;
}

export const MODELS_BY_PROVIDER: Record<string, { text?: ModelInfo[]; image?: ModelInfo[] }> = {
  claude: {
    text: [
      { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', description: '최신 최고 성능 모델', tier: 'premium' },
      { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1', description: '최고품질 모델', tier: 'premium' }
    ]
  },
  openai: {
    text: [
      { id: 'gpt-5-2025-08-07', name: 'GPT-5', description: '최고 성능 모델 ($1.25/$10)', tier: 'premium' },
      { id: 'gpt-5-mini-2025-08-07', name: 'GPT-5 Mini', description: '균형잡힌 성능 ($0.25/$2)', tier: 'premium' },
      { id: 'gpt-5-nano-2025-08-07', name: 'GPT-5 Nano', description: '빠르고 경제적 ($0.05/$0.40)', tier: 'basic' }
    ],
    image: [
      { id: 'dall-e-3', name: 'DALL-E 3', description: '고품질 이미지 생성', tier: 'basic' },
      { id: 'gpt-image-1', name: 'GPT Image 1', description: '최신 이미지 생성 모델', tier: 'premium' }
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

/**
 * Provider와 Category에 맞는 모델 목록 가져오기
 */
export const getModels = (provider: string, category: 'text' | 'image'): ModelInfo[] => {
  return MODELS_BY_PROVIDER[provider]?.[category] || [];
};
