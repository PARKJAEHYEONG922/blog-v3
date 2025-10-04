import Store from 'electron-store';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

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

    // 구버전 설정 파일 자동 마이그레이션
    this.migrateOldSettings();
  }

  /**
   * 구버전 설정 파일들을 새로운 config.json으로 마이그레이션
   */
  private migrateOldSettings(): void {
    const userDataPath = app.getPath('userData');

    // 1. llm-settings.json 마이그레이션
    const oldLLMSettingsPath = path.join(userDataPath, 'llm-settings.json');
    if (fs.existsSync(oldLLMSettingsPath)) {
      try {
        const oldData = JSON.parse(fs.readFileSync(oldLLMSettingsPath, 'utf-8'));

        // appliedSettings를 lastUsedSettings로 변환
        if (oldData.appliedSettings) {
          const { writing, image } = oldData.appliedSettings;

          this.store.set('llm.lastUsedSettings', {
            writing: {
              provider: writing?.provider || 'gemini',
              model: writing?.model || ''
            },
            image: {
              provider: image?.provider || 'gemini',
              model: image?.model || '',
              style: image?.style || 'photographic',
              quality: image?.quality || 'high',
              size: image?.size || '1024x1024'
            }
          });
        }

        // providerApiKeys 마이그레이션
        if (oldData.providerApiKeys) {
          this.store.set('llm.providerApiKeys', oldData.providerApiKeys);
        }

        // testingStatus 마이그레이션
        if (oldData.testingStatus) {
          this.store.set('llm.testingStatus', oldData.testingStatus);
        }

        console.log('✅ llm-settings.json 마이그레이션 완료');

        // 백업 후 삭제
        const backupPath = oldLLMSettingsPath + '.backup';
        fs.renameSync(oldLLMSettingsPath, backupPath);
        console.log(`📦 구버전 파일 백업: ${backupPath}`);
      } catch (error) {
        console.error('❌ llm-settings.json 마이그레이션 실패:', error);
      }
    }

    // 2. naver_cookies.txt 마이그레이션
    const oldCookiesPath = path.join(userDataPath, 'naver_cookies.txt');
    if (fs.existsSync(oldCookiesPath)) {
      try {
        const cookies = fs.readFileSync(oldCookiesPath, 'utf-8');
        this.store.set('naver.cookies', cookies);

        console.log('✅ naver_cookies.txt 마이그레이션 완료');

        // 백업 후 삭제
        const backupPath = oldCookiesPath + '.backup';
        fs.renameSync(oldCookiesPath, backupPath);
        console.log(`📦 구버전 파일 백업: ${backupPath}`);
      } catch (error) {
        console.error('❌ naver_cookies.txt 마이그레이션 실패:', error);
      }
    }
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
