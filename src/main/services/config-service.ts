import Store from 'electron-store';

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
    testingStatus?: any;
  };
  naver: {
    cookies: string | null;
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
  private store: any; // electron-store 타입 이슈 회피

  constructor() {
    this.store = new Store<AppConfig>({
      name: 'config',
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
          cookies: null
        },
        app: {
          version: '3.0.7'
        }
      }
    });
  }

  // ==================== LLM 설정 ====================

  /**
   * 전체 LLM 설정 가져오기
   */
  getLLMSettings(): any {
    return this.store.get('llm');
  }

  /**
   * 전체 LLM 설정 저장
   */
  saveLLMSettings(settings: any): void {
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
