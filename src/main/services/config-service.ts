import Store from 'electron-store';

/**
 * 네이버 계정 정보
 */
export interface NaverAccount {
  id: string;
  username: string;
  blogUrl?: string;
  createdAt: string;
  lastUsed?: number;
}

/**
 * 통합 설정 인터페이스
 */
export interface AppConfig {
  llm: {
    providerApiKeys: {
      openai: string;
      claude: string;
      gemini: string;
      runware: string;
    };
    lastUsedSettings: {
      writing: {
        provider: string;
        model: string;
      };
      image: {
        provider: string;
        model: string;
        style?: string;
        quality?: string;
        size?: string;
      };
    };
    testingStatus?: {
      [provider: string]: {
        success: boolean;
        message: string;
        timestamp: number;
      };
    };
  };
  naver: {
    cookies: string | null;
    accounts: NaverAccount[];
    passwords: { [accountId: string]: string };
    boards: { [accountId: string]: string[] };
  };
  app: {
    version: string;
  };
}

/**
 * 통합 설정 관리 서비스
 * electron-store를 사용하여 모든 설정을 하나의 파일에서 관리
 */
export class ConfigService {
  private store: any; // TODO: electron-store 타입 이슈

  constructor() {
    const { app } = require('electron');

    this.store = new Store<AppConfig>({
      name: 'config',
      cwd: app.getPath('userData'),  // 명시적으로 경로 지정
      defaults: {
        llm: {
          providerApiKeys: {
            openai: '',
            claude: '',
            gemini: '',
            runware: ''
          },
          lastUsedSettings: {
            writing: {
              provider: 'gemini',
              model: ''
            },
            image: {
              provider: 'gemini',
              model: '',
              style: 'photographic',
              quality: 'high',
              size: '1024x1024'
            }
          }
        },
        naver: {
          cookies: null,
          accounts: [],
          passwords: {},
          boards: {}
        },
        app: {
          version: '3.0.7'
        }
      }
    });

    console.log('📦 ConfigService 초기화 완료');
    console.log('📁 Config 파일 위치:', this.store.path);
  }

  // ==================== LLM 설정 ====================

  /**
   * 전체 LLM 설정 가져오기
   */
  getLLMSettings(): AppConfig['llm'] {
    return this.store.get('llm');
  }

  /**
   * 전체 LLM 설정 저장
   */
  saveLLMSettings(settings: AppConfig['llm']): void {
    this.store.set('llm', settings);
  }

  /**
   * Provider별 API 키 가져오기
   */
  getProviderApiKeys(): AppConfig['llm']['providerApiKeys'] {
    return this.store.get('llm.providerApiKeys');
  }

  /**
   * 특정 Provider의 API 키 가져오기
   */
  getProviderApiKey(provider: keyof AppConfig['llm']['providerApiKeys']): string {
    return this.store.get(`llm.providerApiKeys.${provider}`) || '';
  }

  /**
   * Provider별 API 키 저장
   */
  setProviderApiKeys(keys: Partial<AppConfig['llm']['providerApiKeys']>): void {
    const currentKeys = this.getProviderApiKeys();
    this.store.set('llm.providerApiKeys', { ...currentKeys, ...keys });
  }

  /**
   * 마지막 사용 설정 가져오기
   */
  getLastUsedSettings(): AppConfig['llm']['lastUsedSettings'] {
    return this.store.get('llm.lastUsedSettings');
  }

  /**
   * 마지막 사용 설정 저장
   */
  setLastUsedSettings(settings: Partial<AppConfig['llm']['lastUsedSettings']>): void {
    const current = this.getLastUsedSettings();
    this.store.set('llm.lastUsedSettings', { ...current, ...settings });
  }

  // ==================== 네이버 설정 ====================

  /**
   * 네이버 쿠키 가져오기
   */
  getNaverCookies(): string | null {
    return this.store.get('naver.cookies');
  }

  /**
   * 네이버 쿠키 저장
   */
  setNaverCookies(cookies: string): void {
    this.store.set('naver.cookies', cookies);
  }

  /**
   * 네이버 쿠키 삭제
   */
  deleteNaverCookies(): void {
    this.store.set('naver.cookies', null);
  }

  // ========== 네이버 계정 관리 ==========

  /**
   * 네이버 계정 목록 가져오기
   */
  getNaverAccounts(): NaverAccount[] {
    return this.store.get('naver.accounts') || [];
  }

  /**
   * 네이버 계정 목록 저장
   */
  setNaverAccounts(accounts: NaverAccount[]): void {
    this.store.set('naver.accounts', accounts);
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

    this.setNaverAccounts(updated);
    return updated;
  }

  /**
   * 네이버 계정 삭제
   */
  deleteNaverAccount(accountId: string): NaverAccount[] {
    const accounts = this.getNaverAccounts();
    const updated = accounts.filter(acc => acc.id !== accountId);
    this.setNaverAccounts(updated);

    // 관련 비밀번호도 삭제
    this.deleteNaverPassword(accountId);

    // 관련 보드 정보도 삭제
    this.deleteNaverBoards(accountId);

    return updated;
  }

  // ========== 네이버 비밀번호 관리 ==========

  /**
   * 네이버 비밀번호 가져오기
   */
  getNaverPassword(accountId: string): string | null {
    const passwords = this.store.get('naver.passwords') || {};
    return passwords[accountId] || null;
  }

  /**
   * 네이버 비밀번호 저장
   */
  setNaverPassword(accountId: string, password: string): void {
    const passwords = this.store.get('naver.passwords') || {};
    passwords[accountId] = password;
    this.store.set('naver.passwords', passwords);
  }

  /**
   * 네이버 비밀번호 삭제
   */
  deleteNaverPassword(accountId: string): void {
    const passwords = this.store.get('naver.passwords') || {};
    delete passwords[accountId];
    this.store.set('naver.passwords', passwords);
  }

  // ========== 네이버 게시판 관리 ==========

  /**
   * 특정 계정의 게시판 목록 가져오기
   */
  getNaverBoards(accountId: string): string[] {
    const boards = this.store.get('naver.boards') || {};
    return boards[accountId] || [];
  }

  /**
   * 특정 계정의 게시판 목록 저장
   */
  setNaverBoards(accountId: string, boardList: string[]): void {
    const boards = this.store.get('naver.boards') || {};
    boards[accountId] = boardList;
    this.store.set('naver.boards', boards);
  }

  /**
   * 특정 계정의 게시판 정보 삭제
   */
  deleteNaverBoards(accountId: string): void {
    const boards = this.store.get('naver.boards') || {};
    delete boards[accountId];
    this.store.set('naver.boards', boards);
  }

  /**
   * 전체 게시판 정보 가져오기
   */
  getAllNaverBoards(): { [accountId: string]: string[] } {
    return this.store.get('naver.boards') || {};
  }

  // ==================== 앱 설정 ====================

  /**
   * 앱 버전 가져오기
   */
  getAppVersion(): string {
    return this.store.get('app.version');
  }

  /**
   * 전체 설정 초기화
   */
  reset(): void {
    this.store.clear();
  }

  /**
   * 설정 파일 경로 가져오기
   */
  getConfigPath(): string {
    return this.store.path;
  }
}
