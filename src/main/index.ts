import { app, BrowserWindow, ipcMain, shell, Menu, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ClaudeWebService } from './services/claude-web-service';
import { ImageService } from '../shared/services/content/image-service';
import { registerPlaywrightHandlers, playwrightService } from './services/playwright-service';
import { getDefaultSEOGuideContent } from '../shared/services/content/default-seo-guide';
import { CookieService } from './services/cookie-service';
import { FileService } from './services/file-service';
import { AppService } from './services/app-service';
import { SettingsService } from './services/settings-service';
import { NaverTrendAPIService } from './services/naver-trend-api-service';
import * as https from 'https';

let mainWindow: BrowserWindow;
const claudeWebService = new ClaudeWebService();
const imageService = new ImageService();
const cookieService = new CookieService();
const fileService = new FileService();
const appService = new AppService();
const settingsService = new SettingsService();
const naverTrendAPI = new NaverTrendAPIService(cookieService);

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
  mainWindow.webContents.on('before-input-event', (event: any, input: any) => {
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
  createWindow();
  createDefaultSEOGuide();
  registerPlaywrightHandlers();
  createMenu();
});

// 메뉴 생성
function createMenu() {
  const template: any[] = [
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
                console.error('업데이트 확인 실패:', updateInfo.error);
              } else if (updateInfo.hasUpdate) {
                console.log(`새 버전 발견: ${updateInfo.latestVersion}`);
              } else {
                console.log('최신 버전을 사용 중입니다.');
              }
            } catch (error) {
              console.error('업데이트 확인 실패:', error);
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

ipcMain.handle('claude-web:send-prompt', async (event: any, writingStylePaths: string[], seoGuidePath: string, prompt: string) => {
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
    console.error('❌ Claude Web 서비스 정리 실패:', error);
    return { success: false, error: (error as Error).message };
  }
});

// IPC handlers for image generation
ipcMain.handle('image:generate-prompts', async (event: any, data: { content: string; imageCount: number }) => {
  return await imageService.generateImagePrompts(data.content, data.imageCount);
});

ipcMain.handle('image:generate', async (event: any, prompt: string) => {
  try {
    console.log('이미지 생성 시작 - LLMClientFactory 사용');
    
    // LLM 설정 로드
    const fs = require('fs');
    const path = require('path');
    const userDataPath = app.getPath('userData');
    const settingsPath = path.join(userDataPath, 'llm-settings.json');
    
    let settings = null;
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf-8');
      settings = JSON.parse(settingsData);
    }
    
    if (!settings?.appliedSettings?.image) {
      throw new Error('이미지 생성 API가 설정되지 않았습니다.');
    }
    
    const imageConfig = settings.appliedSettings.image;
    
    // LLMClientFactory 사용
    const { LLMClientFactory } = require('../shared/services/llm');
    
    // Image client 설정
    LLMClientFactory.setImageClient({
      provider: imageConfig.provider,
      model: imageConfig.model,
      apiKey: imageConfig.apiKey,
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
    console.error('이미지 생성 실패:', error);
    
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

// IPC handler for publishing to blog (reuse v2 logic)
ipcMain.handle('blog:publish', async (event: any, content: string) => {
  // TODO: Integrate with existing v2 publishing logic
  console.log('Publishing content:', content.slice(0, 100) + '...');
  return { success: true };
});

// IPC handlers for file management
ipcMain.handle('file:save-document', async (event: any, type: 'writingStyle' | 'seoGuide', name: string, content: string) => {
  return await fileService.saveDocument(type, name, content);
});

// IPC handler for creating default SEO guide
ipcMain.handle('file:create-default-seo', async () => {
  await fileService.createDefaultSEOGuide();
  return true;
});

ipcMain.handle('file:delete-document', async (event: any, filePath: string) => {
  return await fileService.deleteDocument(filePath);
});

ipcMain.handle('file:load-documents', async (event: any, type: 'writingStyle' | 'seoGuide') => {
  return await fileService.loadDocuments(type);
});

// LLM Settings handlers
ipcMain.handle('llm:get-settings', async () => {
  return await settingsService.getSettings();
});

ipcMain.handle('llm:save-settings', async (event: any, settings: any) => {
  return await settingsService.saveSettings(settings);
});

ipcMain.handle('llm:test-config', async (event: any, config: any) => {
  return await settingsService.testAPIConfig(config);
});

// 로그 IPC 핸들러
ipcMain.on('log:add', (event: any, level: string, message: string) => {
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
ipcMain.handle('llm:generate-titles', async (event: any, data: { systemPrompt: string; userPrompt: string }) => {
  try {
    console.log('제목 생성 시작 - LLMClientFactory 사용');
    
    // LLM 설정 로드
    const fs = require('fs');
    const path = require('path');
    const userDataPath = app.getPath('userData');
    const settingsPath = path.join(userDataPath, 'llm-settings.json');
    
    let settings = null;
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf-8');
      settings = JSON.parse(settingsData);
    }
    
    if (!settings?.appliedSettings?.writing) {
      return { success: false, error: '글쓰기 API가 설정되지 않았습니다.' };
    }
    
    const writingConfig = settings.appliedSettings.writing;
    
    // LLMClientFactory 사용
    const { LLMClientFactory } = require('../shared/services/llm');
    
    // Writing client 설정
    LLMClientFactory.setWritingClient({
      provider: writingConfig.provider,
      model: writingConfig.model,
      apiKey: writingConfig.apiKey
    });
    
    // Writing client로 텍스트 생성
    const writingClient = LLMClientFactory.getWritingClient();
    const response = await writingClient.generateText([
      { role: 'system', content: data.systemPrompt },
      { role: 'user', content: data.userPrompt }
    ]);
    
    return { success: true, content: response.content };
    
  } catch (error) {
    console.error('제목 생성 실패:', error);
    
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
ipcMain.handle('open-external', async (event: any, url: string) => {
  await shell.openExternal(url);
});

// IPC handlers for temporary file operations
ipcMain.handle('file:saveTempFile', async (event: any, { fileName, data }: { fileName: string; data: number[] }) => {
  return await fileService.saveTempFile(fileName, data);
});

ipcMain.handle('clipboard:copyImage', async (event: any, filePath: string) => {
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
    console.error('클립보드 이미지 복사 실패:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('file:deleteTempFile', async (event: any, filePath: string) => {
  return await fileService.deleteTempFile(filePath);
});

// App version handler
ipcMain.handle('app:get-version', async () => {
  return appService.getVersion();
});

ipcMain.handle('app:check-for-updates', async () => {
  return await appService.checkForUpdates();
});

ipcMain.handle('app:download-update', async (event: any, downloadUrl: string) => {
  return await appService.downloadUpdate(downloadUrl);
});

// ============= Naver Cookies Management =============

// 네이버 쿠키 가져오기
ipcMain.handle('naver:get-cookies', async () => {
  return await cookieService.getCookies();
});

// 네이버 쿠키 저장
ipcMain.handle('naver:save-cookies', async (event: any, cookies: string) => {
  return await cookieService.saveCookies(cookies);
});

// 네이버 쿠키 삭제
ipcMain.handle('naver:delete-cookies', async () => {
  return await cookieService.deleteCookies();
});

// 네이버 로그인 페이지 열기 (PlaywrightService 사용)
ipcMain.handle('naver:open-login', async () => {
  try {
    // PlaywrightService를 통해 네이버 로그인 수행
    const result = await playwrightService.naverLogin();

    if (!result.success) {
      throw new Error(result.error || '로그인 실패');
    }

    // 쿠키 저장
    await cookieService.saveCookies(result.cookies!);

    // 브라우저 닫기
    await playwrightService.cleanup();

    return { success: true, cookies: result.cookies };

  } catch (error) {
    console.error('네이버 로그인 실패:', error);
    await playwrightService.cleanup();
    return { success: false, error: (error as Error).message };
  }
});

// 네이버 트렌드 가져오기
ipcMain.handle('naver:get-trends', async (event: any, category?: string, limit: number = 20, date?: string) => {
  return await naverTrendAPI.getTrends(category, limit, date);
});

// 네이버 트렌드 콘텐츠 가져오기
ipcMain.handle('naver:get-trend-contents', async (event, keyword: string, date: string, limit: number = 20) => {
  return await naverTrendAPI.getTrendContents(keyword, date, limit);
});

// Settings 가져오기 (llm:get-settings와 동일)
ipcMain.handle('settings:get', async () => {
  return await settingsService.getSettings();
});

