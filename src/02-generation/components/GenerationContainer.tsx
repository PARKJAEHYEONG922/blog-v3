import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import WorkSummary from './WorkSummary';
import ImageGenerator from './ImageGenerator';
import { NaverPublishUI } from '@/03-publish/platforms/naver';
import { ContentProcessor } from '@/02-generation/services/content-processor';
import Button from '@/shared/components/ui/Button';
import { useDialog } from '@/app/DialogContext';
import { useWorkflow } from '@/app/WorkflowContext';
import { useGeneration } from '@/02-generation/hooks/useGeneration';
import { handleError } from '@/shared/utils/error-handler';

const Step2Generation: React.FC = () => {
  const { showAlert } = useDialog();
  const { workflowData, prevStep, reset } = useWorkflow();

  // WorkflowContext에서 필요한 데이터 추출
  const setupData = workflowData;
  const content = workflowData.generatedContent || '';
  const onGoBack = prevStep;
  const onReset = reset;

  // useGeneration 훅에서 실제 사용하는 상태와 함수만 가져오기
  const {
    editorRef,
    originalContent,
    editedContent,
    charCount,
    charCountWithSpaces,
    currentFontSize,
    fontSizes,
    imagePositions,
    images,
    activeTab,
    imagePrompts,
    isRegeneratingPrompts,
    imagePromptError,
    isRefreshingContent,
    selectedPlatform,
    aiModelStatus,
    setOriginalContent,
    setEditedContent,
    setCurrentFontSize,
    setActiveTab,
    setImages,
    setImagePositions,
    setImagePrompts,
    setImagePromptError,
    setSelectedPlatform,
    handleImagesChange,
    generateImagePrompts,
    regenerateImagePrompts,
    handleRefreshContent,
    replaceImagesInContent,
    handlePublish,
    updateCharCount,
    handleContentChange,
    restoreOriginal,
    copyToClipboard,
    handleFontSizeChange,
    applyFontSizeToSelection,
    insertLink,
    insertSeparator,
    handleKeyDown,
    handleClick,
    getPlatformName
  } = useGeneration();

  // 로컬에서만 필요한 추가 상태
  const [imageAIInfo, setImageAIInfo] = useState<string>('확인 중...');
  
  // 컴포넌트 마운트 시 스크롤을 최상단으로 이동
  useEffect(() => {
    const scrollableContainer = document.querySelector('main > div');
    const mainElement = document.querySelector('main');
    
    if (scrollableContainer) {
      scrollableContainer.scrollTop = 0;
    } else if (mainElement) {
      mainElement.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, []);


  // 이미지 AI 설정 정보 가져오기
  useEffect(() => {
    const loadImageAIInfo = async () => {
      try {
        // IPC 직접 호출
        const llmSettings = await window.electronAPI.getLLMSettings();
        if (llmSettings?.lastUsedSettings?.image) {
          const { provider, model } = llmSettings.lastUsedSettings.image;
          if (provider && model) {
            setImageAIInfo(`✅ ${provider} ${model}`);
          } else {
            setImageAIInfo('❌ 미설정');
          }
        } else {
          setImageAIInfo('❌ 미설정');
        }
      } catch (error) {
        handleError(error, '이미지 AI 설정 확인 실패');
        setImageAIInfo('❌ 확인 실패');
      }
    };
    
    loadImageAIInfo();
  }, []);

  // v2와 동일한 초기 콘텐츠 로딩
  useEffect(() => {
    if (content) {
      // 원본 콘텐츠 저장
      setOriginalContent(content);

      // 자동편집 콘텐츠 생성 (네이버 블로그용 HTML) - v2와 동일한 방식
      const processedContent = ContentProcessor.convertToNaverBlogHTML(content);
      setEditedContent(processedContent);

      // 이미지 위치 감지 (원본 마크다운에서)
      const imageInfo = ContentProcessor.processImages(content);
      setImagePositions(imageInfo.imagePositions);
    }
  }, [content]);

  // 에디터 초기화 여부 추적 (한 번만 초기화)
  const isEditorPopulatedRef = useRef(false);

  // editedContent가 처음 생성될 때만 에디터에 반영
  useEffect(() => {
    if (editedContent && editorRef.current && !isEditorPopulatedRef.current) {
      editorRef.current.innerHTML = editedContent;
      isEditorPopulatedRef.current = true;
      // DOM 업데이트 완료 후 글자 수 계산
      const timerId = setTimeout(() => {
        updateCharCount();
      }, 100);

      return () => clearTimeout(timerId);
    }
  }, [editedContent]);

  // NOTE: 이미지 프롬프트 초기화는 useGeneration → useImageGeneration에서 자동 처리됨
  // workflowData.imagePrompts → initialImagePrompts로 전달

  // v2와 동일한 CSS 스타일
  const sectionStyles = `
    .section-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .section-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    
    .section-icon.blue {
      background-color: #dbeafe;
      color: #1d4ed8;
    }
    
    .section-icon.purple {
      background-color: #ede9fe;
      color: #7c3aed;
    }
    
    .section-title {
      margin: 0;
      font-weight: 600;
      color: #1f2937;
    }
  `;

  return (
    <div className="max-w-6xl mx-auto min-h-screen bg-gray-50 p-6">
      <style>{sectionStyles}</style>
      {/* 작업 요약 */}
      <WorkSummary 
        setupData={setupData}
        charCount={charCount}
        charCountWithSpaces={charCountWithSpaces}
        imageCount={imagePositions.length}
        imageAIInfo={imageAIInfo}
        onRefreshContent={handleRefreshContent}
        isRefreshingContent={isRefreshingContent}
      />

      {/* 콘텐츠 편집기 - v2 Step3 스타일 */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-base">
              📝
            </div>
            <h2 className="text-base font-semibold text-gray-900">콘텐츠 편집</h2>
          </div>
          {/* 헤더 오른쪽에 글자 수 표시 */}
          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
            📊 글자 수: {charCount.toLocaleString()}자 / 공백포함: {charCountWithSpaces.toLocaleString()}자
          </div>
        </div>
        
        {/* v2 Step3와 완전 동일한 편집기 UI */}
        <div className="flex justify-between items-center mb-4 border-b-2 border-gray-200 pb-3">
          {/* 탭 버튼들 */}
          <div className="flex gap-0.5">
            <button
              onClick={() => setActiveTab('edited')}
              className={`
                ${activeTab === 'edited' ? 'bg-blue-500 text-white' : 'bg-transparent text-gray-500 border-t border-l border-r border-gray-300'}
                rounded-t-lg px-5 py-3 cursor-pointer text-sm font-semibold border-b-0
              `}
            >
              📝 자동편집 콘텐츠
            </button>
            <button
              onClick={() => setActiveTab('original')}
              className={`
                ${activeTab === 'original' ? 'bg-blue-500 text-white' : 'bg-transparent text-gray-500 border-t border-l border-r border-gray-300'}
                rounded-t-lg px-5 py-3 cursor-pointer text-sm font-semibold border-b-0
              `}
            >
              📄 원본 콘텐츠
            </button>
          </div>

          {/* 기능 버튼 */}
          <div className="flex gap-2 items-center">
            {activeTab === 'edited' && (
              <>
                <select
                  value={currentFontSize}
                  onChange={(e) => handleFontSizeChange(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md border border-gray-300 text-sm cursor-pointer"
                  title="텍스트 드래그 후 글씨 크기 선택"
                >
                  {fontSizes.map((font) => (
                    <option key={font.size} value={font.size}>
                      {font.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={insertLink}
                  className="px-3 py-1.5 bg-blue-500 text-white border-none rounded-md text-xs cursor-pointer"
                  title="링크 카드 추가 (커서 위치에 삽입)"
                >
                  🔗 링크
                </button>

                <button
                  onClick={insertSeparator}
                  className="px-3 py-1.5 bg-emerald-500 text-white border-none rounded-md text-xs cursor-pointer"
                  title="구분선 추가 (커서 위치에 삽입)"
                >
                  ➕ 구분선
                </button>

                <button
                  onClick={restoreOriginal}
                  className="px-3 py-1.5 bg-amber-500 text-white border-none rounded-md text-xs cursor-pointer"
                >
                  🔄 원본 복원
                </button>
                
                <button
                  onClick={async () => await copyToClipboard()}
                  className="px-3 py-1.5 bg-violet-500 text-white border-none rounded-md text-xs cursor-pointer"
                >
                  📋 복사
                </button>
              </>
            )}
          </div>
        </div>

        {/* 글자 수 표시 */}
        {activeTab === 'edited' && (
          <div className="text-sm text-gray-500 mb-2">
            글자 수: {charCount.toLocaleString()}자 / 공백포함: {charCountWithSpaces.toLocaleString()}자
          </div>
        )}

        {/* v2와 완전 동일한 편집기 - 탭 전환 시에도 DOM 유지 */}
        <div className="border border-gray-200 rounded-tr-lg rounded-b-lg bg-white min-h-[400px]">
          {/* 자동편집 에디터 - 항상 렌더링하되 display로 숨김 */}
          <div
            ref={editorRef}
            id="step3-editor"
            contentEditable
            className="w-full min-h-[400px] max-h-[600px] p-4 border-none rounded-tr-lg rounded-b-lg text-[15px] leading-relaxed bg-white relative z-[1] overflow-y-auto outline-none"
            style={{
              display: activeTab === 'edited' ? 'block' : 'none',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            onInput={handleContentChange}
            onKeyDown={handleKeyDown}
            onClick={handleClick}
            suppressContentEditableWarning={true}
          />

          {/* 원본 콘텐츠 뷰어 - 항상 렌더링하되 display로 숨김 */}
          <div
            className="p-5 text-[15px] leading-[1.7] h-[500px] max-h-[500px] overflow-y-auto text-gray-700 bg-gray-50 font-mono whitespace-pre-wrap break-words border border-gray-200"
            style={{
              display: activeTab === 'original' ? 'block' : 'none'
            }}
          >
            {originalContent || workflowData.generatedContent || '원본 콘텐츠가 없습니다.'}
          </div>
        </div>

        {/* v2와 동일한 CSS 스타일 */}
        <style>{`
          .se-text-paragraph {
            margin: 0;
            padding: 0;
            line-height: 1.8;
          }
          .se-text-paragraph-align-left {
            text-align: left;
          }
          .se-text-paragraph-align-center {
            text-align: center;
          }
          .se-ff-nanumgothic {
            font-family: "Nanum Gothic", "나눔고딕", "돋움", Dotum, Arial, sans-serif;
          }
          .se-fs15 {
            font-size: 15px !important;
          }
          .se-fs16 {
            font-size: 16px !important;
          }
          .se-fs19 {
            font-size: 19px !important;
          }
          .se-fs24 {
            font-size: 24px !important;
          }
          .se-component {
            margin: 16px 0;
          }
          .se-table {
            width: 100%;
          }
          .se-table-content {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #ddd;
          }
          .se-cell {
            border: 1px solid #ddd;
            padding: 8px;
            vertical-align: top;
          }
          .se-tr {
            border: none;
          }
          .se-module-text {
            margin: 0;
            padding: 0;
          }
          #step3-editor:focus {
            outline: 2px solid #3b82f6;
            outline-offset: -2px;
          }
        `}</style>

        <div className="mt-3 text-xs text-gray-500">
          💡 <strong>편집 팁:</strong> 텍스트 선택 후 폰트 크기 변경 | 네이버 블로그 완전 호환 방식 | Ctrl+1~4로 폰트 크기 단축키
        </div>
      </div>

      {/* 이미지 프롬프트 재생성 섹션 (오류 시에만 표시) */}
      {(imagePromptError || (imagePositions.length > 0 && imagePrompts.length === 0)) && (
        <div className="section-card p-5 mb-4 bg-red-50 border border-red-200">
          <div className="section-header mb-4">
            <div className="flex items-center gap-3">
              <div className="section-icon w-8 h-8 bg-red-100 text-red-600 text-base flex items-center justify-center rounded-full">⚠️</div>
              <h2 className="section-title text-base m-0 leading-none text-red-600">
                이미지 프롬프트 생성 오류
              </h2>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-red-900 mb-2 bg-red-50/50 p-3 rounded-md border border-red-200">
              {imagePromptError || '이미지 프롬프트가 생성되지 않았습니다. 글에는 이미지 태그가 있지만 프롬프트가 생성되지 않았습니다.'}
            </div>

            <div className="text-[13px] text-red-800 mb-4">
              💡 <strong>해결 방법:</strong>
              <ul className="my-2 ml-4 p-0">
                <li>API 설정에서 다른 AI 제공자로 변경 후 재생성 시도</li>
                <li>현재 설정 그대로 재생성 시도 (일시적 오류일 경우)</li>
                <li>수동으로 이미지 업로드하여 사용</li>
              </ul>
            </div>

            <div className="flex gap-3 items-center">
              <Button
                onClick={regenerateImagePrompts}
                disabled={isRegeneratingPrompts}
                loading={isRegeneratingPrompts}
                variant="danger"
                className="flex items-center gap-2"
              >
                🔄 이미지 프롬프트 재생성
              </Button>

              <span className="text-xs text-red-900">
                {isRegeneratingPrompts ? '프롬프트 재생성 중...' : 'API 설정을 변경한 후 재생성하면 더 성공 가능성이 높습니다'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 생성 섹션 */}
      <ImageGenerator
        imagePositions={imagePositions}
        imagePrompts={imagePrompts}
        onImagesChange={handleImagesChange}
        aiModelStatus={aiModelStatus}
      />


      {/* 발행 플랫폼 선택 섹션 */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-base">
            🚀
          </div>
          <h2 className="text-base font-semibold text-gray-900">발행 플랫폼 선택</h2>
        </div>
        
        <div className="flex items-center space-x-4 mb-3">
          <label className="text-sm font-medium text-gray-700 min-w-[100px]">
            발행할 블로그:
          </label>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer min-w-[200px] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          >
            <option value="" disabled>플랫폼을 선택해주세요</option>
            <option value="naver">🟢 네이버 블로그</option>
            <option value="tistory">🟠 티스토리</option>
            <option value="wordpress">🔵 워드프레스</option>
            <option value="google">🔴 구글 블로그</option>
          </select>
        </div>
        
        <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center space-x-2">
          <span>💡</span>
          <span>네이버 블로그 발행 기능이 구현되어 있습니다. 다른 플랫폼은 순차적으로 구현 예정입니다.</span>
        </div>
      </div>

      {/* 선택된 플랫폼별 발행 컴포넌트 */}
      {selectedPlatform === 'naver' && (
        <NaverPublishUI
          data={setupData}
          editedContent={editedContent}
          imageUrls={images}
          onComplete={(result) => {
            console.log('네이버 발행 완료:', result);
          }}
          copyToClipboard={async () => {
            try {
              // 원본 탭이면 자동편집 탭으로 전환
              if (activeTab !== 'edited') {
                setActiveTab('edited');
                await new Promise(resolve => setTimeout(resolve, 100)); // DOM 업데이트 대기
              }

              // editorRef (실제 DOM 요소)를 사용하여 복사
              if (editorRef.current) {
                // HTML 형식으로 복사하기 위해 선택 영역 생성
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(editorRef.current);
                selection?.removeAllRanges();
                selection?.addRange(range);

                // 복사 실행
                const success = document.execCommand('copy');

                // 선택 해제
                selection?.removeAllRanges();

                if (success) {
                  console.log('✅ HTML 형식으로 클립보드에 복사되었습니다! (editorRef 사용)');
                  return true;
                } else {
                  throw new Error('복사 명령 실행 실패');
                }
              } else {
                throw new Error('에디터 참조를 찾을 수 없습니다');
              }
            } catch (err) {
              handleError(err, '복사 실패');
              // 대체 방법: editedContent로 텍스트 복사
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = editedContent;
              const textContent = tempDiv.innerText || '';
              await navigator.clipboard.writeText(textContent);
              console.log('⚠️ 텍스트 형식으로 복사되었습니다.');
              return false;
            }
          }}
        />
      )}

      {selectedPlatform && selectedPlatform !== 'naver' && (
        <div className="section-card p-5 mb-4 bg-red-50 border border-red-200">
          <div className="text-center">
            <div className="text-base text-red-600 font-semibold mb-2">
              🚧 {getPlatformName(selectedPlatform)} 발행 기능 준비 중
            </div>
            <div className="text-sm text-red-900">
              해당 플랫폼의 발행 기능은 곧 구현될 예정입니다.
            </div>
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="mt-8 flex justify-between items-center gap-3 bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        {/* 왼쪽: 이전으로 가기 */}
        <Button 
          onClick={onGoBack} 
          variant="secondary"
          className="inline-flex items-center space-x-2 px-5 py-3 bg-gray-500 text-white rounded-lg text-sm font-semibold hover:bg-gray-600 transition-colors duration-200"
        >
          <span>←</span>
          <span>이전으로 가기</span>
        </Button>
        
        {/* 가운데: 발행 버튼 (다른 플랫폼용) */}
        <div className="flex space-x-3">
          {selectedPlatform && selectedPlatform !== 'naver' && (Object.keys(images).length === imagePositions.length || imagePositions.length === 0) && (
            <Button 
              onClick={handlePublish}
              variant="publish"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors duration-200 shadow-lg shadow-emerald-500/25"
            >
              <span>📤</span>
              <span>{getPlatformName(selectedPlatform)}에 발행하기</span>
            </Button>
          )}
        </div>
        
        {/* 오른쪽: 처음부터 다시 */}
        <Button 
          onClick={onReset}
          variant="danger"
          className="inline-flex items-center space-x-2 px-5 py-3 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors duration-200"
        >
          <span>🔄</span>
          <span>처음부터 다시</span>
        </Button>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Step2Generation;