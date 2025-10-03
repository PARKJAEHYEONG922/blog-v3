# 블로그 자동화 V3 - 코드베이스 분석 및 개선 가이드

**최종 업데이트**: 2025-10-03
**현재 버전**: 3.0.7
**총 파일**: 104개 TypeScript/TSX
**총 코드**: 23,228줄

---

## 📂 현재 프로젝트 구조

```
blog-automation-v3/
├── src/
│   ├── 01-setup/           (20개 파일, 4,856줄)
│   │   ├── components/     (11개) - UI 컴포넌트
│   │   ├── hooks/          useSetup.ts (451줄)
│   │   ├── services/       (6개) - 비즈니스 로직
│   │   └── types/          setup.types.ts (13개 타입 통합)
│   │
│   ├── 02-generation/      (12개 파일, 5,089줄)
│   │   ├── components/     (3개)
│   │   │   ├── ImageGenerator.tsx (1,824줄) ⚠️
│   │   │   ├── GenerationContainer.tsx (713줄)
│   │   │   └── WorkSummary.tsx
│   │   ├── hooks/          (5개) - 전문화된 훅
│   │   │   ├── useGeneration.ts (259줄) ✅
│   │   │   ├── useContentEditor.ts (425줄) ✅
│   │   │   ├── useImageGeneration.ts
│   │   │   ├── useContentRefresh.ts
│   │   │   └── usePublish.ts
│   │   └── services/       (2개)
│   │
│   ├── 03-publish/         (6개 파일, 2,313줄)
│   │   ├── platforms/
│   │   │   ├── NaverPublishUI.tsx (1,559줄) ⚠️
│   │   │   └── PublishPlatformSection.tsx
│   │   └── services/
│   │       ├── naver-publisher.ts (473줄)
│   │       └── publish-manager.ts
│   │
│   ├── app/                (4개 파일, 449줄)
│   │   ├── app.tsx
│   │   ├── WorkflowContext.tsx
│   │   ├── DialogContext.tsx
│   │   └── index.ts
│   │
│   ├── main/               (7개 파일, 1,551줄) ✅ 리팩토링 완료
│   │   ├── index.ts (544줄) - IPC 라우팅
│   │   └── services/
│   │       ├── app-service.ts (267줄)
│   │       ├── cookie-service.ts (72줄)
│   │       ├── file-service.ts (243줄)
│   │       ├── naver-trend-api-service.ts (263줄)
│   │       └── settings-service.ts (224줄)
│   │
│   ├── features/           (5개 파일, 1,657줄)
│   │   └── settings/
│   │       ├── components/
│   │       │   ├── LLMSettings.tsx (1,104줄) ⚠️
│   │       │   └── UpdateModal.tsx (250줄)
│   │       ├── hooks/
│   │       └── services/
│   │
│   └── shared/             (49개 파일, 7,313줄)
│       ├── components/     (15개) - 공통 UI
│       ├── hooks/          (6개) - 커스텀 훅
│       ├── services/
│       │   ├── automation/
│       │   │   ├── naver-automation.ts (3,174줄) ⚠️⚠️
│       │   │   ├── playwright-service.ts (827줄)
│       │   │   └── claude-web-service.ts (629줄)
│       │   ├── llm/        (9개) - LLM 클라이언트
│       │   ├── content/    (4개) - 콘텐츠 생성
│       │   └── storage/    storage-service.ts
│       ├── types/          (5개) - 타입 정의
│       └── utils/          (7개) - 헬퍼 함수
│
├── assets/                 아이콘, 이미지
├── scripts/                빌드 스크립트
├── package.json
├── tsconfig.json
└── webpack.config.js
```

---

## 📊 파일 크기 분석 (500줄 이상)

| 순위 | 파일 | 줄 수 | 상태 | 우선순위 |
|------|------|-------|------|----------|
| 1 | shared/services/automation/naver-automation.ts | 3,174 | ⚠️ 매우 큼 | 🔴 높음 |
| 2 | 02-generation/components/ImageGenerator.tsx | 1,824 | ⚠️ 매우 큼 | 🔴 높음 |
| 3 | 03-publish/platforms/NaverPublishUI.tsx | 1,559 | ⚠️ 큼 | 🟡 중간 |
| 4 | features/settings/components/LLMSettings.tsx | 1,104 | ⚠️ 큼 | 🟡 중간 |
| 5 | shared/services/automation/playwright-service.ts | 827 | ✅ 양호 | 🟢 낮음 |
| 6 | 02-generation/components/GenerationContainer.tsx | 713 | ✅ 양호 | 🟢 낮음 |
| 7 | shared/services/automation/claude-web-service.ts | 629 | ✅ 양호 | 🟢 낮음 |
| 8 | main/index.ts | 544 | ✅ 리팩토링 완료 | ✅ 완료 |
| 9 | 02-generation/services/content-processor.ts | 530 | ✅ 양호 | 🟢 낮음 |
| 10 | 03-publish/services/naver-publisher.ts | 473 | ✅ 양호 | 🟢 낮음 |

---

## 🎯 개선 우선순위 (중요도 순)

### 🔴 우선순위 1: naver-automation.ts 주석 개선 (2-3시간)

**현재 상태**: 3,174줄, 주석 거의 없음

**문제점**:
- 단일 파일에 모든 네이버 자동화 로직 포함
- 함수 간 경계가 불명확
- 유지보수 시 코드 위치 찾기 어려움

**개선 방안**:
섹션별 주석 추가로 가독성 향상

```typescript
/**
 * ==========================================
 * 네이버 블로그 자동화 서비스
 * ==========================================
 *
 * [파일 구조]
 * 1. 🔐 로그인 및 세션 관리 (줄 1-400)
 * 2. 📝 글쓰기 페이지 진입 (줄 401-700)
 * 3. 📌 제목/카테고리 설정 (줄 701-1000)
 * 4. ✍️ 본문 콘텐츠 입력 (줄 1001-1500)
 * 5. 🖼️ 이미지 업로드 (줄 1501-2000)
 * 6. ⚙️ 발행 옵션 설정 (줄 2001-2500)
 * 7. ⏰ 예약 발행 (줄 2501-2800)
 * 8. ❌ 에러 처리 (줄 2801-3000)
 * 9. 🛠️ 유틸리티 함수 (줄 3001-3174)
 */

// ==========================================
// 1. 🔐 로그인 및 세션 관리
// ==========================================
/**
 * 네이버 로그인 처리
 * - 쿠키 기반 세션 유지
 * - 자동 로그인 재시도
 */
async login() { ... }

// ==========================================
// 2. 📝 글쓰기 페이지 진입
// ==========================================
/**
 * 블로그 글쓰기 페이지로 이동
 * - 스마트에디터 로딩 대기
 * - iframe 전환
 */
async navigateToEditor() { ... }
```

**예상 효과**:
- 코드 탐색 시간 50% 감소
- 신규 개발자 온보딩 시간 단축
- 버그 수정 시 관련 코드 빠른 위치 파악

---

### 🔴 우선순위 2: ImageGenerator.tsx 컴포넌트 분리 (4-5시간)

**현재 상태**: 1,824줄, 단일 컴포넌트

**문제점**:
- 15개 이상의 state 관리
- 이미지 생성, 크롭, 히스토리 등 여러 기능 혼재
- 재사용성 낮음

**개선 방안**:
기능별 컴포넌트 분리

```typescript
// 현재 (1,824줄)
export const ImageGenerator = () => {
  const [images, setImages] = useState(...);
  const [prompts, setPrompts] = useState(...);
  const [cropData, setCropData] = useState(...);
  const [history, setHistory] = useState(...);
  // ... 15개 이상의 state

  // 이미지 업로드, AI 생성, 크롭, 히스토리 모두 포함
  return (<div>... 1,824줄 ...</div>);
};

// 개선 후 (400줄 + 5개 컴포넌트)
ImageGenerator.tsx (400줄) - 메인 컨테이너
├── ImageUploader.tsx (200줄) - 업로드 기능
├── AIImageGenerator.tsx (300줄) - AI 생성
├── ImageCropper.tsx (250줄) - 크롭 모달
├── ImageHistory.tsx (180줄) - 히스토리
└── PromptEditor.tsx (150줄) - 프롬프트 편집
```

**분리 기준**:
1. **ImageUploader** - 로컬 파일 업로드, 드래그앤드롭
2. **AIImageGenerator** - AI 모델 선택, 프롬프트 생성
3. **ImageCropper** - 이미지 크롭 모달 (react-image-crop)
4. **ImageHistory** - 생성 히스토리 관리
5. **PromptEditor** - 프롬프트 수정 UI

**예상 효과**:
- 테스트 용이성 향상
- 각 기능 독립적 수정 가능
- 메모리 최적화 (React.memo 적용 가능)

---

### 🟡 우선순위 3: NaverPublishUI.tsx 구조 개선 (3시간)

**현재 상태**: 1,559줄

**문제점**:
- 발행 UI가 단일 파일에 모두 포함
- 즉시발행/예약발행 로직 혼재

**개선 방안**:
UI 컴포넌트 분리

```typescript
// 개선 후
NaverPublishUI.tsx (400줄) - 메인 컨테이너
├── PublishFormSection.tsx (300줄) - 발행 폼
├── ImmediatePublish.tsx (250줄) - 즉시 발행
├── ScheduledPublish.tsx (350줄) - 예약 발행
└── CategorySelector.tsx (200줄) - 카테고리 선택
```

---

### 🟡 우선순위 4: LLMSettings.tsx 리팩토링 (2시간)

**현재 상태**: 1,104줄

**문제점**:
- 4개 LLM 제공자 설정이 한 파일에
- API 테스트 로직 중복

**개선 방안**:
제공자별 설정 컴포넌트 분리

```typescript
// 개선 후
LLMSettings.tsx (300줄) - 메인
├── OpenAISettings.tsx (150줄)
├── ClaudeSettings.tsx (150줄)
├── GeminiSettings.tsx (150줄)
└── RunwareSettings.tsx (150줄)
```

---

### 🟢 우선순위 5: 타입 정의 추가 통합 (1시간)

**현재 상태**:
- `01-setup/types/setup.types.ts` ✅ 완료 (13개 타입)
- `02-generation/types/generation.types.ts` - 부분 정의
- `03-publish/types/publishing.types.ts` - 부분 정의

**개선 방안**:
각 단계별 타입 파일 통합

```typescript
// 02-generation/types/generation.types.ts (통합 완료 필요)
export interface GenerationState { ... }
export interface ImageGenerationConfig { ... }
export interface ContentEditorState { ... }
// ... 모든 generation 관련 타입

// 03-publish/types/publishing.types.ts (통합 완료 필요)
export interface PublishConfig { ... }
export interface ScheduleSettings { ... }
export interface NaverBlogConfig { ... }
// ... 모든 publishing 관련 타입
```

---

### 🟢 우선순위 6: 공통 상수 추출 (1시간)

**문제점**:
- 매직 넘버/문자열 코드 전체에 분산
- 에러 메시지 중복 정의

**개선 방안**:
상수 파일 생성

```typescript
// src/shared/constants/app-constants.ts
export const LLM_PROVIDERS = {
  OPENAI: 'openai',
  CLAUDE: 'claude',
  GEMINI: 'gemini',
  RUNWARE: 'runware'
} as const;

export const ERROR_MESSAGES = {
  API_KEY_MISSING: 'API 키가 설정되지 않았습니다',
  REQUEST_FAILED: 'LLM 요청 실패',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다'
} as const;

export const TIMEOUTS = {
  API_REQUEST: 30000,
  PAGE_LOAD: 10000,
  IMAGE_UPLOAD: 60000
} as const;
```

---

## 🚀 리팩토링 완료 내역

### ✅ main/index.ts 서비스 분리 (완료)
- **Before**: 1,323줄 (Fat Controller)
- **After**: 544줄 (Thin Router) + 5개 서비스
- **효과**: 59% 코드 감소, 테스트 가능성 향상

### ✅ useGeneration 훅 분리 (완료)
- **Before**: 772줄 (Monolithic Hook)
- **After**: 259줄 (Composition) + 4개 전문 훅
- **효과**: 67% 코드 감소, 관심사 분리

### ✅ setup 타입 통합 (완료)
- **Before**: 13개 파일에 분산
- **After**: setup.types.ts 1개 파일 통합
- **효과**: 타입 중복 제거, import 단순화

---

## 📈 개선 예상 효과

| 작업 | 예상 시간 | 효과 | 우선순위 |
|------|----------|------|----------|
| naver-automation.ts 주석 | 2-3시간 | 유지보수성 ⬆️ 50% | 🔴 높음 |
| ImageGenerator 분리 | 4-5시간 | 재사용성 ⬆️, 성능 ⬆️ | 🔴 높음 |
| NaverPublishUI 분리 | 3시간 | 가독성 ⬆️ | 🟡 중간 |
| LLMSettings 분리 | 2시간 | 확장성 ⬆️ | 🟡 중간 |
| 타입 통합 | 1시간 | 타입 안정성 ⬆️ | 🟢 낮음 |
| 상수 추출 | 1시간 | 유지보수성 ⬆️ | 🟢 낮음 |
| **총 예상** | **13-15시간** | **전체 품질 대폭 향상** | |

---

## 🏗️ 아키텍처 패턴

### 현재 적용된 패턴

1. **Feature-Based Architecture** ✅
   ```
   01-setup/     - 키워드/트렌드 분석
   02-generation/ - 콘텐츠 편집
   03-publish/    - 발행
   ```

2. **Service Layer Pattern** ✅
   ```
   main/
   ├── index.ts (IPC Router)
   └── services/ (Business Logic)
   ```

3. **Custom Hooks Composition** ✅
   ```
   useGeneration (메인)
   ├── useContentEditor
   ├── useImageGeneration
   ├── useContentRefresh
   └── usePublish
   ```

### 개선 필요 패턴

1. **Component Composition** ⚠️
   - 현재: 단일 거대 컴포넌트
   - 개선: 작은 재사용 가능 컴포넌트

2. **Constant Management** ⚠️
   - 현재: 매직 넘버/문자열 분산
   - 개선: 중앙화된 상수 관리

---

## 📝 코딩 원칙

### 파일 크기 가이드라인
- ✅ **양호**: 500줄 이하
- ⚠️ **주의**: 500-1000줄 (리팩토링 고려)
- 🔴 **개선 필요**: 1000줄 이상 (반드시 분리)

### 컴포넌트 분리 기준
- State가 5개 이상이면 분리 검토
- 2개 이상의 독립적 기능이 있으면 분리
- 200줄 이상이면 재사용 가능한 부분 분리

### 훅 분리 기준
- 단일 책임 원칙 (SRP)
- 300줄 이상이면 분리 검토
- 독립적으로 테스트 가능하도록

---

## 🔍 기술 스택

### Core
- **Runtime**: Electron 28.x
- **Framework**: React 18
- **Language**: TypeScript 5.x
- **Bundler**: Webpack 5

### Automation
- **Browser**: Playwright (Chromium)
- **Target**: 네이버 블로그, 티스토리

### AI/LLM
- OpenAI GPT-4
- Anthropic Claude
- Google Gemini
- Runware (이미지)

### UI/Styling
- Tailwind CSS
- React Image Crop

---

## 📚 참고사항

### Git 커밋 메시지 규칙
```
feat: 새로운 기능
fix: 버그 수정
refactor: 리팩토링
docs: 문서 수정
style: 코드 포맷팅
test: 테스트 추가
chore: 빌드/설정 변경
```

### 개발 워크플로우
1. 기능별 브랜치 생성
2. 코드 작성 및 테스트
3. 빌드 확인 (`npm start`)
4. 커밋 및 푸시
5. PR 리뷰 (선택)

### 주의사항
- ⚠️ 큰 파일 수정 시 반드시 백업
- ⚠️ 수정 후 즉시 빌드 테스트
- ⚠️ 커밋 메시지에 변경 내용 명확히
- ⚠️ 한 번에 하나의 기능만 수정

---

## 🎯 다음 단계 권장

### 단기 (1주일)
1. ✅ naver-automation.ts 주석 추가
2. ✅ 공통 상수 추출

### 중기 (2주일)
3. ✅ ImageGenerator 컴포넌트 분리
4. ✅ NaverPublishUI 리팩토링

### 장기 (1개월)
5. ✅ 전체 타입 정의 통합
6. ✅ Unit 테스트 추가
7. ✅ 에러 바운더리 강화
8. ✅ 성능 최적화 (React.memo, useMemo)

---

**Last Updated**: 2025-10-03
**Maintainer**: Claude Code Assistant
