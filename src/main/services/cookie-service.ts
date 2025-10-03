import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

/**
 * 네이버 쿠키 관리 서비스
 */
export class CookieService {
  /**
   * 네이버 쿠키 파일 경로 반환
   */
  private getNaverCookiesPath(): string {
    return path.join(app.getPath('userData'), 'naver_cookies.txt');
  }

  /**
   * 네이버 쿠키 가져오기
   * @returns 쿠키 문자열 또는 null
   */
  async getCookies(): Promise<string | null> {
    const cookiesPath = this.getNaverCookiesPath();

    try {
      if (fs.existsSync(cookiesPath)) {
        const cookies = fs.readFileSync(cookiesPath, 'utf-8');
        console.log('✅ 네이버 쿠키 로드 완료');
        return cookies;
      }
      return null;
    } catch (error) {
      console.error('네이버 쿠키 로드 실패:', error);
      return null;
    }
  }

  /**
   * 네이버 쿠키 저장
   * @param cookies 저장할 쿠키 문자열
   * @returns 저장 성공 여부
   */
  async saveCookies(cookies: string): Promise<boolean> {
    const cookiesPath = this.getNaverCookiesPath();

    try {
      fs.writeFileSync(cookiesPath, cookies, 'utf-8');
      console.log('✅ 네이버 쿠키 저장 완료');
      return true;
    } catch (error) {
      console.error('네이버 쿠키 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 네이버 쿠키 삭제
   * @returns 삭제 성공 여부
   */
  async deleteCookies(): Promise<boolean> {
    const cookiesPath = this.getNaverCookiesPath();

    try {
      if (fs.existsSync(cookiesPath)) {
        fs.unlinkSync(cookiesPath);
        console.log('✅ 네이버 쿠키 삭제 완료');
      }
      return true;
    } catch (error) {
      console.error('네이버 쿠키 삭제 실패:', error);
      throw error;
    }
  }
}
