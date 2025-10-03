import { BaseLLMClient } from './base-client';
import { LLMMessage, LLMResponse, LLMTool, ImageGenerationOptions } from '../types/llm.types';
import { handleError } from '@/shared/utils/error-handler';
import { withRetry } from '@/shared/utils/retry';

export class ClaudeClient extends BaseLLMClient {
  async generateText(messages: LLMMessage[], options?: { tools?: LLMTool[] }): Promise<LLMResponse> {
    return withRetry(
      async (attempt, maxRetries) => {
        console.log(`🟣 Claude ${this.config.model} 텍스트 생성 시작 (${attempt}/${maxRetries})`);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': this.config.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: this.config.model,
            max_tokens: 2000,
            messages: messages.map(msg => ({
              role: msg.role === 'system' ? 'user' : msg.role,
              content: msg.role === 'system' ? `System: ${msg.content}` : msg.content
            }))
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          handleError(new Error(errorText), `❌ Claude 오류 응답 (${attempt}/${maxRetries})`);
          throw new Error(`Claude API 오류: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Claude 응답 수신 완료`);

        return {
          content: data.content[0]?.text || '',
          usage: {
            promptTokens: data.usage?.input_tokens || 0,
            completionTokens: data.usage?.output_tokens || 0,
            totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
          }
        };
      },
      { maxRetries: 2, delayMs: 500, errorPrefix: 'Claude 텍스트 생성' }
    );
  }

  async generateImage(prompt: string, options?: ImageGenerationOptions): Promise<string> {
    throw new Error('Claude는 이미지 생성을 지원하지 않습니다.');
  }
}
