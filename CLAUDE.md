# 블로그 자동화 V3 - 프로젝트 가이드

**최종 업데이트**: 2025-10-04
**현재 버전**: 3.0.7
**총 파일**: 104개 TypeScript/TSX
**총 코드**: ~23,000줄

---

## 📂 프로젝트 구조

```
blog-automation-v3/
├── src/
│   ├── 01-setup/              # Step 1: 키워드/트렌드 분석
│   │   ├── components/        (11개) UI 컴포넌트
│   │   ├── hooks/            useSetup.ts
│   │   ├── services/         (6개) 비즈니스 로직
│   │   └── types/            setup.types.ts
│   │
│   ├── 02-generation/         # Step 2: 콘텐츠 생성/편집
│   │   ├── components/
│   │   │   ├── ImageGenerator.tsx (1,824줄) ⚠️
│   │   │   ├── GenerationContainer.tsx
│   │   │   └── WorkSummary.tsx
│   │   ├── hooks/            (5개) 전문화된 훅
│   │   ├── services/         (2개)
│   │   └── types/            generation.types.ts
│   │
│   ├── 03-publish/            # Step 3: 발행
│   │   └── platforms/
│   │       └── naver/
│   │           ├── components/
│   │           │   └── NaverPublishUI.tsx (1,559줄) ⚠️
│   │           └── services/
│   │               ├── naver-automation.ts (3,174줄) ⚠️⚠️
│   │               └── naver-publisher.ts
│   │
│   ├── app/                   # React 루트
│   │   ├── app.tsx
│   │   ├── WorkflowContext.tsx
│   │   └── DialogContext.tsx
│   │
│   ├── main/                  # Electron Main Process
│   │   ├── index.ts          (544줄) IPC 라우터
│   │   ├── preload.ts        IPC 보안 브릿지
│   │   └── services/         (7개) 실제 로직
│   │       ├── app-service.ts
│   │       ├── cookie-service.ts
│   │       ├── file-service.ts
│   │       ├── settings-service.ts
│   │       ├── config-service.ts
│   │       ├── naver-trend-api-service.ts
│   │       └── image-service.ts
│   │
│   ├── features/              # 기능별 모듈
│   │   └── settings/
│   │       ├── components/
│   │       │   ├── LLMSettings.tsx (1,104줄) ⚠️
│   │       │   └── UpdateModal.tsx
│   │       ├── hooks/
│   │       └── services/
│   │
│   └── shared/                # 공통 모듈
│       ├── components/        (15개) 공통 UI
│       ├── hooks/            (6개) 커스텀 훅
│       ├── services/
│       │   ├── automation/
│       │   │   ├── base-automation.ts
│       │   │   ├── playwright-service.ts
│       │   │   └── claude-web-service.ts
│       │   ├── llm/          (9개) LLM 클라이언트
│       │   ├── content/      (4개) 콘텐츠 생성
│       │   └── storage/      storage-service.ts
│       ├── types/            (5개) 타입 정의
│       └── utils/            (7개) 헬퍼 함수
│
├── assets/                    아이콘, 이미지
├── scripts/                   빌드 스크립트
├── .husky/                    Git hooks
├── package.json
├── tsconfig.json
└── webpack.config.js
```

---

## 🎯 개선 우선순위 (중요도 순)

### 🔴 높음 - 즉시 수정 필요

#### 1. 타입 안정성 문제 (4-6시간)
**문제**: `any` 타입 32개 파일, 121회 사용
**영향**: 타입 안정성 저하, 런타임 오류 가능성

**주요 위치:**
- `src/app/app.tsx` - updateInfo 상태
- `src/shared/hooks/useApi.ts` - 제네릭 타입 미사용
- `src/main/services/config-service.ts` - store 타입
- `src/shared/types/electron.types.ts` - IPC 타입들

**개선 방안:**
```typescript
// Before
const [updateInfo, setUpdateInfo] = useState<any>(null);

// After
interface UpdateInfo {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  publishedAt: string;
}
const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
```

#### 2. 메모리 누수 가능성 (2-3시간)
**문제**: `setTimeout`/`setInterval` 33개 발생, 정리 누락

**주요 위치:**
- `src/01-setup/hooks/useSetup.ts:324` - 이미지 프롬프트 생성
- `src/shared/utils/retry.ts` - 재시도 로직

**개선 방안:**
```typescript
// Before
setTimeout(async () => {
  const result = await someAsyncOperation();
}, 1000);

// After
useEffect(() => {
  const timer = setTimeout(async () => {
    const result = await someAsyncOperation();
  }, 1000);

  return () => clearTimeout(timer);
}, [deps]);
```

#### 3. 에러 처리 불완전 (3-4시간)
**문제**: Promise 에러 처리 누락, 사용자 알림 부재

**개선 방안:**
```typescript
// Before
try {
  const result = await apiCall();
} catch (error) {
  console.error(error);
}

// After
try {
  const result = await withRetry(
    () => apiCall(),
    { maxRetries: 3, delayMs: 1000 }
  );
} catch (error) {
  handleError(error, 'API 호출 실패');
  showAlert({ type: 'error', message: getErrorMessage(error) });
}
```

---

### 🟡 중간 - 다음 작업

#### 4. useCallback/useMemo 최적화 (2-3시간)
**문제**: `useMemo` 0회 사용, 성능 최적화 기회 놓침

**개선 방안:**
```typescript
// useGeneration.ts
const fontSizes = useMemo(() => [
  { name: '대제목 (24px)', size: '24px', weight: 'bold' },
  { name: '소제목 (19px)', size: '19px', weight: 'bold' },
  // ...
], []);

// useSetup.ts
const filteredStyles = useMemo(() =>
  savedWritingStyles.filter(style => style.name.includes(searchTerm)),
  [savedWritingStyles, searchTerm]
);
```

#### 5. 중복 코드 패턴 (3-4시간)
**문제**: 에러 처리, 상태 관리 패턴 중복

**개선 방안:**
```typescript
// 공통 에러 처리 래퍼
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, context);
    showAlert({ type: 'error', message: getErrorMessage(error) });
    return null;
  }
}
```

#### 6. console.log 과다 사용 (2시간)
**문제**: 38개 파일, 683개 발생

**개선 방안:**
```typescript
// logger.ts
export const logger = {
  debug: (msg: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${msg}`, ...args);
    }
  },
  info: (msg: string, ...args: any[]) => {
    console.log(`[INFO] ${msg}`, ...args);
  },
  error: (msg: string, error?: Error) => {
    console.error(`[ERROR] ${msg}`, error);
  }
};
```

#### 7. Deprecated 함수 정리 (1시간)
**위치:**
- `src/shared/utils/error-handler.ts:166` - `showErrorAlert`
- `src/shared/services/storage/storage-service.ts:261,342` - 계정/보드 저장

---

### 🟢 낮음 - 여유 있을 때

#### 8. 클래스명 동적 생성 최적화 (2시간)
**개선**: `clsx` 라이브러리 도입

```typescript
// Before
className={`flex items-center ${active ? 'bg-blue-500' : 'bg-gray-200'}`}

// After
import clsx from 'clsx';
className={clsx('flex items-center', active ? 'bg-blue-500' : 'bg-gray-200')}
```

#### 9. 인라인 스타일 제거 (2-3시간)
**문제**: 8개 파일, 103개 발생

#### 10. TODO 주석 처리 (2-3시간)
**위치:**
- `src/main/index.ts:335` - API 테스트 로직 분리
- `src/shared/components/error/ErrorBoundary.tsx:46` - 원격 로깅
- `src/02-generation/components/ImageGenerator.tsx:421` - saveFile API

#### 11. 접근성 개선 (3-4시간)
**개선**: `aria-label`, 키보드 네비게이션 지원

---

## ⚡ Electron 구조

### 2개 프로세스 아키텍처

```
┌─────────────────────────────────────┐
│  Main Process (Node.js)             │
│  ✅ 파일 시스템                      │
│  ✅ 네트워크 요청                    │
│  ✅ API 키 보관                      │
│  ✅ Playwright 실행                  │
├─────────────────────────────────────┤
│         IPC 통신 (보안 브릿지)       │
├─────────────────────────────────────┤
│  Renderer Process (Browser)         │
│  ✅ React UI                         │
│  ❌ 파일 접근 불가                   │
│  ⚠️  보안 샌드박스                   │
└─────────────────────────────────────┘
```

### IPC 통신 흐름

```typescript
// 1. Renderer (React)
const result = await window.electronAPI.testLLMConfig({
  provider: 'openai',
  apiKey: 'sk-...'
});

// 2. Preload (보안 브릿지)
contextBridge.exposeInMainWorld('electronAPI', {
  testLLMConfig: (config) => ipcRenderer.invoke('llm:test-config', config)
});

// 3. Main (IPC 라우터)
ipcMain.handle('llm:test-config', async (event, config) => {
  return await settingsService.testAPIConfig(config);
});

// 4. Service (실제 로직)
async testAPIConfig(config) {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${config.apiKey}` }
  });
  return response.ok ? { success: true } : { success: false };
}
```

### IPC 핸들러 목록 (30개)

| 카테고리 | 채널 | 서비스 |
|---------|------|--------|
| **LLM** | `llm:test-config`, `llm:get-settings`, `llm:save-settings` | settings-service.ts |
| **파일** | `file:save-document`, `file:load-documents`, `file:delete-document` | file-service.ts |
| **네이버** | `naver:get-cookies`, `naver:save-cookies`, `naver:get-trends` | cookie-service.ts, naver-trend-api-service.ts |
| **이미지** | `image:generate-prompts`, `image:generate` | image-service.ts |
| **앱** | `app:get-version`, `app:check-for-updates` | app-service.ts |

---

## 🚀 최근 리팩토링 완료

### ✅ TypeScript 타입 체크 자동화 (2025-10-04)
- Husky + lint-staged 설정
- 커밋 전 자동 타입 체크
- 타입 에러 시 커밋 차단

### ✅ UseSetupReturn 인터페이스 수정 (2025-10-04)
- 실제 반환값과 인터페이스 일치
- 76줄 → 42줄 (34줄 감소)
- TypeScript strict 체크 통과

### ✅ Step 3 플랫폼 기반 구조 (2025-10-03)
- `03-publish/platforms/naver/` 폴더 구조
- 티스토리, 구글 블로그 확장 용이

### ✅ main/index.ts 서비스 분리
- 1,323줄 → 544줄 (59% 감소)
- 5개 서비스로 분리

### ✅ useGeneration 훅 분리
- 772줄 → 259줄 (67% 감소)
- 4개 전문 훅으로 분리

---

## 📈 개선 작업 우선순위 요약

| 순위 | 항목 | 중요도 | 시간 | 즉시 착수 |
|------|------|--------|------|-----------|
| 1 | 타입 안정성 (any 제거) | 🔴 | 4-6h | ✅ |
| 2 | 메모리 누수 방지 | 🔴 | 2-3h | ✅ |
| 3 | 에러 처리 강화 | 🔴 | 3-4h | ✅ |
| 4 | 성능 최적화 (useMemo) | 🟡 | 2-3h | - |
| 5 | 중복 코드 제거 | 🟡 | 3-4h | - |
| 6 | 로깅 시스템 개선 | 🟡 | 2h | - |
| 7 | Deprecated 정리 | 🟡 | 1h | - |
| 8 | className 최적화 | 🟢 | 2h | - |
| 9 | 인라인 스타일 제거 | 🟢 | 2-3h | - |
| 10 | TODO 처리 | 🟢 | 2-3h | - |
| 11 | 접근성 개선 | 🟢 | 3-4h | - |

**총 예상 시간**: 26-37시간

---

## 🎯 권장 작업 순서

### Phase 1 (1주차) - 안정성 확보
1. ✅ 타입 안정성 개선 (any 타입 제거)
2. ✅ 메모리 누수 방지
3. ✅ 에러 처리 강화

### Phase 2 (2주차) - 기술부채 해소
4. 성능 최적화 (useMemo 도입)
5. 중복 코드 제거
6. 로깅 시스템 개선
7. Deprecated 함수 정리

### Phase 3 (3주차) - 코드 품질 향상
8. className 최적화
9. 인라인 스타일 제거
10. TODO 주석 처리
11. 접근성 개선

---

## ⚠️ 건드리지 않기로 결정한 파일

**이유**: 복잡도가 높고 안정적으로 작동 중

1. **naver-automation.ts** (3,174줄)
   - Playwright 세션 관리 복잡
   - page 인스턴스 공유 문제

2. **ImageGenerator.tsx** (1,824줄)
   - 15개 상태 강하게 결합
   - 크롭, AI 생성, 히스토리

3. **NaverPublishUI.tsx** (1,559줄)
   - 실시간 UI 업데이트
   - 발행 상태 콜백

---

## 📝 코딩 원칙

### 파일 크기 가이드라인
- ✅ **양호**: 500줄 이하
- ⚠️ **주의**: 500-1000줄
- 🔴 **개선 필요**: 1000줄 이상

### 컴포넌트 분리 기준
- State 5개 이상 → 분리 검토
- 독립적 기능 2개 이상 → 분리
- 200줄 이상 → 재사용 부분 분리

---

## 🔍 기술 스택

**Core**: Electron 38.x, React 18, TypeScript 5.x, Webpack 5
**Automation**: Playwright (Chromium)
**AI/LLM**: OpenAI, Claude, Gemini, Runware
**UI**: Tailwind CSS, React Image Crop

---

**Last Updated**: 2025-10-04
**Maintainer**: Claude Code Assistant
