export interface BlogPromptData {
  selectedTitle: string;
  mainKeyword: string;
  subKeywords: string;
  blogContent: string;
  writingStyleCount: number;
  hasSeoGuide: boolean;
}

export class BlogPromptService {
  /**
   * 제목 생성용 시스템 프롬프트
   */
  static getTitleGenerationSystemPrompt(): string {
    return `네이버 블로그 상위 노출에 유리한 '정보형' 스타일의 제목 10개를 추천해주세요.

**정보형 특징**:
- 유용한 정보와 지식을 제공하는 내용
- 독자의 문제 해결에 도움이 되는 실용적 정보
- 팁, 방법, 노하우 등의 실질적 가치 제공

**제목 생성 규칙**:
1. 현재 날짜를 참고하여 최신 트렌드 반영
2. 메인키워드를 자연스럽게 포함 (필수)
3. 보조키워드가 있다면 1-2개를 제목에 활용 (선택사항)
4. 클릭 유도와 궁금증 자극하는 표현 사용
5. 30-60자 내외 권장 (너무 길면 검색 결과에서 잘림)
6. 네이버 블로그 SEO 최적화
7. 주제에 맞는 자연스러운 표현 사용
8. 이모티콘 사용 금지 (텍스트만 사용)
9. 구체적 년도 표기 금지 ("최신", "현재" 등으로 대체)

**출력 형식**:
반드시 JSON 형태로 제목 10개만 반환해주세요:

{
  "titles": [
    "제목1",
    "제목2", 
    "제목3",
    "제목4",
    "제목5",
    "제목6",
    "제목7",
    "제목8",
    "제목9",
    "제목10"
  ]
}

각 제목은 정보형의 특성을 살리되, 서로 다른 접근 방식으로 다양하게 생성해주세요.`;
  }

  /**
   * 제목 생성용 유저 프롬프트
   */
  static getTitleGenerationUserPrompt(data: {
    mainKeyword: string;
    subKeywords: string;
    blogContent: string;
  }): string {
    const subKeywordList = data.subKeywords.split(',').map(k => k.trim()).filter(k => k);
    let userPrompt = "";

    // 0. 현재 날짜 정보 추가
    const now = new Date();
    const currentDate = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
    userPrompt += `**현재 날짜**: ${currentDate}\n\n`;

    // 1. 블로그 내용 (AI 역할 설정)
    if (data.blogContent.trim()) {
      userPrompt += `# AI 역할 설정\n${data.blogContent.trim()}\n\n`;
    }

    // 2. 메인키워드 (필수)
    userPrompt += `**메인키워드**: ${data.mainKeyword}`;

    // 3. 보조키워드 (있는 경우)
    if (subKeywordList.length > 0) {
      userPrompt += `\n**보조키워드**: ${subKeywordList.join(', ')}`;
    }
    
    // 4. 제목 생성 가이드 (보조키워드와 글 주제 유무에 따라 조건부)
    userPrompt += `\n\n**제목 생성 가이드**:`;
    
    if (subKeywordList.length > 0) {
      userPrompt += `\n- 보조키워드 중 1-2개씩 활용하여 다양한 제목 생성 (선택사항)`;
    }
    
    userPrompt += `\n- 메인키워드를 중심으로 다양한 관점에서 제목 생성
- 다양한 스타일로 생성: 방법 안내형, 후기형, 추천형, 비교형, 문제해결형 등`;
    
    if (data.blogContent.trim()) {
      userPrompt += `\n- 위 블로그 내용을 바탕으로 독자가 궁금해할 만한 관점에서 제목 생성`;
    } else {
      userPrompt += `\n- 독자가 궁금해할 만한 실용적인 관점에서 제목 생성`;
    }

    return userPrompt;
  }

  /**
   * Claude Web 서비스용 통합 프롬프트 (파일 첨부 설명 + 상세 글쓰기 지시사항)
   */
  static getClaudeWebPrompt(data: BlogPromptData): string {
    const subKeywordList = data.subKeywords.split(',').map(k => k.trim()).filter(k => k);
    const today = new Date();
    const currentDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    let prompt = `# 🎯 글 작성 요청서

## 📋 기본 정보
**📌 작성할 제목**
"${data.selectedTitle}"
`;

    // 글 내용 방향성 (있을 때만 추가)
    if (data.blogContent.trim()) {
      prompt += `
**📝 글 내용 방향성**
${data.blogContent.trim()}
`;
    }

    prompt += `
**📅 현재 날짜**
${currentDate}일 기준으로 작성, 최신 정보 무조건 확인 후 반영

---

## 🚨 글쓰기 규칙 (절대 준수)

### ⚠️ 글자 수 제한 (최우선)
- **1,700~2,500자 (공백 제외)**
- 작성 중간중간 현재 글자 수를 체크하고 명시할 것
- **2,500자를 1글자라도 초과하면 절대 안 됨**
- 마크다운 문법 기호는 글자 수에서 제외
- 본문 텍스트만 순수하게 카운팅할 것
- 작성 완료 후 반드시 글자수 카운팅 해볼 것

### ✍️ 글쓰기 품질
- **자연스러운 글쓰기**: AI 생성티 없이 다른 블로그와 차별화된 개성 있고 인간적인 어투로 작성
- **완전한 내용**: XX공원, OO병원 같은 placeholder 사용 금지. 구체적인 정보가 없다면 "근처 공원", "동네 병원" 등 일반적 표현 사용`;

    // 말투 문서 안내 (있을 때만 추가)
    if (data.writingStyleCount === 1) {
      prompt += `
- **1번 문서**: 제 블로그의 실제 글쓰기 스타일입니다. 이 문체, 어조, 표현 방식을 정확히 모방해서 작성해주세요.`;
    } else if (data.writingStyleCount === 2) {
      prompt += `
- **1~2번 문서**: 제 블로그의 실제 글쓰기 스타일입니다. 이 문체, 어조, 표현 방식을 정확히 모방해서 작성해주세요.`;
    }

    prompt += `

---

## 🔍 SEO 최적화 요구사항

### 🔑 키워드 배치
- **메인키워드**: "${data.mainKeyword}" → 본문에 5-9회 자연스럽게 포함`;

    if (subKeywordList.length > 0) {
      prompt += `
- **보조키워드**: ${subKeywordList.map(keyword => `"${keyword}"`).join(', ')} → 각각 5-9회씩 자연스럽게 사용`;
    }

    prompt += `
- ⚠️ **키워드는 억지로 넣지 말고 내용이 자연스러울 때만 사용** (최대 10회 미만)

### 📊 콘텐츠 요소
- **이미지**: 5~10개 이상 배치
- **태그**: 5~10개 이상 작성 (글 마지막에 # 형태로)`;

    // SEO 가이드 안내 (있을 때만 추가)
    if (data.hasSeoGuide) {
      const seoDocNumber = data.writingStyleCount + 1;
      if (data.writingStyleCount > 0) {
        prompt += `

### 📖 SEO 가이드 준수
- **${seoDocNumber}번 문서**: 네이버 상위 노출을 위한 SEO 가이드입니다. 이를 참고해서 노출이 잘되도록 글을 작성해주세요.`;
      } else {
        prompt += `

### 📖 SEO 가이드 준수
- **1번 문서**: 네이버 상위 노출을 위한 SEO 가이드입니다. 이를 참고해서 노출이 잘되도록 글을 작성해주세요.`;
      }
    }

    prompt += `

---

## 🖼️ 이미지 배치 규칙 (엄수)
- ✅ **소제목과 설명이 완전히 끝난 후에만** (이미지) 배치
- ❌ **단계별 설명 중간에는 절대 이미지 배치 금지** (1단계, 2단계, - 항목 등의 중간)
- 📍 **최적 배치 위치**: 소제목 → 설명 → (이미지) 순서
- 🎯 **이미지 집중 배치**: 소제목이 적고 이미지가 많이 필요한 경우 한 곳에 (이미지)(이미지) 연속 배치 가능

---

## 📤 출력 형식

### ✏️ 글쓰기 스타일
- **대제목**: 큰 글씨 크기로 작성
- **소제목**: 중간 글씨 크기로 작성
- **강조**: 굵은 글씨로 강조
- **구분선**: 적절한 위치에 구분선 활용

### 📝 글 구성 구조
**다른 설명 없이 아래 형식으로만 출력:**

1. **[서론]** - 3초의 법칙으로 핵심 답변 즉시 제시

2. **[본문]** - 아래 옵션들 중에서 알아서 골라서 잘 섞어서 사용
   - 소제목 + 본문 + (이미지)
   - 체크리스트(✓) + (이미지)
   - 비교표 + (이미지)
   - TOP5 순위 + (이미지)
   - 단계별 가이드 + (이미지)
   - Q&A + (이미지)

3. **[결론]** - 요약 및 독자 행동 유도

4. **[태그]** - 작성한 글 내용을 토대로 적합한 태그 5개 이상을 # 형태로 작성

---

## 🎯 작성 방법
- 아티팩트(Artifacts) 기능을 사용하여 블로그 글을 작성해주세요
- **다른 설명이나 부가 내용 없이 블로그 글 내용만 작성**
- **바로 복사해서 붙여넣을 수 있는 완성된 블로그 글만 작성**
`;

    return prompt;
  }
}