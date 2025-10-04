// Electron 관련 타입 정의

export interface DownloadProgress {
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
}

export interface SavedDocument {
  id: string;
  name: string;
  content: string;
  filePath: string;
  createdAt: string;
  useForWriting?: boolean;
  useForSEO?: boolean;
}

export interface TrendData {
  keyword: string;
  rank: number;
  category: string;
  date: string;
}

export interface TrendResponse {
  trends?: TrendData[];
  needsLogin?: boolean;
  error?: string;
}

export interface TrendContentData {
  title: string;
  url: string;
  contentPreview: string;
}

export interface TrendContentResponse {
  contents?: TrendContentData[];
  needsLogin?: boolean;
  error?: string;
}

export interface NaverAccountData {
  id: string;
  username: string;
  blogUrl?: string;
  createdAt: string;
  lastUsed?: number;
}

export interface ElectronAPI {
  // Claude Web 관련
  openClaudeWeb: () => Promise<void>;
  sendToClaudeWeb: (writingStylePaths: string[], seoGuidePath: string, topic: string) => Promise<void>;
  waitForClaudeResponse: () => Promise<void>;
  downloadFromClaude: () => Promise<string>;
  cleanupClaudeWeb: () => Promise<{ success: boolean; error?: string }>;
  
  // 파일 관리
  saveDocument: (type: 'writingStyle' | 'seoGuide', name: string, content: string) => Promise<string>;
  deleteDocument: (filePath: string) => Promise<boolean>;
  loadDocuments: (type: 'writingStyle' | 'seoGuide') => Promise<SavedDocument[]>;
  createDefaultSEO: () => Promise<boolean>;

  // 이미지 생성
  generateImagePrompts: (data: { content: string; imageCount: number }) => Promise<{ success: boolean; prompts: string[]; error?: string }>;
  generateImage: (prompt: string) => Promise<string>;

  // LLM 설정
  getLLMSettings: () => Promise<any>; // TODO: AppConfig['llm'] 타입 적용 필요
  saveLLMSettings: (settings: any) => Promise<void>;
  testLLMConfig: (config: { provider: string; apiKey: string; model?: string }) => Promise<{ success: boolean; error?: string }>;
  generateTitles: (data: { systemPrompt: string; userPrompt: string }) => Promise<{ success: boolean; content?: string; titles?: string[]; error?: string }>;

  // 로그 관련
  sendLog: (level: string, message: string) => void;
  onLogMessage: (callback: (data: { level: string; message: string; timestamp: number }) => void) => (() => void);

  // 시스템
  openExternal: (url: string) => Promise<void>;
  getAppVersion: () => Promise<string>;
  checkForUpdates: () => Promise<any>; // TODO: UpdateInfo 타입 적용 필요
  downloadUpdate: (downloadUrl: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateCheckResult: (callback: (data: any) => void) => (() => void);
  onDownloadProgress: (callback: (data: DownloadProgress) => void) => (() => void);

  // 네이버 관련
  openNaverLogin: () => Promise<{ success: boolean; error?: string }>;
  getNaverTrends: (category?: string, limit?: number, date?: string) => Promise<TrendResponse>;
  getNaverCookies: () => Promise<string | null>;
  getTrendContents: (keyword: string, date: string, limit?: number) => Promise<TrendContentResponse>;

  // 네이버 계정 관리
  getNaverAccounts: () => Promise<NaverAccountData[]>;
  addNaverAccount: (account: NaverAccountData) => Promise<NaverAccountData[]>;
  deleteNaverAccount: (accountId: string) => Promise<NaverAccountData[]>;
  getNaverPassword: (accountId: string) => Promise<string | null>;
  saveNaverPassword: (accountId: string, password: string) => Promise<void>;
  getNaverBoards: (accountId: string) => Promise<string[]>;
  saveNaverBoards: (accountId: string, boards: string[]) => Promise<void>;
  getAllNaverBoards: () => Promise<{[key: string]: string[]}>;

  // Playwright 관련
  playwrightInitialize: () => Promise<{ success: boolean; error?: string }>;
  playwrightNavigate: (url: string) => Promise<{ success: boolean; error?: string }>;
  playwrightGetUrl: () => Promise<{ success: boolean; url?: string; error?: string }>;
  playwrightClick: (selector: string) => Promise<{ success: boolean; error?: string }>;
  playwrightFill: (selector: string, value: string) => Promise<{ success: boolean; error?: string }>;
  playwrightWaitSelector: (selector: string, timeout?: number) => Promise<{ success: boolean; error?: string }>;
  playwrightWaitTimeout: (milliseconds: number) => Promise<{ success: boolean; error?: string }>;
  playwrightEvaluate: (script: string) => Promise<{ success: boolean; result?: unknown; error?: string }>;
  playwrightClickInFrames: (selector: string, frameUrlPattern?: string) => Promise<{ success: boolean; error?: string }>;
  playwrightEvaluateInFrames: (script: string, frameUrlPattern?: string) => Promise<{ success: boolean; result?: unknown; error?: string }>;
  playwrightType: (text: string, delay?: number) => Promise<{ success: boolean; error?: string }>;
  playwrightPress: (key: string) => Promise<{ success: boolean; error?: string }>;
  playwrightClickAt: (x: number, y: number) => Promise<{ success: boolean; error?: string }>;
  playwrightSetClipboard: (text: string) => Promise<{ success: boolean; error?: string }>;
  playwrightSetClipboardHTML: (html: string) => Promise<{ success: boolean; error?: string }>;
  playwrightDragDropFile: (filePath: string, targetSelector: string) => Promise<{ success: boolean; error?: string }>;
  playwrightCleanup: () => Promise<{ success: boolean; error?: string }>;

  // 파일 시스템
  saveTempFile: (fileName: string, data: number[]) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  copyImageToClipboard: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  deleteTempFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
}

export interface DocumentData {
  id: string;
  name: string;
  content: string;
  filePath: string;
  createdAt: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}