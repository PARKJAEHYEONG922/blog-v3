# 블로그 자동화 V3 - 프로젝트 가이드

**최종 업데이트**: 2025-10-04
**현재 버전**: 3.0.7
**TypeScript 에러**: 0개 ✅
**총 코드**: ~23,500줄 (103개 파일)

---

## 📂 프로젝트 구조

```
blog-automation-v3/
├── src/
│   ├── 01-setup/              # Step 1: 키워드/트렌드 분석
│   ├── 02-generation/         # Step 2: 콘텐츠 생성/편집
│   ├── 03-publish/            # Step 3: 발행
│   ├── app/                   # React 루트 + Context
│   ├── main/                  # Electron Main Process
│   ├── features/              # 기능별 모듈 (설정 등)
│   └── shared/                # 공통 모듈
│       ├── components/        UI 컴포넌트
│       ├── services/          LLM, 콘텐츠 생성
│       ├── types/             타입 정의
│       └── utils/             헬퍼 함수
```

---

## 🎯 주요 기능

### 1. 3단계 워크플로우
- **Step 1**: 네이버 트렌드 분석 → 키워드 추출 → AI 제목 생성 → 콘텐츠 생성
- **Step 2**: 콘텐츠 편집 → AI 이미지 생성 → 발행 플랫폼 선택
- **Step 3**: Playwright 자동화로 네이버 블로그 발행

### 2. 멀티 LLM 지원
- **글쓰기**: Claude, OpenAI GPT, Gemini
- **이미지**: Runware (Stable Diffusion)
- Factory 패턴으로 통합 관리

### 3. 네이버 블로그 자동화
- Playwright 기반 완전 자동화
- 로그인, 에디터 제어, 이미지 삽입
- 링크 카드 변환, 카테고리 설정
- 즉시/예약/임시저장 모드

---

## 🏗️ 아키텍처

### Electron 프로세스 분리
- **Main Process**: Playwright, 파일 시스템, IPC 핸들러
- **Renderer Process**: React UI, 상태 관리
- **Preload**: IPC 보안 브릿지

### 상태 관리
- Context API (WorkflowContext, DialogContext)
- 단계별 전문 훅 (useSetup, useGeneration, usePublish)

### 타입 안전성
- 모든 주요 데이터 구조에 TypeScript 인터페이스
- IPC 통신 타입 정의 완료
- any 타입 최소화 (65개, 주로 Playwright 동적 결과)

---

## 🔧 개발 가이드

### 새 기능 추가 시
1. 타입 정의: `src/*/types/*.types.ts`
2. 서비스 로직: `src/*/services/`
3. 훅 작성: `src/*/hooks/`
4. 컴포넌트: `src/*/components/`
5. 에러 처리: `handleError()` + `showAlert()`
6. cleanup: useEffect 정리 함수 필수

### 코드 스타일
- **Tailwind CSS**: 인라인 스타일 금지, Tailwind 클래스 사용
- **에러 처리**: try-catch + handleError 필수
- **메모리 관리**: useEffect cleanup, 이벤트 리스너 정리
- **타입**: 명시적 타입 정의 (any 최소화)

---

## 📋 핵심 파일

### 비즈니스 로직
- `naver-automation.ts` (3,174줄): Playwright 네이버 블로그 자동화
- `useSetup.ts`: Step 1 상태 관리
- `useGeneration.ts`: Step 2 전문 훅 조합

### LLM 클라이언트
- `llm-factory.ts`: 팩토리 패턴
- `claude-client.ts`, `openai-client.ts`, `gemini-client.ts`
- `runware-client.ts`: 이미지 생성

### 타입 정의
- `setup.types.ts`, `generation.types.ts`, `publishing.types.ts`
- `common.types.ts`: WorkflowData (전 단계 공유)
- `electron.types.ts`: IPC 타입

---

## 📚 주요 의존성

- Electron 33.2.1
- React 18.3.1
- Playwright 1.49.1
- Anthropic SDK 0.39.1
- OpenAI SDK 4.77.3
- Tailwind CSS 3.4.17

---

## ✅ 코드 품질

| 항목 | 상태 |
|------|------|
| TypeScript 에러 | 0개 ✅ |
| 메모리 누수 | 0개 ✅ |
| 에러 처리 | 통일됨 ✅ |
| 스타일 | Tailwind 통일 ✅ |

---

**작성자**: Claude Code
**마지막 검증**: 2025-10-04
