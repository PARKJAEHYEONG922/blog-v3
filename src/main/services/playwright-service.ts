/**
 * Electron Main Process에서 Playwright 기본 브라우저 제어
 * 플랫폼별 세부 로직은 각 컴포넌트에서 구현
 */
import { ipcMain } from 'electron';
import { chromium, Browser, Page, BrowserContext } from 'playwright';

class PlaywrightService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  // 시스템 브라우저 경로 감지
  private getSystemBrowserPath(): string | null {
    const os = require('os');
    const fs = require('fs');
    const path = require('path');

    if (os.platform() === 'win32') {
      // Windows에서 Chrome → Edge → Whale 순서대로 시도
      const browserPaths = [
        // Chrome 경로들 (1순위)
        path.join('C:', 'Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join('C:', 'Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        
        // Edge 경로들 (2순위)
        path.join('C:', 'Program Files (x86)', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join('C:', 'Program Files', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        
        // Whale 경로들 (3순위)
        path.join('C:', 'Program Files', 'Naver', 'Whale', 'Application', 'whale.exe'),
        path.join('C:', 'Program Files (x86)', 'Naver', 'Whale', 'Application', 'whale.exe'),
        path.join(os.homedir(), 'AppData', 'Local', 'Naver', 'Whale', 'Application', 'whale.exe'),
      ];

      for (const browserPath of browserPaths) {
        if (fs.existsSync(browserPath)) {
          return browserPath;
        }
      }
    } else if (os.platform() === 'darwin') {
      // macOS
      const browserPaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      ];

      for (const browserPath of browserPaths) {
        if (fs.existsSync(browserPath)) {
          return browserPath;
        }
      }
    } else {
      // Linux
      const browserPaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/microsoft-edge',
      ];

      for (const browserPath of browserPaths) {
        if (fs.existsSync(browserPath)) {
          return browserPath;
        }
      }
    }

    return null;
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🔄 Playwright 브라우저 초기화 시작...');
      
      // 시스템 브라우저 경로 감지
      const systemBrowserPath = this.getSystemBrowserPath();
      console.log('🌐 시스템 브라우저 경로:', systemBrowserPath || '감지되지 않음, 기본 브라우저 사용');
      
      // 브라우저 실행 (헤드리스 모드 비활성화)
      this.browser = await chromium.launch({
        headless: false,
        ...(systemBrowserPath && { executablePath: systemBrowserPath }),
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--no-sandbox',
          '--disable-notifications',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-extensions'
        ]
      });

      // 브라우저 컨텍스트 생성
      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
        bypassCSP: true,
        ignoreHTTPSErrors: true,
        extraHTTPHeaders: {
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
        }
      });

      // 새 페이지 생성
      this.page = await this.context.newPage();

      // 자동화 탐지 방지
      await this.page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      console.log('✅ Playwright 브라우저 초기화 완료');
      return true;

    } catch (error) {
      console.error('❌ Playwright 초기화 실패:', error);
      
      // 오류 유형별 상세 메시지
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Executable doesn\'t exist')) {
        console.error('🚫 브라우저 실행 파일을 찾을 수 없습니다. Chrome, Edge, Whale 중 하나를 설치해주세요.');
        console.log('📋 지원하는 브라우저: Chrome (우선), Edge, Whale');
      } else if (errorMessage.includes('browserType.launch')) {
        console.error('🔧 Playwright 브라우저 엔진 초기화 실패. 시스템 브라우저로 재시도합니다.');
        
        // 시스템 브라우저로 재시도
        return await this.initializeWithFallback();
      }
      
      await this.cleanup();
      return false;
    }
  }

  // 시스템 브라우저를 강제로 사용하는 폴백 메서드
  private async initializeWithFallback(): Promise<boolean> {
    try {
      console.log('🔄 시스템 브라우저로 재시도...');
      
      const systemBrowserPath = this.getSystemBrowserPath();
      if (!systemBrowserPath) {
        throw new Error('사용 가능한 브라우저를 찾을 수 없습니다');
      }

      this.browser = await chromium.launch({
        headless: false,
        executablePath: systemBrowserPath,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-notifications'
        ]
      });

      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        viewport: { width: 1280, height: 720 }
      });

      this.page = await this.context.newPage();
      
      console.log('✅ 폴백 방법으로 브라우저 초기화 성공');
      return true;
      
    } catch (error) {
      console.error('❌ 폴백 초기화도 실패:', error);
      await this.cleanup();
      return false;
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      console.log('Playwright 리소스 정리 완료');
    } catch (error) {
      console.error('Playwright 정리 중 오류:', error);
    }
  }

  // 기본 브라우저 제어 메서드들
  async navigateToUrl(url: string): Promise<boolean> {
    if (!this.page) return false;
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded' });
      console.log(`페이지 이동 완료: ${url}`);
      return true;
    } catch (error) {
      console.error('페이지 이동 실패:', error);
      return false;
    }
  }

  async getCurrentUrl(): Promise<string | null> {
    if (!this.page) return null;
    return this.page.url();
  }

  async waitForTimeout(milliseconds: number): Promise<void> {
    if (!this.page) return;
    await this.page.waitForTimeout(milliseconds);
  }

  // 실제 키보드 타이핑 (사람처럼)
  async typeText(text: string, delay?: number): Promise<boolean> {
    if (!this.page) return false;
    try {
      await this.page.keyboard.type(text, { 
        delay: delay || 50 + Math.random() * 100 // 50-150ms 랜덤 타이핑 속도
      });
      console.log(`실제 키보드로 타이핑 완료: "${text.substring(0, 20)}..."`);
      return true;
    } catch (error) {
      console.error('키보드 타이핑 실패:', error);
      return false;
    }
  }

  // 실제 키 누르기
  async pressKey(key: string): Promise<boolean> {
    if (!this.page) return false;
    try {
      await this.page.keyboard.press(key);
      console.log(`키 입력: ${key}`);
      return true;
    } catch (error) {
      console.error(`키 입력 실패 (${key}):`, error);
      return false;
    }
  }

  // 실제 마우스 클릭 (좌표 기반)
  async clickAt(x: number, y: number): Promise<boolean> {
    if (!this.page) return false;
    try {
      await this.page.mouse.click(x, y);
      console.log(`마우스 클릭: (${x}, ${y})`);
      return true;
    } catch (error) {
      console.error(`마우스 클릭 실패 (${x}, ${y}):`, error);
      return false;
    }
  }

  // 클립보드에 텍스트 설정
  async setClipboard(text: string): Promise<boolean> {
    if (!this.page) return false;
    try {
      await this.page.evaluate(async (text) => {
        await navigator.clipboard.writeText(text);
      }, text);
      console.log(`클립보드에 텍스트 설정 완료: ${text.substring(0, 50)}...`);
      return true;
    } catch (error) {
      console.error('클립보드 설정 실패:', error);
      return false;
    }
  }

  // 클립보드에 HTML 설정
  async setClipboardHTML(html: string): Promise<boolean> {
    if (!this.page) return false;
    try {
      await this.page.evaluate(async (html) => {
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([html.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
        });
        await navigator.clipboard.write([clipboardItem]);
      }, html);
      console.log(`클립보드에 HTML 설정 완료: ${html.substring(0, 50)}...`);
      return true;
    } catch (error) {
      console.error('클립보드 HTML 설정 실패:', error);
      return false;
    }
  }

  async evaluateScript(script: string): Promise<any> {
    if (!this.page) return null;
    try {
      return await this.page.evaluate(script);
    } catch (error) {
      console.error('스크립트 실행 실패:', error);
      return null;
    }
  }

  // iframe 내부에서 스크립트 실행
  async evaluateScriptInFrames(script: string, frameUrlPattern?: string): Promise<any> {
    if (!this.page) return null;
    try {
      const frames = await this.page.frames();
      console.log(`총 ${frames.length}개 프레임에서 스크립트 실행 시도...`);
      
      for (const frame of frames) {
        const frameUrl = frame.url();
        console.log(`프레임 URL 확인: ${frameUrl}`);
        
        // 특정 프레임 URL 패턴이 있으면 해당 프레임만 체크
        if (frameUrlPattern && !frameUrl.includes(frameUrlPattern)) {
          continue;
        }
        
        try {
          const result = await frame.evaluate(script);
          if (result && typeof result === 'object' && 'success' in result && (result as any).success) {
            console.log(`✅ iframe에서 스크립트 실행 성공 (${frameUrl})`);
            return result;
          }
        } catch (error) {
          console.debug(`프레임 ${frameUrl}에서 스크립트 실행 실패:`, error);
          continue;
        }
      }
      
      console.warn(`모든 프레임에서 스크립트 실행 실패`);
      return null;
    } catch (error) {
      console.error(`iframe 스크립트 실행 실패:`, error);
      return null;
    }
  }

  async clickElement(selector: string): Promise<boolean> {
    if (!this.page) return false;
    try {
      // 먼저 메인 페이지에서 시도
      try {
        const element = await this.page.waitForSelector(selector, { state: 'visible', timeout: 3000 });
        if (element) {
          await element.click();
          return true;
        }
      } catch (error) {
        // 메인 페이지에서 실패하면 iframe에서 시도
      }

      // iframe에서 시도
      const frames = await this.page.frames();
      for (const frame of frames) {
        try {
          const element = await frame.waitForSelector(selector, { state: 'visible', timeout: 3000 });
          if (element) {
            await element.click();
            console.log(`iframe에서 요소 클릭 성공: ${selector}`);
            return true;
          }
        } catch (error) {
          // 이 iframe에서는 요소를 찾지 못함, 다음 iframe 시도
          continue;
        }
      }
      
      return false;
    } catch (error) {
      console.error(`요소 클릭 실패 (${selector}):`, error);
      return false;
    }
  }

  async fillInput(selector: string, value: string): Promise<boolean> {
    if (!this.page) return false;
    try {
      const element = await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
      if (element) {
        await element.fill(value);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`입력 실패 (${selector}):`, error);
      return false;
    }
  }

  async waitForSelector(selector: string, timeout = 10000): Promise<boolean> {
    if (!this.page) return false;
    try {
      await this.page.waitForSelector(selector, { state: 'visible', timeout });
      return true;
    } catch (error) {
      console.error(`요소 대기 실패 (${selector}):`, error);
      return false;
    }
  }

  // iframe 전용 요소 클릭 메서드
  async clickElementInFrames(selector: string, frameUrlPattern?: string): Promise<boolean> {
    if (!this.page) return false;
    try {
      const frames = await this.page.frames();
      console.log(`총 ${frames.length}개 프레임 확인 중...`);
      
      for (const frame of frames) {
        const frameUrl = frame.url();
        console.log(`프레임 URL 확인: ${frameUrl}`);
        
        // 특정 프레임 URL 패턴이 있으면 해당 프레임만 체크
        if (frameUrlPattern && !frameUrl.includes(frameUrlPattern)) {
          continue;
        }
        
        try {
          const element = await frame.waitForSelector(selector, { state: 'visible', timeout: 5000 });
          if (element) {
            await element.click();
            console.log(`✅ iframe에서 요소 클릭 성공 (${frameUrl}): ${selector}`);
            return true;
          }
        } catch (error) {
          console.debug(`프레임 ${frameUrl}에서 요소 찾기 실패: ${selector}`);
          continue;
        }
      }
      
      console.warn(`모든 프레임에서 요소를 찾지 못함: ${selector}`);
      return false;
    } catch (error) {
      console.error(`iframe 요소 클릭 실패 (${selector}):`, error);
      return false;
    }
  }

  // 쿠키 가져오기
  async getCookies(): Promise<string | null> {
    if (!this.context) return null;
    try {
      const cookies = await this.context.cookies();
      const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
      return cookieString;
    } catch (error) {
      console.error('쿠키 가져오기 실패:', error);
      return null;
    }
  }

  // 특정 URL로 이동 후 대기
  async waitForNavigation(url: string, timeout = 300000): Promise<boolean> {
    if (!this.page) return false;
    try {
      await this.page.waitForURL(url, { timeout });
      return true;
    } catch (error) {
      console.error('페이지 네비게이션 대기 실패:', error);
      return false;
    }
  }

  // 네이버 로그인 (크리에이터 어드바이저용)
  async naverLogin(): Promise<{ success: boolean; cookies?: string; error?: string }> {
    try {
      // 브라우저가 초기화되지 않았으면 초기화
      if (!this.browser) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('브라우저 초기화 실패');
        }
      }

      console.log('🌐 네이버 로그인 페이지 열기...');

      // 네이버 크리에이터 어드바이저 로그인 페이지로 이동
      const loginUrl = 'https://nid.naver.com/nidlogin.login?url=https://creator-advisor.naver.com';
      await this.navigateToUrl(loginUrl);

      console.log('⏳ 로그인 완료까지 대기 중...');
      console.log('💡 네이버 로그인 후 creator-advisor.naver.com 페이지가 뜰 때까지 기다립니다...');

      // 로그인 완료 대기 (creator-advisor.naver.com으로 이동할 때까지)
      const success = await this.waitForNavigation('**/creator-advisor.naver.com/**');

      if (!success) {
        throw new Error('로그인 대기 시간 초과');
      }

      console.log('✅ 로그인 완료 감지! URL:', await this.getCurrentUrl());

      // 잠시 대기 (페이지 완전히 로드)
      await this.waitForTimeout(3000);

      // 쿠키 추출
      const cookieString = await this.getCookies();
      if (!cookieString) {
        throw new Error('쿠키 추출 실패');
      }

      console.log('✅ 쿠키 추출 완료:', cookieString.substring(0, 100) + '...');

      return { success: true, cookies: cookieString };

    } catch (error) {
      console.error('네이버 로그인 실패:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // 파일 드래그 앤 드롭 (네이버 블로그 이미지 업로드용)
  async dragAndDropFile(filePath: string, targetSelector: string): Promise<boolean> {
    if (!this.page) return false;
    try {
      console.log(`🔄 파일 드래그 앤 드롭 시작: ${filePath} -> ${targetSelector}`);
      
      // 파일 존재 확인
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        throw new Error(`파일이 존재하지 않습니다: ${filePath}`);
      }

      // 파일 정보 읽기
      const path = require('path');
      const fileName = path.basename(filePath);
      const fileBuffer = fs.readFileSync(filePath);

      // 대상 요소 찾기 (메인 페이지 및 iframe에서)
      let targetElement = null;
      let targetFrame = null;

      try {
        // 메인 페이지에서 먼저 시도
        targetElement = await this.page.waitForSelector(targetSelector, { state: 'visible', timeout: 3000 });
        console.log(`✅ 메인 페이지에서 대상 요소 발견: ${targetSelector}`);
      } catch (error) {
        // iframe에서 시도
        const frames = await this.page.frames();
        for (const frame of frames) {
          try {
            targetElement = await frame.waitForSelector(targetSelector, { state: 'visible', timeout: 3000 });
            if (targetElement) {
              targetFrame = frame;
              console.log(`✅ iframe에서 대상 요소 발견: ${targetSelector} (frame: ${frame.url()})`);
              break;
            }
          } catch (frameError) {
            continue;
          }
        }
      }

      if (!targetElement) {
        throw new Error(`대상 요소를 찾을 수 없습니다: ${targetSelector}`);
      }

      // 파일 드래그 앤 드롭 시뮬레이션
      const fileInput = await (targetFrame || this.page).evaluateHandle(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';
        document.body.appendChild(input);
        return input;
      });

      // 파일 설정
      await fileInput.setInputFiles(filePath);

      // 드래그 앤 드롭 이벤트 시뮬레이션
      const boundingBox = await targetElement.boundingBox();
      if (!boundingBox) {
        throw new Error('대상 요소의 위치를 가져올 수 없습니다');
      }

      const centerX = boundingBox.x + boundingBox.width / 2;
      const centerY = boundingBox.y + boundingBox.height / 2;

      // 드래그 앤 드롭 이벤트 발생
      await (targetFrame || this.page).evaluate(
        ({ selector, fileName, fileBuffer, centerX, centerY }) => {
          const element = document.querySelector(selector);
          if (!element) return false;

          // File 객체 생성
          const file = new File([new Uint8Array(fileBuffer as number[])], fileName, {
            type: fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ? 'image/jpeg' :
                  fileName.endsWith('.png') ? 'image/png' :
                  fileName.endsWith('.gif') ? 'image/gif' :
                  fileName.endsWith('.webp') ? 'image/webp' : 'image/*'
          });

          // 드래그 앤 드롭 이벤트들
          const dataTransfer = new DataTransfer();
          dataTransfer.files.constructor.prototype.item = function(index: number) { return this[index]; };
          Object.defineProperty(dataTransfer, 'files', {
            value: Object.assign([file], {
              item: (index: number) => index === 0 ? file : null,
              length: 1
            }),
            writable: false
          });

          // 드래그 시작
          const dragEnterEvent = new DragEvent('dragenter', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
          });
          
          const dragOverEvent = new DragEvent('dragover', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
          });
          
          const dropEvent = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
          });

          // 이벤트 순차 발생
          element.dispatchEvent(dragEnterEvent);
          element.dispatchEvent(dragOverEvent);
          element.dispatchEvent(dropEvent);

          console.log(`✅ 드래그 앤 드롭 이벤트 발생 완료: ${fileName}`);
          return true;
        },
        { 
          selector: targetSelector, 
          fileName, 
          fileBuffer: Array.from(fileBuffer),
          centerX,
          centerY
        }
      );

      // 파일 입력 요소 정리
      await fileInput.dispose();

      console.log(`✅ 파일 드래그 앤 드롭 완료: ${fileName}`);
      return true;

    } catch (error) {
      console.error(`❌ 파일 드래그 앤 드롭 실패:`, error);
      return false;
    }
  }
}

// 싱글톤 인스턴스
const playwrightService = new PlaywrightService();

// IPC 핸들러 등록
export function registerPlaywrightHandlers() {
  // 브라우저 초기화
  ipcMain.handle('playwright-initialize', async () => {
    try {
      const result = await playwrightService.initialize();
      return { success: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // 페이지 이동
  ipcMain.handle('playwright-navigate', async (event: any, url: string) => {
    try {
      const result = await playwrightService.navigateToUrl(url);
      return { success: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // 현재 URL 가져오기
  ipcMain.handle('playwright-get-url', async () => {
    try {
      const url = await playwrightService.getCurrentUrl();
      return { success: true, url };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // 요소 클릭
  ipcMain.handle('playwright-click', async (event: any, selector: string) => {
    try {
      const result = await playwrightService.clickElement(selector);
      return { success: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // 입력 필드 채우기
  ipcMain.handle('playwright-fill', async (event: any, selector: string, value: string) => {
    try {
      const result = await playwrightService.fillInput(selector, value);
      return { success: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // 요소 대기
  ipcMain.handle('playwright-wait-selector', async (event: any, selector: string, timeout?: number) => {
    try {
      const result = await playwrightService.waitForSelector(selector, timeout);
      return { success: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // 시간 대기
  ipcMain.handle('playwright-wait-timeout', async (event: any, milliseconds: number) => {
    try {
      await playwrightService.waitForTimeout(milliseconds);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // JavaScript 실행
  ipcMain.handle('playwright-evaluate', async (event: any, script: string) => {
    try {
      const result = await playwrightService.evaluateScript(script);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // iframe 내부 요소 클릭
  ipcMain.handle('playwright-click-in-frames', async (event: any, selector: string, frameUrlPattern?: string) => {
    try {
      const result = await playwrightService.clickElementInFrames(selector, frameUrlPattern);
      return { success: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // iframe 내부에서 스크립트 실행
  ipcMain.handle('playwright-evaluate-in-frames', async (event: any, script: string, frameUrlPattern?: string) => {
    try {
      const result = await playwrightService.evaluateScriptInFrames(script, frameUrlPattern);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // 실제 키보드 타이핑
  ipcMain.handle('playwright-type', async (event: any, text: string, delay?: number) => {
    try {
      const result = await playwrightService.typeText(text, delay);
      return { success: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // 실제 키 누르기
  ipcMain.handle('playwright-press', async (event: any, key: string) => {
    try {
      const result = await playwrightService.pressKey(key);
      return { success: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // 실제 마우스 클릭
  ipcMain.handle('playwright-click-at', async (event: any, x: number, y: number) => {
    try {
      const result = await playwrightService.clickAt(x, y);
      return { success: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // 클립보드에 텍스트 설정
  ipcMain.handle('playwright-set-clipboard', async (event: any, text: string) => {
    try {
      const result = await playwrightService.setClipboard(text);
      return { success: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // 클립보드에 HTML 설정
  ipcMain.handle('playwright-set-clipboard-html', async (event: any, html: string) => {
    try {
      const result = await playwrightService.setClipboardHTML(html);
      return { success: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // 파일 드래그 앤 드롭
  ipcMain.handle('playwright-drag-drop-file', async (event: any, filePath: string, targetSelector: string) => {
    try {
      const result = await playwrightService.dragAndDropFile(filePath, targetSelector);
      return { success: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // 브라우저 정리
  ipcMain.handle('playwright-cleanup', async () => {
    try {
      await playwrightService.cleanup();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}

export { playwrightService };