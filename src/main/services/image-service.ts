/**
 * Main Process Image Service
 * 이미지 프롬프트 생성 및 이미지 생성을 담당하는 메인 프로세스 서비스
 * 보안을 위해 API 키 처리는 메인 프로세스에서만 수행
 */
import { SettingsService } from './settings-service';
import { handleError } from '../../shared/utils/error-handler';

export class ImageService {
  private settingsService: SettingsService;

  constructor(settingsService: SettingsService) {
    this.settingsService = settingsService;
  }

  /**
   * 이미지 프롬프트 생성
   * LLM을 사용하여 블로그 콘텐츠에 맞는 이미지 프롬프트 생성
   */
  async generateImagePrompts(content: string, imageCount: number): Promise<{ success: boolean; prompts?: string[]; error?: string }> {
    try {
      console.log(`🎨 이미지 프롬프트 생성 시작 (${imageCount}개)`);

      // LLM 설정 로드
      const settings = await this.settingsService.getSettings();
      if (!settings?.lastUsedSettings?.writing) {
        throw new Error('글쓰기 API가 설정되지 않았습니다.');
      }

      const writingConfig = settings.lastUsedSettings.writing;
      const apiKey = settings.providerApiKeys?.[writingConfig.provider];

      if (!apiKey) {
        throw new Error(`${writingConfig.provider} API 키가 설정되지 않았습니다.`);
      }

      // LLMClientFactory 사용
      const { LLMClientFactory } = require('../../shared/services/llm');

      // Writing client 설정
      LLMClientFactory.setWritingClient({
        provider: writingConfig.provider,
        model: writingConfig.model,
        apiKey: apiKey
      });

      // Writing client로 프롬프트 생성
      const writingClient = LLMClientFactory.getWritingClient();
      const response = await writingClient.generateText([
        {
          role: 'user',
          content: `다음 블로그 글 내용을 보고 ${imageCount}개의 이미지 프롬프트를 생성해주세요.
각 프롬프트는 글의 내용과 관련되고 블로그에 어울리는 이미지여야 합니다.

글 내용:
${content}

응답 형식: 각 줄에 하나씩 프롬프트만 작성해주세요.`
        }
      ]);

      const promptText = response.content;
      const prompts = promptText.split('\n').filter((line: string) => line.trim().length > 0);

      console.log(`✅ 이미지 프롬프트 생성 완료: ${prompts.length}개`);

      return {
        success: true,
        prompts: prompts.slice(0, imageCount)
      };

    } catch (error) {
      handleError(error, '이미지 프롬프트 생성 실패');

      // 기본 프롬프트 반환 (fallback)
      const fallbackPrompts = Array.from({ length: imageCount }, (_, i) =>
        `블로그 글과 관련된 일러스트 이미지 ${i + 1}`
      );

      return {
        success: false,
        prompts: fallbackPrompts,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }
}
