import { app, BrowserWindow, ipcMain, shell, Menu, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ClaudeWebService } from './services/claude-web-service';
import { ImageService } from './services/image-service';
import { registerPlaywrightHandlers, playwrightService } from './services/playwright-service';
import { getDefaultSEOGuideContent } from '../shared/services/content/default-seo-guide';
import { FileService } from './services/file-service';
import { AppService } from './services/app-service';
import { ConfigService } from './services/config-service';
import { NaverTrendAPIService } from './services/naver-trend-api-service';
import * as https from 'https';
import { handleError } from '../shared/utils/error-handler';

let mainWindow: BrowserWindow;
const claudeWebService = new ClaudeWebService();
const fileService = new FileService();
const appService = new AppService();
const configService = new ConfigService();
const imageService = new ImageService(configService);
const naverTrendAPI = new NaverTrendAPIService(configService);

// 콘솔 로그를 UI로 전송하는 함수
function sendLogToUI(level: string, message: string) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('log-message', {
      level,
      message,
      timestamp: new Date()
    });
  }
}

// console.log 오버라이드
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = (...args: any[]) => {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  originalConsoleLog(...args);
  sendLogToUI('info', message);
};

console.error = (...args: any[]) => {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  originalConsoleError(...args);
  sendLogToUI('error', message);
};

console.warn = (...args: any[]) => {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  originalConsoleWarn(...args);
  sendLogToUI('warning', message);
};

function createWindow(): void {
  mainWindow = new BrowserWindow({
    height: 900,
    width: 1400,
    minHeight: 700,
    minWidth: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // AppService에 mainWindow 설정
  appService.setMainWindow(mainWindow);

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 개발자 도구 단축키 등록 (Ctrl+Shift+I, F12)
  mainWindow.webContents.on('before-input-event', (_event, input: any) => {
    if (input.type === 'keyDown') {
      // Ctrl+Shift+I
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        mainWindow.webContents.toggleDevTools();
      }
      // F12
      if (input.key === 'F12') {
        mainWindow.webContents.toggleDevTools();
      }
    }
  });
}

app.whenReady().then(() => {
  registerPlaywrightHandlers();
  createWindow();
  createMenu();
});

// 메뉴 생성
function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: '새 프로젝트',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // 새 프로젝트 기능
          }
        },
        { type: 'separator' },
        {
          label: '종료',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: '실행 취소' },
        { role: 'redo', label: '다시 실행' },
        { type: 'separator' },
        { role: 'cut', label: '잘라내기' },
        { role: 'copy', label: '복사' },
        { role: 'paste', label: '붙여넣기' },
        { role: 'selectAll', label: '모두 선택' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: '새로고침' },
        { role: 'forceReload', label: '강제 새로고침' },
        { type: 'separator' },
        { role: 'resetZoom', label: '확대/축소 재설정' },
        { role: 'zoomIn', label: '확대' },
        { role: 'zoomOut', label: '축소' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '전체화면 토글' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: '업데이트 확인',
          click: async () => {
            try {
              console.log('업데이트 확인 시작...');
              const updateInfo = await appService.checkForUpdates();

              if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send('update-check-result', updateInfo);
              }

              if (updateInfo.error) {
                handleError(new Error(updateInfo.error), '업데이트 확인 실패');
              } else if (updateInfo.hasUpdate) {
                console.log(`새 버전 발견: ${updateInfo.latestVersion}`);
              } else {
                console.log('최신 버전을 사용 중입니다.');
              }
            } catch (error) {
              handleError(error, '업데이트 확인 실패');
              if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send('update-check-result', {
                  hasUpdate: false,
                  error: '업데이트 확인 중 오류가 발생했습니다.'
                });
              }
            }
          }
        },
        { type: 'separator' },
        {
          label: '블로그 자동화 v3 정보',
          click: () => {
            const version = app.getVersion();
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '블로그 자동화 v3 정보',
              message: '블로그 자동화 v3',
              detail: `버전: ${version}\n\nAI 기반 블로그 자동화 도구\n- Claude Web 연동 글 작성\n- 다중 이미지 생성 모델 지원\n- 자동 업데이트 시스템\n- 네이버 블로그 자동 발행\n\n개발자: PARKJAEHYEONG922`,
              buttons: ['확인']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// createDefaultSEOGuide는 FileService로 이동됨

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for Claude Web automation
ipcMain.handle('claude-web:open', async () => {
  return await claudeWebService.openBrowser();
});

ipcMain.handle('claude-web:send-prompt', async (_event, writingStylePaths: string[], seoGuidePath: string, prompt: string) => {
  return await claudeWebService.sendPrompt(writingStylePaths, seoGuidePath, prompt);
});

ipcMain.handle('claude-web:wait-response', async () => {
  return await claudeWebService.waitForResponse();
});

ipcMain.handle('claude-web:download', async () => {
  return await claudeWebService.copyContent();
});

ipcMain.handle('claude-web:cleanup', async () => {
  try {
    console.log('🧹 Claude Web 서비스 정리 시작...');
    await claudeWebService.close();
    console.log('✅ Claude Web 서비스 정리 완료');
    return { success: true };
  } catch (error) {
    handleError(error, '❌ Claude Web 서비스 정리 실패');
    return { success: false, error: (error as Error).message };
  }
});

// IPC handlers for image generation
ipcMain.handle('image:generate-prompts', async (_event, data: { content: string; imageCount: number }) => {
  return await imageService.generateImagePrompts(data.content, data.imageCount);
});

ipcMain.handle('image:generate', async (_event, prompt: string) => {
  try {
    console.log('이미지 생성 시작 - LLMClientFactory 사용');

    // ConfigService에서 설정 로드
    const settings = configService.getLLMSettings();

    if (!settings?.lastUsedSettings?.image) {
      throw new Error('이미지 생성 API가 설정되지 않았습니다.');
    }

    const imageConfig = settings.lastUsedSettings.image;
    const apiKey = settings.providerApiKeys?.[imageConfig.provider as keyof typeof settings.providerApiKeys];

    if (!apiKey) {
      throw new Error(`${imageConfig.provider} API 키가 설정되지 않았습니다.`);
    }

    // LLMClientFactory 사용
    const { LLMClientFactory } = require('../shared/services/llm');

    // Image client 설정
    LLMClientFactory.setImageClient({
      provider: imageConfig.provider,
      model: imageConfig.model,
      apiKey: apiKey,
      style: imageConfig.style
    });
    
    // Image client로 이미지 생성
    const imageClient = LLMClientFactory.getImageClient();
    const imageUrl = await imageClient.generateImage(prompt, {
      quality: imageConfig.quality || 'medium',
      size: imageConfig.size || '1024x1024',
      style: imageConfig.style || 'realistic'
    });
    
    return imageUrl;

  } catch (error) {
    handleError(error, '이미지 생성 실패');

    // 실패한 경우 에러 메시지와 함께 SVG 에러 이미지 반환
    const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
    const errorSvg = `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#ff6b6b"/>
        <text x="200" y="150" text-anchor="middle" fill="white" font-family="Arial" font-size="14">
          이미지 생성 실패
        </text>
        <text x="200" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="12">
          ${errorMsg.substring(0, 30)}
        </text>
      </svg>
    `).toString('base64')}`;
    return errorSvg;
  }
});

// IPC handlers for file management
ipcMain.handle('file:save-document', async (_event, type: 'writingStyle' | 'seoGuide', name: string, content: string) => {
  return await fileService.saveDocument(type, name, content);
});

// IPC handler for creating default SEO guide
ipcMain.handle('file:create-default-seo', async () => {
  await fileService.createDefaultSEOGuide();
  return true;
});

ipcMain.handle('file:delete-document', async (_event, filePath: string) => {
  return await fileService.deleteDocument(filePath);
});

ipcMain.handle('file:load-documents', async (_event, type: 'writingStyle' | 'seoGuide') => {
  return await fileService.loadDocuments(type);
});

// LLM Settings handlers
ipcMain.handle('llm:get-settings', async () => {
  return configService.getLLMSettings();
});

ipcMain.handle('llm:save-settings', async (_event, settings: any) => {
  configService.saveLLMSettings(settings);
  return true;
});

ipcMain.handle('llm:test-config', async (_event, config: { provider: string; apiKey: string; model?: string }) => {
  try {
    const { LLMClientFactory } = await import('../shared/services/llm/llm-factory');

    // provider별 기본 모델
    const defaultModels: Record<string, string> = {
      'gemini': 'gemini-2.0-flash-exp',
      'openai': 'gpt-4o-mini',
      'claude': 'claude-3-5-sonnet-20241022',
      'runware': 'runware-sd3.5-turbo'
    };

    const llmConfig = {
      provider: config.provider as 'gemini' | 'openai' | 'claude' | 'runware',
      apiKey: config.apiKey,
      model: config.model || defaultModels[config.provider] || ''
    };

    const client = LLMClientFactory.createClient(llmConfig);

    // 간단한 테스트 메시지로 연결 확인
    await client.generateText([
      { role: 'user', content: 'test' }
    ]);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'API 연결 실패'
    };
  }
});

// 로그 IPC 핸들러
ipcMain.on('log:add', (_event, level: string, message: string) => {
  // 렌더러 프로세스로 로그 메시지 전송
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('log:message', {
      level,
      message,
      timestamp: new Date().toISOString()
    });
  }
  
  // 메인 프로세스 콘솔에도 출력
  console.log(`[${level.toUpperCase()}] ${message}`);
});

// IPC handler for title generation via API
ipcMain.handle('llm:generate-titles', async (_event, data: { systemPrompt: string; userPrompt: string }) => {
  try {
    console.log('텍스트 생성 시작 - LLMClientFactory 사용');
    
    // ConfigService에서 설정 로드
    const settings = configService.getLLMSettings();

    if (!settings?.lastUsedSettings?.writing) {
      return { success: false, error: '글쓰기 API가 설정되지 않았습니다.' };
    }

    const writingConfig = settings.lastUsedSettings.writing;
    const apiKey = settings.providerApiKeys?.[writingConfig.provider as keyof typeof settings.providerApiKeys];

    if (!apiKey) {
      return { success: false, error: `${writingConfig.provider} API 키가 설정되지 않았습니다.` };
    }

    // LLMClientFactory 사용
    const { LLMClientFactory } = require('../shared/services/llm');

    // Writing client 설정
    LLMClientFactory.setWritingClient({
      provider: writingConfig.provider,
      model: writingConfig.model,
      apiKey: apiKey
    });
    
    // Writing client로 텍스트 생성
    const writingClient = LLMClientFactory.getWritingClient();
    const response = await writingClient.generateText([
      { role: 'system', content: data.systemPrompt },
      { role: 'user', content: data.userPrompt }
    ]);

    return {
      success: true,
      content: response.content,
      usage: response.usage
    };

  } catch (error) {
    handleError(error, '제목 생성 실패');

    let errorMessage = error instanceof Error ? error.message : String(error);
    
    // 사용자 친화적인 에러 메시지 변환
    if (errorMessage.includes('503')) {
      errorMessage = 'AI 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.';
    } else if (errorMessage.includes('429')) {
      errorMessage = 'API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요.';
    } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
      errorMessage = 'API 키가 올바르지 않습니다. 설정을 확인해주세요.';
    } else if (errorMessage.includes('500')) {
      errorMessage = 'AI 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
});

// IPC handler for opening external URLs
ipcMain.handle('open-external', async (_event, url: string) => {
  await shell.openExternal(url);
});

// IPC handlers for temporary file operations
ipcMain.handle('file:saveTempFile', async (_event, { fileName, data }: { fileName: string; data: number[] }) => {
  return await fileService.saveTempFile(fileName, data);
});

ipcMain.handle('clipboard:copyImage', async (_event, filePath: string) => {
  const { clipboard, nativeImage } = require('electron');
  const fs = require('fs');
  
  try {
    console.log(`📋 클립보드에 이미지 복사: ${filePath}`);
    
    // 파일이 존재하는지 확인
    if (!fs.existsSync(filePath)) {
      throw new Error(`파일이 존재하지 않습니다: ${filePath}`);
    }
    
    // 이미지 파일을 nativeImage로 생성
    const image = nativeImage.createFromPath(filePath);
    
    if (image.isEmpty()) {
      throw new Error('이미지를 로드할 수 없습니다');
    }
    
    // 클립보드에 이미지 복사
    clipboard.writeImage(image);
    
    console.log(`✅ 클립보드에 이미지 복사 완료: ${filePath}`);
    return { success: true };

  } catch (error) {
    handleError(error, '클립보드 이미지 복사 실패');
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('file:deleteTempFile', async (_event, filePath: string) => {
  return await fileService.deleteTempFile(filePath);
});

// App version handler
ipcMain.handle('app:get-version', async () => {
  return appService.getVersion();
});

ipcMain.handle('app:check-for-updates', async () => {
  return await appService.checkForUpdates();
});

ipcMain.handle('app:download-update', async (_event, downloadUrl: string) => {
  return await appService.downloadUpdate(downloadUrl);
});

// ============= Naver Cookies Management =============

// 네이버 쿠키 가져오기
ipcMain.handle('naver:get-cookies', async () => {
  return configService.getNaverCookies();
});

// 네이버 쿠키 저장
ipcMain.handle('naver:save-cookies', async (_event, cookies: string) => {
  configService.setNaverCookies(cookies);
  return true;
});

// 네이버 쿠키 삭제
ipcMain.handle('naver:delete-cookies', async () => {
  configService.deleteNaverCookies();
  return true;
});

// ============= Naver Account Management =============

// 네이버 계정 목록 가져오기
ipcMain.handle('naver:get-accounts', async () => {
  return configService.getNaverAccounts();
});

// 네이버 계정 추가
ipcMain.handle('naver:add-account', async (_event, account: any) => {
  return configService.addNaverAccount(account);
});

// 네이버 계정 삭제
ipcMain.handle('naver:delete-account', async (_event, accountId: string) => {
  return configService.deleteNaverAccount(accountId);
});

// 네이버 비밀번호 가져오기
ipcMain.handle('naver:get-password', async (_event, accountId: string) => {
  return configService.getNaverPassword(accountId);
});

// 네이버 비밀번호 저장
ipcMain.handle('naver:save-password', async (_event, accountId: string, password: string) => {
  configService.setNaverPassword(accountId, password);
  return true;
});

// 네이버 게시판 목록 가져오기
ipcMain.handle('naver:get-boards', async (_event, accountId: string) => {
  return configService.getNaverBoards(accountId);
});

// 네이버 게시판 목록 저장
ipcMain.handle('naver:save-boards', async (_event, accountId: string, boards: string[]) => {
  configService.setNaverBoards(accountId, boards);
  return true;
});

// 전체 게시판 정보 가져오기
ipcMain.handle('naver:get-all-boards', async () => {
  return configService.getAllNaverBoards();
});

// ============= Naver Login =============

// 네이버 로그인 페이지 열기 (PlaywrightService 사용)
ipcMain.handle('naver:open-login', async () => {
  try {
    // PlaywrightService를 통해 네이버 로그인 수행
    const result = await playwrightService.naverLogin();

    if (!result.success) {
      throw new Error(result.error || '로그인 실패');
    }

    // 쿠키 저장
    configService.setNaverCookies(result.cookies!);

    // 브라우저 닫기
    await playwrightService.cleanup();

    return { success: true, cookies: result.cookies };

  } catch (error) {
    handleError(error, '네이버 로그인 실패');
    await playwrightService.cleanup();
    return { success: false, error: (error as Error).message };
  }
});

// 네이버 트렌드 가져오기
ipcMain.handle('naver:get-trends', async (_event, category?: string, limit: number = 20, date?: string) => {
  return await naverTrendAPI.getTrends(category, limit, date);
});

// 네이버 트렌드 콘텐츠 가져오기
ipcMain.handle('naver:get-trend-contents', async (_event, keyword: string, date: string, limit: number = 20) => {
  return await naverTrendAPI.getTrendContents(keyword, date, limit);
});

// Settings 가져오기 (llm:get-settings와 동일)
ipcMain.handle('settings:get', async () => {
  return configService.getLLMSettings();
});

