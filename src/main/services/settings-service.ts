import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { handleError } from '../../shared/utils/error-handler';

/**
 * LLM 설정 인터페이스
 */
export interface LLMSettings {
  provider?: string;
  apiKey?: string;
  model?: string;
  [key: string]: any;
}

/**
 * API 테스트 설정
 */
export interface APITestConfig {
  provider: string;
  apiKey: string;
}

/**
 * API 테스트 결과
 */
export interface APITestResult {
  success: boolean;
  message: string;
}

/**
 * 설정 관리 서비스 (LLM 설정, 일반 설정)
 */
export class SettingsService {
  private readonly SETTINGS_FILE = 'llm-settings.json';

  /**
   * 설정 파일 경로 반환
   */
  private getSettingsPath(): string {
    return path.join(app.getPath('userData'), this.SETTINGS_FILE);
  }

  /**
   * LLM 설정 로드
   */
  async getSettings(): Promise<LLMSettings | null> {
    try {
      const settingsPath = this.getSettingsPath();

      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf-8');
        return JSON.parse(data);
      }

      return null;
    } catch (error) {
      handleError(error, 'LLM 설정 로드 실패');
      return null;
    }
  }

  /**
   * LLM 설정 저장
   */
  async saveSettings(settings: LLMSettings): Promise<boolean> {
    try {
      const settingsPath = this.getSettingsPath();

      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
      console.log('LLM 설정 저장 완료:', settingsPath);

      return true;
    } catch (error) {
      handleError(error, 'LLM 설정 저장 실패');
      throw error;
    }
  }

  /**
   * API 설정 테스트
   */
  async testAPIConfig(config: APITestConfig): Promise<APITestResult> {
    try {
      console.log(`API 테스트 시작: ${config.provider}`);

      const { provider, apiKey } = config;

      if (!apiKey) {
        return { success: false, message: 'API 키가 필요합니다.' };
      }

      // Provider별 API 테스트
      switch (provider) {
        case 'openai':
          return await this.testOpenAI(apiKey);

        case 'anthropic':
        case 'claude':
          return await this.testClaude(apiKey);

        case 'gemini':
          return await this.testGemini(apiKey);

        case 'runware':
          return await this.testRunware(apiKey);

        default:
          return { success: false, message: '지원하지 않는 API 제공자입니다' };
      }
    } catch (error) {
      handleError(error, `API 테스트 실패 (${config.provider})`);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * OpenAI API 테스트
   */
  private async testOpenAI(apiKey: string): Promise<APITestResult> {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return { success: true, message: 'OpenAI API 연결 성공' };
    } else {
      return { success: false, message: `OpenAI API 오류: ${response.status}` };
    }
  }

  /**
   * Claude API 테스트
   */
  private async testClaude(apiKey: string): Promise<APITestResult> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
    });

    if (response.ok) {
      return { success: true, message: 'Claude API 연결 성공' };
    } else {
      return { success: false, message: `Claude API 오류: ${response.status}` };
    }
  }

  /**
   * Gemini API 테스트
   */
  private async testGemini(apiKey: string): Promise<APITestResult> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (response.ok) {
      return { success: true, message: 'Gemini API 연결 성공' };
    } else {
      return { success: false, message: `Gemini API 오류: ${response.status}` };
    }
  }

  /**
   * Runware API 테스트
   */
  private async testRunware(apiKey: string): Promise<APITestResult> {
    // UUIDv4 생성
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };

    const testUUID = generateUUID();
    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify([
        {
          taskType: 'imageInference',
          taskUUID: testUUID,
          positivePrompt: 'test image',
          width: 512,
          height: 512,
          model: 'civitai:4201@130072',
          numberResults: 1,
          steps: 1,
          CFGScale: 7,
          seed: 12345
        }
      ])
    });

    if (response.ok) {
      return { success: true, message: 'Runware API 연결 성공' };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        message: `Runware API 오류: ${response.status} - ${errorText}`
      };
    }
  }
}
