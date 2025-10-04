import * as https from 'https';
import { ConfigService } from './config-service';
import { handleError } from '../../shared/utils/error-handler';

/**
 * 트렌드 키워드
 */
export interface TrendKeyword {
  keyword: string;
  rank: number;
  rankChange: number | null;
}

/**
 * 트렌드 콘텐츠
 */
export interface TrendContent {
  metaUrl: string;
  title: string;
  myContent: boolean;
}

/**
 * API 응답 (트렌드)
 */
export interface TrendAPIResponse {
  trends?: TrendKeyword[];
  needsLogin?: boolean;
  error?: string;
}

/**
 * API 응답 (콘텐츠)
 */
export interface ContentAPIResponse {
  contents?: TrendContent[];
  needsLogin?: boolean;
  error?: string;
}

/**
 * 네이버 트렌드 API 서비스
 */
export class NaverTrendAPIService {
  private configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  /**
   * 네이버 크리에이터 어드바이저 트렌드 가져오기
   */
  async getTrends(category?: string, limit: number = 20, date?: string): Promise<TrendAPIResponse> {
    try {
      // 쿠키 확인
      const cookies = this.configService.getNaverCookies();
      if (!cookies) {
        return { needsLogin: true };
      }

      // 날짜 설정 (전달받은 날짜 또는 어제)
      let dateStr: string;
      if (date) {
        dateStr = date;
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        dateStr = yesterday.toISOString().split('T')[0];
      }

      // 카테고리 설정
      const categories = [
        { name: '비즈니스·경제', value: '비즈니스·경제' },
        { name: 'IT·컴퓨터', value: 'IT·컴퓨터' },
        { name: '일상·생각', value: '일상·생각' },
        { name: '육아·결혼', value: '육아·결혼' },
        { name: '요리·레시피', value: '요리·레시피' },
        { name: '패션·미용', value: '패션·미용' },
        { name: '음악', value: '음악' },
        { name: '영화·드라마', value: '영화·드라마' }
      ];

      const selectedCategory = category || categories[0].value;
      const encodedCategory = encodeURIComponent(selectedCategory);

      // API URL
      const url = `https://creator-advisor.naver.com/api/v6/trend/category?categories=${encodedCategory}&contentType=text&date=${dateStr}&hasRankChange=true&interval=day&limit=${limit}&service=naver_blog`;

      console.log('🔥 네이버 트렌드 API 호출:', url);

      // API 호출
      return new Promise((resolve) => {
        https
          .get(
            url,
            {
              headers: {
                accept: 'application/json',
                'accept-language': 'ko-KR,ko;q=0.9',
                cookie: cookies,
                referer: 'https://creator-advisor.naver.com/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            },
            (res) => {
              let data = '';
              res.on('data', (chunk) => {
                data += chunk;
              });
              res.on('end', async () => {
                console.log('📥 응답 상태:', res.statusCode);

                if (res.statusCode === 401 || res.statusCode === 403) {
                  // 쿠키 만료
                  this.configService.deleteNaverCookies();
                  console.log('✅ 만료된 쿠키 삭제');
                  resolve({ needsLogin: true });
                  return;
                }

                if (res.statusCode !== 200) {
                  resolve({ error: `API 호출 실패: ${res.statusCode}` });
                  return;
                }

                try {
                  const json = JSON.parse(data);

                  // 트렌드 키워드 추출
                  const trends: TrendKeyword[] = [];

                  if (json.data && Array.isArray(json.data)) {
                    for (const categoryData of json.data) {
                      if (categoryData.queryList && Array.isArray(categoryData.queryList)) {
                        for (const item of categoryData.queryList) {
                          trends.push({
                            keyword: item.query || item.keyword || item.title || '키워드 없음',
                            rank: item.rank || trends.length + 1,
                            rankChange: item.rankChange !== undefined ? item.rankChange : null
                          });

                          if (trends.length >= limit) break;
                        }
                      }
                      if (trends.length >= limit) break;
                    }
                  }

                  console.log(`✅ 트렌드 ${trends.length}개 가져오기 완료`);
                  resolve({ trends });
                } catch (error) {
                  resolve({ error: 'JSON 파싱 실패' });
                }
              });
            }
          )
          .on('error', (error) => {
            handleError(error, 'API 호출 오류');
            resolve({ error: error.message });
          });
      });
    } catch (error) {
      handleError(error, '네이버 트렌드 가져오기 실패');
      return { error: (error as Error).message };
    }
  }

  /**
   * 네이버 트렌드 콘텐츠 가져오기 (특정 키워드의 상위 블로그 글 목록)
   */
  async getTrendContents(keyword: string, date: string, limit: number = 20): Promise<ContentAPIResponse> {
    try {
      console.log('🔍 트렌드 콘텐츠 요청:', { keyword, date, limit });

      // 쿠키 확인
      const cookies = this.configService.getNaverCookies();
      if (!cookies) {
        console.log('❌ 쿠키가 없습니다!');
        return { needsLogin: true };
      }

      console.log('✅ 쿠키 로드 완료, 길이:', cookies.length);

      // URL 인코딩
      const encodedKeyword = encodeURIComponent(keyword);
      const url = `https://creator-advisor.naver.com/api/v6/trend/trend-contents?date=${date}&interval=day&keyword=${encodedKeyword}&limit=${limit}&service=naver_blog`;

      console.log('📊 네이버 트렌드 콘텐츠 API 호출:', url);

      // API 호출
      return new Promise((resolve) => {
        https
          .get(
            url,
            {
              headers: {
                accept: 'application/json',
                'accept-language': 'ko-KR,ko;q=0.9',
                cookie: cookies,
                referer: 'https://creator-advisor.naver.com/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            },
            (res) => {
              let data = '';
              res.on('data', (chunk) => {
                data += chunk;
              });
              res.on('end', async () => {
                console.log('📥 응답 상태:', res.statusCode);

                if (res.statusCode === 401 || res.statusCode === 403) {
                  // 쿠키 만료
                  this.configService.deleteNaverCookies();
                  console.log('✅ 만료된 쿠키 삭제');
                  resolve({ needsLogin: true });
                  return;
                }

                if (res.statusCode !== 200) {
                  resolve({ error: `API 호출 실패: ${res.statusCode}` });
                  return;
                }

                try {
                  const json = JSON.parse(data);

                  // 블로그 글 목록 추출
                  const contents: TrendContent[] = [];

                  if (json.data && Array.isArray(json.data)) {
                    for (const item of json.data) {
                      if (item.metaUrl && item.title) {
                        contents.push({
                          metaUrl: item.metaUrl,
                          title: item.title,
                          myContent: item.myContent || false
                        });
                      }

                      if (contents.length >= limit) break;
                    }
                  }

                  console.log(`✅ 블로그 글 ${contents.length}개 가져오기 완료`);
                  resolve({ contents });
                } catch (error) {
                  resolve({ error: 'JSON 파싱 실패' });
                }
              });
            }
          )
          .on('error', (error) => {
            handleError(error, 'API 호출 오류');
            resolve({ error: error.message });
          });
      });
    } catch (error) {
      handleError(error, '네이버 트렌드 콘텐츠 가져오기 실패');
      return { error: (error as Error).message };
    }
  }
}
