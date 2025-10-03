import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { app } from 'electron';
import { getDefaultSEOGuideContent } from '../../shared/services/content/default-seo-guide';

/**
 * 문서 타입
 */
export type DocumentType = 'writingStyle' | 'seoGuide';

/**
 * 저장된 문서 인터페이스
 */
export interface SavedDocument {
  id: string;
  name: string;
  content: string;
  filePath: string;
  createdAt: string;
}

/**
 * 임시 파일 저장 결과
 */
export interface TempFileSaveResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * 파일 관리 서비스
 */
export class FileService {
  /**
   * 문서 타입에 따른 폴더명 반환
   */
  private getFolderName(type: DocumentType): string {
    return type === 'writingStyle' ? 'WritingStyles' : 'SEOGuides';
  }

  /**
   * 문서 폴더 경로 반환
   */
  private getFolderPath(type: DocumentType): string {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, this.getFolderName(type));
  }

  /**
   * 의미있는 파일명 생성
   */
  private createMeaningfulFileName(type: DocumentType, name: string): string {
    const timestamp = Date.now();

    if (type === 'writingStyle') {
      return `블로그_말투_참고문서_${name}_${timestamp}.txt`;
    } else {
      return `네이버_블로그_SEO_최적화_가이드_${name}_${timestamp}.txt`;
    }
  }

  /**
   * 파일명에서 표시 이름 추출
   */
  private extractDisplayName(fileName: string, type: DocumentType): string {
    let displayName = fileName.replace(/\.txt$/, '');

    if (type === 'writingStyle') {
      const match = displayName.match(/^블로그_말투_참고문서_(.+)_\d+$/);
      if (match) {
        return match[1];
      }
    } else {
      const match = displayName.match(/^네이버_블로그_SEO_최적화_가이드_(.+)_\d+$/);
      if (match) {
        return match[1];
      }
    }

    return displayName;
  }

  /**
   * 문서 저장
   * @param type 문서 타입
   * @param name 문서 이름
   * @param content 문서 내용
   * @returns 저장된 파일 경로
   */
  async saveDocument(type: DocumentType, name: string, content: string): Promise<string> {
    const folderPath = this.getFolderPath(type);

    // 폴더 생성
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const fileName = this.createMeaningfulFileName(type, name);
    const filePath = path.join(folderPath, fileName);

    fs.writeFileSync(filePath, content, 'utf-8');

    console.log(`문서 파일 저장 완료: ${filePath}`);
    return filePath;
  }

  /**
   * 문서 목록 로드
   * @param type 문서 타입
   * @returns 문서 목록
   */
  async loadDocuments(type: DocumentType): Promise<SavedDocument[]> {
    try {
      const folderPath = this.getFolderPath(type);

      if (!fs.existsSync(folderPath)) {
        return [];
      }

      const files = fs.readdirSync(folderPath).filter((file) => file.endsWith('.txt'));
      const docs = files.map((file) => {
        const filePath = path.join(folderPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const stats = fs.statSync(filePath);
        const displayName = this.extractDisplayName(file, type);

        return {
          id: file,
          name: displayName,
          content,
          filePath,
          createdAt: stats.mtime.toISOString()
        };
      });

      console.log(`${type} 문서 로드 완료: ${docs.length}개`);
      return docs;
    } catch (error) {
      console.error(`${type} 문서 로드 실패:`, error);
      return [];
    }
  }

  /**
   * 문서 삭제
   * @param filePath 삭제할 파일 경로
   * @returns 삭제 성공 여부
   */
  async deleteDocument(filePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`문서 파일 삭제 완료: ${filePath}`);
        return true;
      } else {
        console.warn(`삭제할 파일이 존재하지 않음: ${filePath}`);
        return false;
      }
    } catch (error) {
      console.error(`파일 삭제 실패: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 기본 SEO 가이드 생성
   */
  async createDefaultSEOGuide(): Promise<void> {
    try {
      const seoGuidesPath = this.getFolderPath('seoGuide');

      // 폴더 생성
      if (!fs.existsSync(seoGuidesPath)) {
        fs.mkdirSync(seoGuidesPath, { recursive: true });
      }

      const defaultSEOFileName = '네이버_블로그_SEO_최적화_가이드_기본_template.txt';
      const defaultSEOFilePath = path.join(seoGuidesPath, defaultSEOFileName);

      // 현재 날짜 생성
      const today = new Date();
      const currentDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

      // 기본 SEO 가이드 생성/업데이트
      const defaultSEOContent = getDefaultSEOGuideContent(currentDate);
      fs.writeFileSync(defaultSEOFilePath, defaultSEOContent, 'utf-8');

      console.log('기본 SEO 가이드 문서 업데이트됨 (날짜: ' + currentDate + '):', defaultSEOFilePath);
    } catch (error) {
      console.error('기본 SEO 가이드 생성 실패:', error);
    }
  }

  /**
   * 임시 파일 저장
   * @param fileName 파일 이름
   * @param data 파일 데이터 (Uint8Array)
   * @returns 저장 결과
   */
  async saveTempFile(fileName: string, data: number[]): Promise<TempFileSaveResult> {
    try {
      console.log(`💾 임시 파일 저장 시작: ${fileName}`);

      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, fileName);

      // Uint8Array로 변환하여 파일 저장
      const buffer = Buffer.from(data);
      await fs.promises.writeFile(tempFilePath, buffer);

      console.log(`✅ 임시 파일 저장 완료: ${tempFilePath}`);
      return { success: true, filePath: tempFilePath };
    } catch (error) {
      console.error('임시 파일 저장 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 임시 파일 삭제
   * @param filePath 삭제할 파일 경로
   * @returns 삭제 결과
   */
  async deleteTempFile(filePath: string): Promise<TempFileSaveResult> {
    try {
      console.log(`🗑️ 임시 파일 삭제: ${filePath}`);
      await fs.promises.unlink(filePath);
      console.log(`✅ 임시 파일 삭제 완료: ${filePath}`);
      return { success: true };
    } catch (error) {
      console.error('임시 파일 삭제 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
