import * as https from 'https';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { app, BrowserWindow } from 'electron';

/**
 * 업데이트 정보
 */
export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion?: string;
  latestVersion?: string;
  downloadUrl?: string;
  error?: string;
}

/**
 * 다운로드 결과
 */
export interface DownloadResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * 다운로드 진행 정보
 */
export interface DownloadProgress {
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
}

/**
 * 앱 관련 서비스 (버전, 업데이트)
 */
export class AppService {
  private mainWindow: BrowserWindow | null = null;

  /**
   * 메인 윈도우 설정
   */
  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  /**
   * 현재 앱 버전 반환
   */
  getVersion(): string {
    return app.getVersion();
  }

  /**
   * GitHub API로 최신 릴리즈 확인
   */
  async checkForUpdates(): Promise<UpdateInfo> {
    return new Promise((resolve) => {
      const options = {
        hostname: 'api.github.com',
        path: '/repos/PARKJAEHYEONG922/blog-automation-v2/releases',
        method: 'GET',
        headers: {
          'User-Agent': 'Blog-Automation-V3'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode === 404) {
              resolve({ hasUpdate: false, error: '릴리즈를 찾을 수 없습니다.' });
              return;
            }

            if (res.statusCode !== 200) {
              resolve({ hasUpdate: false, error: `GitHub API 오류: ${res.statusCode}` });
              return;
            }

            const releases = JSON.parse(data);

            // V3 릴리즈만 필터링 (v3.x.x 형태의 태그)
            const v3Releases = releases.filter((release: any) =>
              release.tag_name && release.tag_name.startsWith('v3.')
            );

            if (v3Releases.length === 0) {
              resolve({ hasUpdate: false, error: 'V3 릴리즈를 찾을 수 없습니다.' });
              return;
            }

            // 최신 V3 릴리즈
            const latestRelease = v3Releases[0];
            const latestVersion = latestRelease.tag_name?.replace('v', '') || latestRelease.name;
            const currentVersion = app.getVersion();

            // 다운로드 URL 찾기 (V3 setup.exe 파일)
            const setupAsset = latestRelease.assets?.find((asset: any) =>
              asset.name.includes('v3') && (asset.name.includes('Setup') || asset.name.includes('setup')) && asset.name.endsWith('.exe')
            );

            const hasUpdate = latestVersion !== currentVersion;

            resolve({
              hasUpdate,
              currentVersion,
              latestVersion,
              downloadUrl: setupAsset?.browser_download_url,
              error: hasUpdate && !setupAsset ? '설치 파일을 찾을 수 없습니다.' : undefined
            });
          } catch (error) {
            resolve({ hasUpdate: false, error: '응답 파싱 실패: ' + (error as Error).message });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ hasUpdate: false, error: '네트워크 오류: ' + error.message });
      });

      req.setTimeout(10000, () => {
        req.destroy();
        resolve({ hasUpdate: false, error: '요청 시간 초과' });
      });

      req.end();
    });
  }

  /**
   * 업데이트 다운로드 및 설치
   */
  async downloadUpdate(downloadUrl: string): Promise<DownloadResult> {
    try {
      console.log('📥 업데이트 다운로드 시작:', downloadUrl);

      // 임시 폴더에 파일 다운로드
      const tempDir = os.tmpdir();
      const fileName = downloadUrl.split('/').pop() || 'blog-automation-v3-setup.exe';
      const filePath = path.join(tempDir, fileName);

      // 기존 파일 삭제
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // 다운로드 진행
      const file = fs.createWriteStream(filePath);

      return new Promise((resolve) => {
        https.get(downloadUrl, (response) => {
          if (response.statusCode === 302 || response.statusCode === 301) {
            // 리다이렉트 처리
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
              this.handleDownload(redirectUrl, file, filePath, resolve);
            }
          } else if (response.statusCode === 200) {
            // 직접 다운로드
            this.handleDownload(downloadUrl, file, filePath, resolve);
          } else {
            console.error('❌ HTTP 오류:', response.statusCode);
            resolve({ success: false, error: `다운로드 실패: HTTP ${response.statusCode}` });
          }
        }).on('error', (err: any) => {
          console.error('❌ 다운로드 요청 실패:', err);
          resolve({ success: false, error: '다운로드 실패: ' + err.message });
        });
      });
    } catch (error) {
      console.error('❌ 업데이트 다운로드 실패:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 다운로드 처리 (헬퍼 메서드)
   */
  private handleDownload(
    url: string,
    file: fs.WriteStream,
    filePath: string,
    resolve: (value: DownloadResult) => void
  ): void {
    https.get(url, (response) => {
      const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
      let downloadedBytes = 0;

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const progress = Math.round((downloadedBytes / totalBytes) * 100);

        // 진행률 전송
        if (this.mainWindow && this.mainWindow.webContents) {
          this.mainWindow.webContents.send('download-progress', {
            progress,
            downloadedBytes,
            totalBytes
          });
        }
      });

      response.pipe(file);

      file.on('finish', async () => {
        file.close();
        console.log('✅ 다운로드 완료:', filePath);

        try {
          // 설치 프로그램 실행
          console.log('🚀 설치 프로그램 실행 중:', filePath);

          // 파일 존재 확인
          if (!fs.existsSync(filePath)) {
            throw new Error('설치 파일을 찾을 수 없습니다: ' + filePath);
          }

          // Windows에서 직접 실행
          const { exec } = require('child_process');
          exec(`"${filePath}"`, (error: any, stdout: any, stderr: any) => {
            if (error) {
              console.error('설치 프로그램 실행 오류:', error);
            } else {
              console.log('✅ 설치 프로그램 실행 성공');
            }
          });

          // 잠시 대기 후 현재 앱 종료
          setTimeout(() => {
            console.log('📱 현재 앱 종료...');
            app.quit();
          }, 3000);

          resolve({
            success: true,
            message: '다운로드 완료! 설치 프로그램이 시작됩니다.'
          });

        } catch (installError) {
          console.error('❌ 설치 실패:', installError);
          resolve({
            success: false,
            error: '설치 실행 실패: ' + (installError as Error).message
          });
        }
      });

      file.on('error', (err: any) => {
        fs.unlink(filePath, () => { });
        console.error('❌ 파일 쓰기 실패:', err);
        resolve({ success: false, error: '파일 저장 실패: ' + err.message });
      });
    }).on('error', (err: any) => {
      console.error('❌ 다운로드 요청 실패:', err);
      resolve({ success: false, error: '다운로드 실패: ' + err.message });
    });
  }
}
