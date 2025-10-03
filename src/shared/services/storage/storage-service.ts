/**
 * LocalStorage 관리 서비스
 * 모든 localStorage 작업을 중앙화하여 관리
 */

import { handleError } from '../../utils/error-handler';

export interface SavedDocument {
  id: string;
  name: string;
  content: string;
  filePath: string;
  createdAt: string;
}

export interface TrendAnalysisCache {
  contents: any[];
  mainKeyword: string;
  allTitles: string[];
  subKeywords: string[];
  direction: string;
}

export interface NaverAccount {
  id: string;
  username: string;
  blogUrl?: string;
  createdAt: string;
  lastUsed?: number;  // SavedAccount와 호환성을 위해 추가
}

class StorageServiceClass {
  // Storage Keys
  private readonly KEYS = {
    WRITING_STYLES: 'savedWritingStyles',
    SEO_GUIDES: 'savedSeoGuides',
    SELECTED_WRITING_STYLES: 'selectedWritingStyles',
    SELECTED_SEO_GUIDE: 'selectedSeoGuideId',
    TREND_CACHE: 'trendAnalysisCache',
    NAVER_ACCOUNTS: 'naverAccounts',
    NAVER_PASSWORD_PREFIX: 'naverPassword_',
    ACCOUNT_BOARDS: 'accountBoards',
    NAVER_BOARDS_PREFIX: 'naverBoards_',
    SELECTED_TREND_CATEGORIES: 'naver-trend-selected-categories',
  } as const;

  // ========== Writing Styles ==========

  /**
   * 말투 문서 목록 가져오기
   */
  getWritingStyles(): SavedDocument[] {
    try {
      const data = localStorage.getItem(this.KEYS.WRITING_STYLES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      handleError(error, '말투 문서 로드 실패');
      return [];
    }
  }

  /**
   * 말투 문서 목록 저장
   */
  saveWritingStyles(documents: SavedDocument[]): void {
    try {
      localStorage.setItem(this.KEYS.WRITING_STYLES, JSON.stringify(documents));
    } catch (error) {
      handleError(error, '말투 문서 저장 실패');
    }
  }

  /**
   * 말투 문서 추가
   */
  addWritingStyle(document: SavedDocument): SavedDocument[] {
    const documents = this.getWritingStyles();
    const existingIndex = documents.findIndex(doc => doc.name === document.name);

    let updated: SavedDocument[];
    if (existingIndex !== -1) {
      // 기존 문서 업데이트
      updated = documents.map((doc, idx) => idx === existingIndex ? document : doc);
    } else {
      // 새 문서 추가
      updated = [...documents, document];
    }

    this.saveWritingStyles(updated);
    return updated;
  }

  /**
   * 말투 문서 삭제
   */
  deleteWritingStyle(docId: string): SavedDocument[] {
    const documents = this.getWritingStyles();
    const updated = documents.filter(doc => doc.id !== docId);
    this.saveWritingStyles(updated);
    return updated;
  }

  // ========== SEO Guides ==========

  /**
   * SEO 가이드 목록 가져오기
   */
  getSeoGuides(): SavedDocument[] {
    try {
      const data = localStorage.getItem(this.KEYS.SEO_GUIDES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      handleError(error, 'SEO 가이드 로드 실패');
      return [];
    }
  }

  /**
   * SEO 가이드 목록 저장
   */
  saveSeoGuides(documents: SavedDocument[]): void {
    try {
      localStorage.setItem(this.KEYS.SEO_GUIDES, JSON.stringify(documents));
    } catch (error) {
      handleError(error, 'SEO 가이드 저장 실패');
    }
  }

  /**
   * SEO 가이드 추가
   */
  addSeoGuide(document: SavedDocument): SavedDocument[] {
    const documents = this.getSeoGuides();
    const existingIndex = documents.findIndex(doc => doc.name === document.name);

    let updated: SavedDocument[];
    if (existingIndex !== -1) {
      // 기존 문서 업데이트
      updated = documents.map((doc, idx) => idx === existingIndex ? document : doc);
    } else {
      // 새 문서 추가
      updated = [...documents, document];
    }

    this.saveSeoGuides(updated);
    return updated;
  }

  /**
   * SEO 가이드 삭제
   */
  deleteSeoGuide(docId: string): SavedDocument[] {
    const documents = this.getSeoGuides();
    const updated = documents.filter(doc => doc.id !== docId);
    this.saveSeoGuides(updated);
    return updated;
  }

  /**
   * 선택된 SEO 가이드 ID 가져오기
   */
  getSelectedSeoGuideId(): string | null {
    try {
      return localStorage.getItem(this.KEYS.SELECTED_SEO_GUIDE);
    } catch (error) {
      handleError(error, '선택된 SEO 가이드 ID 로드 실패');
      return null;
    }
  }

  /**
   * 선택된 SEO 가이드 ID 저장
   */
  saveSelectedSeoGuideId(id: string | null): void {
    try {
      if (id === null) {
        localStorage.removeItem(this.KEYS.SELECTED_SEO_GUIDE);
      } else {
        localStorage.setItem(this.KEYS.SELECTED_SEO_GUIDE, id);
      }
    } catch (error) {
      handleError(error, '선택된 SEO 가이드 ID 저장 실패');
    }
  }

  // ========== Selected Writing Styles ==========

  /**
   * 선택된 말투 ID 목록 가져오기
   */
  getSelectedWritingStyleIds(): string[] {
    try {
      const data = localStorage.getItem(this.KEYS.SELECTED_WRITING_STYLES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      handleError(error, '선택된 말투 로드 실패');
      return [];
    }
  }

  /**
   * 선택된 말투 ID 목록 저장
   */
  saveSelectedWritingStyleIds(ids: string[]): void {
    try {
      localStorage.setItem(this.KEYS.SELECTED_WRITING_STYLES, JSON.stringify(ids));
    } catch (error) {
      handleError(error, '선택된 말투 저장 실패');
    }
  }

  // ========== Trend Analysis Cache ==========

  /**
   * 트렌드 분석 캐시 가져오기
   */
  getTrendCache(): TrendAnalysisCache | null {
    try {
      const data = localStorage.getItem(this.KEYS.TREND_CACHE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      handleError(error, '트렌드 캐시 로드 실패');
      return null;
    }
  }

  /**
   * 트렌드 분석 캐시 저장
   */
  saveTrendCache(cache: TrendAnalysisCache): void {
    try {
      localStorage.setItem(this.KEYS.TREND_CACHE, JSON.stringify(cache));
    } catch (error) {
      handleError(error, '트렌드 캐시 저장 실패');
    }
  }

  /**
   * 트렌드 분석 캐시 삭제
   */
  clearTrendCache(): void {
    try {
      localStorage.removeItem(this.KEYS.TREND_CACHE);
    } catch (error) {
      handleError(error, '트렌드 캐시 삭제 실패');
    }
  }

  // ========== Naver Accounts ==========

  /**
   * 네이버 계정 목록 가져오기
   */
  getNaverAccounts(): NaverAccount[] {
    try {
      const data = localStorage.getItem(this.KEYS.NAVER_ACCOUNTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      handleError(error, '네이버 계정 로드 실패');
      return [];
    }
  }

  /**
   * 네이버 계정 목록 저장
   */
  saveNaverAccounts(accounts: NaverAccount[]): void {
    try {
      localStorage.setItem(this.KEYS.NAVER_ACCOUNTS, JSON.stringify(accounts));
    } catch (error) {
      handleError(error, '네이버 계정 저장 실패');
    }
  }

  /**
   * 네이버 계정 추가
   */
  addNaverAccount(account: NaverAccount): NaverAccount[] {
    const accounts = this.getNaverAccounts();
    const existingIndex = accounts.findIndex(acc => acc.id === account.id);

    let updated: NaverAccount[];
    if (existingIndex !== -1) {
      // 기존 계정 업데이트
      updated = accounts.map((acc, idx) => idx === existingIndex ? account : acc);
    } else {
      // 새 계정 추가
      updated = [...accounts, account];
    }

    this.saveNaverAccounts(updated);
    return updated;
  }

  /**
   * 네이버 계정 삭제
   */
  deleteNaverAccount(accountId: string): NaverAccount[] {
    const accounts = this.getNaverAccounts();
    const updated = accounts.filter(acc => acc.id !== accountId);
    this.saveNaverAccounts(updated);

    // 관련 비밀번호도 삭제
    this.deleteNaverPassword(accountId);

    // 관련 보드 정보도 삭제
    this.deleteAccountBoards(accountId);

    return updated;
  }

  /**
   * 네이버 비밀번호 가져오기
   */
  getNaverPassword(accountId: string): string | null {
    try {
      return localStorage.getItem(`${this.KEYS.NAVER_PASSWORD_PREFIX}${accountId}`);
    } catch (error) {
      handleError(error, '비밀번호 로드 실패');
      return null;
    }
  }

  /**
   * 네이버 비밀번호 저장
   */
  saveNaverPassword(accountId: string, password: string): void {
    try {
      localStorage.setItem(`${this.KEYS.NAVER_PASSWORD_PREFIX}${accountId}`, password);
    } catch (error) {
      handleError(error, '비밀번호 저장 실패');
    }
  }

  /**
   * 네이버 비밀번호 삭제
   */
  deleteNaverPassword(accountId: string): void {
    try {
      localStorage.removeItem(`${this.KEYS.NAVER_PASSWORD_PREFIX}${accountId}`);
    } catch (error) {
      handleError(error, '비밀번호 삭제 실패');
    }
  }

  // ========== Account Boards ==========

  /**
   * 전체 계정 보드 정보 가져오기
   */
  getAllAccountBoards(): {[accountId: string]: string[]} {
    try {
      const data = localStorage.getItem(this.KEYS.ACCOUNT_BOARDS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      handleError(error, '계정 보드 정보 로드 실패');
      return {};
    }
  }

  /**
   * 전체 계정 보드 정보 저장
   */
  saveAllAccountBoards(boards: {[accountId: string]: string[]}): void {
    try {
      localStorage.setItem(this.KEYS.ACCOUNT_BOARDS, JSON.stringify(boards));
    } catch (error) {
      handleError(error, '계정 보드 정보 저장 실패');
    }
  }

  /**
   * 특정 계정의 보드 목록 가져오기
   */
  getAccountBoards(accountId: string): string[] {
    try {
      const data = localStorage.getItem(`${this.KEYS.NAVER_BOARDS_PREFIX}${accountId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      handleError(error, '보드 목록 로드 실패');
      return [];
    }
  }

  /**
   * 특정 계정의 보드 목록 저장
   */
  saveAccountBoards(accountId: string, boards: string[]): void {
    try {
      localStorage.setItem(`${this.KEYS.NAVER_BOARDS_PREFIX}${accountId}`, JSON.stringify(boards));

      // accountBoards에도 업데이트
      const allBoards = this.getAllAccountBoards();
      allBoards[accountId] = boards;
      this.saveAllAccountBoards(allBoards);
    } catch (error) {
      handleError(error, '보드 목록 저장 실패');
    }
  }

  /**
   * 특정 계정의 보드 정보 삭제
   */
  deleteAccountBoards(accountId: string): void {
    try {
      localStorage.removeItem(`${this.KEYS.NAVER_BOARDS_PREFIX}${accountId}`);

      // accountBoards에서도 삭제
      const allBoards = this.getAllAccountBoards();
      delete allBoards[accountId];
      this.saveAllAccountBoards(allBoards);
    } catch (error) {
      handleError(error, '보드 정보 삭제 실패');
    }
  }

  // ========== Trend Categories ==========

  /**
   * 선택된 트렌드 카테고리 가져오기
   */
  getSelectedTrendCategories(): string[] {
    try {
      const data = localStorage.getItem(this.KEYS.SELECTED_TREND_CATEGORIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      handleError(error, '선택된 카테고리 로드 실패');
      return [];
    }
  }

  /**
   * 선택된 트렌드 카테고리 저장
   */
  saveSelectedTrendCategories(categories: string[]): void {
    try {
      localStorage.setItem(this.KEYS.SELECTED_TREND_CATEGORIES, JSON.stringify(categories));
    } catch (error) {
      handleError(error, '선택된 카테고리 저장 실패');
    }
  }

  // ========== Utility ==========

  /**
   * 모든 데이터 초기화 (개발용)
   */
  clearAll(): void {
    try {
      Object.values(this.KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('✅ 모든 localStorage 데이터 삭제 완료');
    } catch (error) {
      handleError(error, '데이터 초기화 실패');
    }
  }
}

// 싱글톤 인스턴스 export
export const StorageService = new StorageServiceClass();
