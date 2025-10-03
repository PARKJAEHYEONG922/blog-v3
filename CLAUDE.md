# 블로그 자동화 V3 - 코드베이스 분석 및 개선 가이드

**최종 업데이트**: 2025-10-03
**현재 버전**: 3.0.7
**총 파일**: 104개 TypeScript/TSX
**총 코드**: 23,228줄

⚠️ **중요**: 다음 파일들은 복잡도가 높아 건드리지 않기로 결정
- `naver-automation.ts` (3,174줄) - Playwright 세션 관리 복잡
- `ImageGenerator.tsx` (1,824줄) - 15개 상태 복잡한 연결
- `NaverPublishUI.tsx` (1,559줄) - 실시간 UI 업데이트 로직

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

### ⏭️ 건드리지 않기로 결정한 파일들

**이유**: 복잡도가 높고 제대로 작동 중이므로 수정 시 리스크가 큼

1. **naver-automation.ts** (3,174줄)
   - Playwright 세션 관리 복잡
   - 분리 시 page 인스턴스 공유 문제
   - 현재 안정적으로 작동 중

2. **ImageGenerator.tsx** (1,824줄)
   - 15개 상태가 복잡하게 연결됨
   - 크롭, AI 생성, 히스토리 등 강하게 결합
   - 분리 시 상태 관리 복잡도 증가

3. **NaverPublishUI.tsx** (1,559줄)
   - 실시간 UI 업데이트 로직
   - 발행 상태 콜백 처리
   - 현재 안정적으로 작동 중

---

### 🟡 우선순위 1: LLMSettings.tsx 리팩토링 (2시간)

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

### 🟢 우선순위 2: 타입 정의 추가 통합 (1시간)

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

### 🟢 우선순위 3: 공통 상수 추출 (1시간)

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

### ✅ Step 3 플랫폼 기반 구조 리팩토링 (완료 - 2025-10-03)
- **Before**: 파일들이 shared와 03-publish에 분산
- **After**: `03-publish/platforms/naver/` 플랫폼별 폴더 구조
- **효과**:
  - Step 1, 2, 3 구조 일관성 확보
  - 티스토리, 구글 블로그 확장 용이
  - base-automation을 공통 서비스로 분리
- **커밋**: `27c38cd`, `be63384`

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

| 작업 | 예상 시간 | 효과 | 우선순위 | 상태 |
|------|----------|------|----------|------|
| ~~naver-automation.ts~~ | ~~2-3시간~~ | - | ⏭️ 스킵 | 건드리지 않음 |
| ~~ImageGenerator~~ | ~~4-5시간~~ | - | ⏭️ 스킵 | 건드리지 않음 |
| ~~NaverPublishUI~~ | ~~3시간~~ | - | ⏭️ 스킵 | 건드리지 않음 |
| LLMSettings 분리 | 2시간 | 확장성 ⬆️ | 🟡 중간 | 다음 작업 |
| 타입 통합 | 1시간 | 타입 안정성 ⬆️ | 🟢 낮음 | 대기 |
| 상수 추출 | 1시간 | 유지보수성 ⬆️ | 🟢 낮음 | 대기 |
| **총 예상** | **4시간** | **안정성 유지하며 개선** | | |

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
