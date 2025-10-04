/**
 * Step1 Setup 단계 타입 정의
 * 모든 setup 관련 타입을 중앙화
 */

import { SavedDocument } from '@/shared/services/storage/storage-service';

// ============================================
// 네이버 트렌드 관련 타입
// ============================================

export interface TrendKeyword {
  keyword: string;
  rank: number;
  rankChange: number | null;
}

export interface TrendCategory {
  name: string;
  value: string;
}

export interface TrendContent {
  metaUrl: string;
  title: string;
  myContent: boolean;
}

// ============================================
// 블로그 크롤링 관련 타입
// ============================================

export interface SelectedBlogTitle {
  title: string;
  url: string;
  relevanceReason: string;
}

export interface BlogContent {
  url: string;
  title: string;
  textContent: string;
  contentLength: number;
  success: boolean;
  error?: string;
}

export interface CrawlingProgress {
  current: number;
  total: number;
  url: string;
  status: 'crawling' | 'success' | 'failed';
}

// ============================================
// 트렌드 분석 관련 타입
// ============================================

export interface TrendAnalysisResult {
  mainKeyword: string;
  recommendedTitles: string[];
  subKeywords: string[];
  contentDirection: string;
  analyzedBlogs: {
    title: string;
    url: string;
    contentLength: number;
  }[];
  // 제목 재생성용 데이터
  crawledContents?: BlogContent[];
  allTitles?: string[];
}

export interface TrendAnalysisProgress {
  stage: 'crawling' | 'analyzing' | 'complete';
  current: number;
  total: number;
  message: string;
}

export interface TrendAnalysisCache {
  contents: BlogContent[];
  mainKeyword: string;
  allTitles: string[];
  subKeywords: string[];
  direction: string;
}

// ============================================
// 제목/콘텐츠 생성 관련 타입
// ============================================

export interface TitleGenerationParams {
  mainKeyword: string;
  subKeywords: string;
  blogContent: string;
}

export interface ContentGenerationParams {
  finalTitle: string;
  mainKeyword: string;
  subKeywords: string;
  blogContent: string;
  selectedWritingStyles: SavedDocument[];
  selectedSeoGuide: SavedDocument;
}

export interface ImagePrompt {
  index: number;
  position: string;
  context: string;
  prompt: string;
}

export interface ImagePromptGenerationResult {
  imagePrompts: ImagePrompt[];
  expectedImageCount: number;
  generatedImageCount: number;
  failed: boolean;
}

// ============================================
// Setup 서비스 관련 타입
// ============================================

export interface DocumentLoadResult {
  writingStyles: SavedDocument[];
  seoGuides: SavedDocument[];
  selectedWritingStyles: SavedDocument[];
  selectedSeoGuide: SavedDocument | null;
}

// ============================================
// Hook 반환 타입
// ============================================

/**
 * useSetup 훅 반환 타입
 * SetupContainer 컴포넌트에서 사용
 */
export interface UseSetupReturn {
  // 상태
  mainKeyword: string;
  subKeywords: string;
  blogContent: string;
  isGeneratingTitles: boolean;
  generatedTitles: string[];
  selectedTitle: string;
  isGenerating: boolean;
  generationStep: string;
  savedWritingStyles: SavedDocument[];
  savedSeoGuides: SavedDocument[];
  selectedWritingStyles: SavedDocument[];
  selectedSeoGuide: SavedDocument | null;
  progressSectionRef: React.RefObject<HTMLDivElement>;
  deleteDialog: { isOpen: boolean; docId: string; docName: string; type: 'writingStyle' | 'seoGuide' };

  // 상태 업데이트 함수
  setMainKeyword: (keyword: string) => void;
  setSubKeywords: (keywords: string) => void;
  setBlogContent: (content: string) => void;
  setSelectedTitle: (title: string) => void;
  setGeneratedTitles: (titles: string[]) => void;
  setTrendAnalysisCache: (cache: TrendAnalysisCache | null) => void;

  // 비즈니스 로직 함수
  handleUrlCrawl: (url: string) => Promise<{ title: string; contentLength: number } | null>;
  handleFileUpload: (type: 'writingStyle' | 'seoGuide', file: File) => Promise<void>;
  toggleWritingStyle: (doc: SavedDocument) => void;
  toggleSeoGuide: (doc: SavedDocument) => void;
  openDeleteDialog: (type: 'writingStyle' | 'seoGuide', docId: string, docName: string) => void;
  handleDeleteConfirm: () => Promise<void>;
  closeDeleteDialog: () => void;
  generateTitleRecommendations: () => Promise<void>;
  handleStartGeneration: () => Promise<void>;
  handleFileUploaded: (content: string) => Promise<void>;
  scrollToProgress: () => void;
}

// ============================================
// Re-export SavedDocument from shared
// ============================================

export type { SavedDocument };
