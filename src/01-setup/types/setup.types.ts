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
  contents: any[];
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

export interface ImagePromptGenerationResult {
  imagePrompts: any[];  // ImagePrompt 객체 배열 (index, position, context, prompt)
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

export interface UseSetupReturn {
  // 문서 관련 상태
  savedWritingStyles: SavedDocument[];
  savedSeoGuides: SavedDocument[];
  selectedWritingStyles: SavedDocument[];
  selectedSeoGuide: SavedDocument | null;

  // 키워드 & 트렌드 상태
  mainKeyword: string;
  subKeywords: string;
  selectedCategory: string;
  trendKeywords: TrendKeyword[];
  isLoadingTrends: boolean;

  // 트렌드 분석 상태
  trendAnalysisResult: TrendAnalysisResult | null;
  isTrendModalOpen: boolean;
  isTrendContentModalOpen: boolean;
  isGenerating: boolean;
  generationProgress: string;

  // 제목 추천 상태
  recommendedTitles: string[];
  finalTitle: string;
  isCategoryModalOpen: boolean;
  isAnalyzing: boolean;
  analysisProgress: TrendAnalysisProgress | null;

  // 추가 상태 (SetupContainer에서 사용)
  blogContent: string;
  isGeneratingTitles: boolean;
  generatedTitles: string[];
  selectedTitle: string;
  generationStep: string;
  progressSectionRef: React.RefObject<HTMLDivElement>;
  deleteDialog: { isOpen: boolean; docId: string; docType: string };

  // 상태 업데이트 함수
  setMainKeyword: (keyword: string) => void;
  setSubKeywords: (keywords: string) => void;
  setSelectedCategory: (category: string) => void;
  setFinalTitle: (title: string) => void;
  setSelectedWritingStyles: (styles: SavedDocument[]) => void;
  setSelectedSeoGuide: (guide: SavedDocument | null) => void;
  setSavedWritingStyles: (styles: SavedDocument[]) => void;
  setSavedSeoGuides: (guides: SavedDocument[]) => void;

  // 추가 setter (SetupContainer에서 사용)
  setBlogContent: (content: string) => void;
  setSelectedTitle: (title: string) => void;
  setGeneratedTitles: (titles: string[]) => void;
  setTrendAnalysisCache: (cache: any) => void;

  // 비즈니스 로직 함수
  handleFileUpload: (type: 'writingStyle' | 'seoGuide') => Promise<void>;
  handleDeleteDocument: (id: string, type: 'writingStyle' | 'seoGuide') => Promise<void>;
  handleManualUpload: (type: 'writingStyle' | 'seoGuide', name: string, content: string) => Promise<void>;
  handleCategorySelect: (category: string) => void;
  openTrendModal: () => void;
  closeTrendModal: () => void;
  handleTrendKeywordClick: (keyword: string) => void;
  openTrendContentModal: () => void;
  closeTrendContentModal: () => void;
  handleTrendContentAnalysis: (selectedContents: TrendContent[]) => Promise<void>;
  handleTitleRegenerate: () => Promise<void>;
  handleGenerateContent: () => Promise<void>;
  openCategoryModal: () => void;
  closeCategoryModal: () => void;

  // 추가 비즈니스 로직 (SetupContainer에서 사용)
  handleUrlCrawl: (url: string) => Promise<void>;
  toggleWritingStyle: (id: string) => void;
  toggleSeoGuide: (id: string) => void;
  openDeleteDialog: (id: string, type: string) => void;
  handleDeleteConfirm: () => Promise<void>;
  closeDeleteDialog: () => void;
  generateTitleRecommendations: () => Promise<void>;
  handleStartGeneration: () => Promise<void>;
  handleFileUploaded: (type: 'writingStyle' | 'seoGuide', file: File) => Promise<void>;
}

// ============================================
// Re-export SavedDocument from shared
// ============================================

export type { SavedDocument };
