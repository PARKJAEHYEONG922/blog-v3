# 블로그 자동화 V3 - 모듈 구조 리팩토링 계획

**작업 시작**: 2025-10-05
**목표**: 멀티 모듈 지원 구조로 전환 (블로그 자동화 + 서로이웃 추가)

---

## 📋 리팩토링 계획

### 목표
- 블로그 자동화와 서로이웃 추가를 독립 모듈로 분리
- 공통 기능(Playwright, LLM, 로그, 설정) 재사용
- 좌측 사이드바로 모듈 전환
- 확장 가능한 구조

---

## 🎯 새로운 파일 구조

```
src/
├── App.tsx                          # 최상위 - 모드 전환 관리
│
├── shared/                          # 공통 기능
│   ├── components/
│   │   ├── Header.tsx              # 우측 상단 [로그] [API 설정]
│   │   ├── Sidebar.tsx             # 좌측 사이드바 네비게이션
│   │   ├── LogViewer.tsx           # 로그 모달 (기존)
│   │   └── ...
│   ├── services/
│   │   ├── playwright/             # Playwright 공용 서비스
│   │   ├── llm/                    # LLM 클라이언트 (기존)
│   │   ├── content/                # 콘텐츠 처리 (기존)
│   │   └── ...
│   ├── contexts/
│   │   ├── PlaywrightContext.tsx   # Playwright 세션 공유
│   │   └── DialogContext.tsx       # 다이얼로그 (기존)
│   ├── types/                      # 공통 타입
│   └── utils/                      # 공통 유틸
│
├── modules/
│   ├── blog-automation/            # 블로그 자동화 모듈
│   │   ├── BlogAutomationPage.tsx # 모듈 진입점
│   │   ├── 01-setup/              # 트렌드 분석 (기존)
│   │   ├── 02-edit/               # 글 작성/편집 (기존)
│   │   ├── 03-publish/            # 발행 (기존)
│   │   └── contexts/
│   │       └── WorkflowContext.tsx # 워크플로우 상태
│   │
│   └── neighbor-add/               # 서로이웃 추가 모듈 (신규)
│       ├── NeighborAddPage.tsx    # 모듈 진입점
│       ├── components/
│       ├── services/
│       └── hooks/
│
├── features/                        # 기존 features
│   └── settings/                   # LLM 설정
│
└── main/                           # Electron Main Process (기존)
```

---

## 📝 작업 단계

### Phase 1: 폴더 구조 생성
- [ ] `src/shared/components/` 폴더 생성
- [ ] `src/modules/blog-automation/` 폴더 생성
- [ ] `src/modules/neighbor-add/` 폴더 생성

### Phase 2: 공통 컴포넌트 분리
- [ ] `Header.tsx` 생성 (로그, API 설정 버튼)
- [ ] `Sidebar.tsx` 생성 (모듈 네비게이션)
- [ ] 기존 LogViewer 유지

### Phase 3: 블로그 자동화 모듈 이동
- [ ] `01-setup/` → `modules/blog-automation/01-setup/`
- [ ] `02-edit/` → `modules/blog-automation/02-edit/`
- [ ] `03-publish/` → `modules/blog-automation/03-publish/`
- [ ] `app/WorkflowContext.tsx` → `modules/blog-automation/contexts/`
- [ ] `BlogAutomationPage.tsx` 생성 (통합 페이지)

### Phase 4: 임포트 경로 수정
- [ ] 모든 `../../01-setup/` → `../01-setup/` 수정
- [ ] 모든 `../../shared/` → `../../../shared/` 수정
- [ ] VSCode 찾기/바꾸기 활용

### Phase 5: App.tsx 모드 전환 로직
- [ ] 모듈 state 관리
- [ ] Sidebar 통합
- [ ] Header 통합
- [ ] 조건부 렌더링

### Phase 6: 서로이웃 추가 모듈 구현
- [ ] Python 코드 TypeScript 변환
- [ ] NeighborAddPage.tsx 구현
- [ ] UI 컴포넌트 작성
- [ ] Playwright 공용 서비스 활용

### Phase 7: 테스트 및 검증
- [ ] 블로그 자동화 기능 테스트
- [ ] 모듈 전환 테스트
- [ ] 빌드 확인
- [ ] TypeScript 에러 0개 확인

---

## 🔄 마이그레이션 맵

### 기존 → 새 경로

**블로그 자동화:**
```
src/01-setup/              → src/modules/blog-automation/01-setup/
src/02-edit/               → src/modules/blog-automation/02-edit/
src/03-publish/            → src/modules/blog-automation/03-publish/
src/app/WorkflowContext    → src/modules/blog-automation/contexts/
```

**공통 기능:**
```
src/shared/                → src/shared/ (유지)
src/features/settings/     → src/features/settings/ (유지)
src/main/                  → src/main/ (유지)
```

**신규 추가:**
```
src/shared/components/Header.tsx
src/shared/components/Sidebar.tsx
src/modules/neighbor-add/
```

---

## 📊 예상 변경 파일

- 폴더 이동: ~50개
- 임포트 수정: ~200-300곳
- 신규 파일: ~10개
- 예상 시간: 1시간

---

## 🎨 UI 구조

```
┌──────────┬─────────────────────────────────────┐
│          │  [📊 로그] [⚙️ API 설정]           │
│ 📝 블로그│─────────────────────────────────────│
│          │                                     │
│ 👥 이웃  │                                     │
│          │          메인 콘텐츠                │
│          │                                     │
│          │                                     │
└──────────┴─────────────────────────────────────┘
```

---

**작업 상태**: 계획 수립 완료, 실행 대기
**다음 단계**: Phase 1 - 폴더 구조 생성
