// Generation 기능 관련 타입 정의

// LLM 타입에서 ImageGenerationOptions 재사용
export type { ImageGenerationOptions } from '@/shared/services/llm/types/llm.types';

export interface GenerationProps {
  content: string;
  setupData: any; // SetupData 타입 참조
  onReset: () => void;
  onGoBack: () => void;
  aiModelStatus: {
    writing: string;
    image: string;
  };
}

export interface ImagePrompt {
  id: string;
  prompt: string;
  imageUrl?: string;
  isGenerating?: boolean;
  error?: string;
}

export interface ContentState {
  originalContent: string;
  editedContent: string;
  isEdited: boolean;
}

export interface WorkSummaryData {
  totalWords: number;
  mainKeywordCount: number;
  subKeywordCount: number;
  imageCount: number;
  estimatedReadTime: number;
}