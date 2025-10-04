/**
 * LLM Provider 정보
 */

export interface Provider {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const PROVIDERS: Provider[] = [
  { id: 'claude', name: 'Claude', icon: '🟠', color: 'orange' },
  { id: 'openai', name: 'OpenAI', icon: '🔵', color: 'blue' },
  { id: 'gemini', name: 'Gemini', icon: '🟢', color: 'green' },
  { id: 'runware', name: 'Runware', icon: '⚡', color: 'purple' }
];

export const TEXT_PROVIDERS = PROVIDERS.filter(p =>
  ['claude', 'openai', 'gemini'].includes(p.id)
);

export const IMAGE_PROVIDERS = PROVIDERS.filter(p =>
  ['openai', 'gemini', 'runware'].includes(p.id)
);
