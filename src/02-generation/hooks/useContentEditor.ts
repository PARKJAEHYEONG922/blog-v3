/**
 * 콘텐츠 편집 관련 훅
 * - 에디터 상태 관리 (원본/수정, 글자 수)
 * - 포맷팅 (폰트 크기, 링크, 구분선)
 * - 클립보드 복사
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDialog } from '@/app/DialogContext';
import { ContentProcessor } from '@/02-generation/services/content-processor';

export interface UseContentEditorParams {
  initialContent: string;
  processMarkdown: (content: string) => string;
}

export interface UseContentEditorReturn {
  // 에디터 상태
  editorRef: React.RefObject<HTMLDivElement>;
  originalContent: string;
  editedContent: string;
  charCount: number;
  charCountWithSpaces: number;
  currentFontSize: string;
  fontSizes: Array<{ name: string; size: string; weight: string }>;
  activeTab: 'original' | 'edited';

  // 상태 업데이트
  setOriginalContent: (content: string) => void;
  setEditedContent: (content: string) => void;
  setCurrentFontSize: (size: string) => void;
  setActiveTab: (tab: 'original' | 'edited') => void;

  // 에디터 기능
  updateCharCount: () => void;
  handleContentChange: () => void;
  restoreOriginal: () => void;
  copyToClipboard: () => Promise<boolean>;

  // 포맷팅
  handleFontSizeChange: (newSize: string) => void;
  applyFontSizeToSelection: (fontSize: string) => void;
  insertLink: () => void;
  insertSeparator: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  handleClick: () => void;
}

export const useContentEditor = ({
  initialContent,
  processMarkdown
}: UseContentEditorParams): UseContentEditorReturn => {
  const { showAlert } = useDialog();

  const editorRef = useRef<HTMLDivElement>(null);
  const [originalContent, setOriginalContent] = useState<string>('');
  const [editedContent, setEditedContent] = useState<string>('');
  const [charCount, setCharCount] = useState(0);
  const [charCountWithSpaces, setCharCountWithSpaces] = useState(0);
  const [currentFontSize, setCurrentFontSize] = useState('15px');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'original' | 'edited'>('edited');

  const fontSizes = [
    { name: '대제목 (24px)', size: '24px', weight: 'bold' },
    { name: '소제목 (19px)', size: '19px', weight: 'bold' },
    { name: '강조 (16px)', size: '16px', weight: 'bold' },
    { name: '일반 (15px)', size: '15px', weight: 'normal' }
  ];

  // 글자 수 업데이트
  const updateCharCount = useCallback(() => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      const textWithoutSpaces = text.replace(/\s/g, '');
      setCharCount(textWithoutSpaces.length);
      setCharCountWithSpaces(text.length);
    }
  }, []);

  // 콘텐츠 변경 핸들러
  const handleContentChange = useCallback(() => {
    updateCharCount();
    if (editorRef.current) {
      setEditedContent(editorRef.current.innerHTML);
    }
    setIsEditing(true);
  }, [updateCharCount]);

  // 원본 복원
  const restoreOriginal = useCallback(() => {
    if (originalContent) {
      const processedContent = processMarkdown(originalContent);
      setEditedContent(processedContent);

      if (editorRef.current) {
        editorRef.current.innerHTML = processedContent;
        updateCharCount();
      }

      setIsEditing(false);
      showAlert({ type: 'success', message: '원본 내용으로 복원되었습니다.' });
    }
  }, [originalContent, processMarkdown, updateCharCount, showAlert]);

  // 클립보드에 HTML 형식으로 복사
  const copyToClipboard = useCallback(async (): Promise<boolean> => {
    if (!editorRef.current) {
      showAlert({ type: 'error', message: '에디터가 로드되지 않았습니다.' });
      return false;
    }

    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);

      const success = document.execCommand('copy');
      selection?.removeAllRanges();

      if (success) {
        showAlert({ type: 'success', message: 'HTML 형식으로 클립보드에 복사되었습니다!' });
        return true;
      } else {
        throw new Error('복사 명령 실행 실패');
      }
    } catch (error) {
      showAlert({ type: 'error', message: '클립보드 복사에 실패했습니다.' });
      console.error('클립보드 복사 실패:', error);
      return false;
    }
  }, [showAlert]);

  // 선택 영역에 폰트 크기 적용
  const applyFontSizeToSelection = useCallback((fontSize: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      console.warn('선택된 텍스트가 없습니다');
      return;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      console.warn('선택 영역이 비어있습니다');
      return;
    }

    const fontInfo = fontSizes.find(f => f.size === fontSize);
    if (!fontInfo) return;

    try {
      document.execCommand('fontSize', false, '7');

      const fontElements = editorRef.current?.querySelectorAll('font[size="7"]');
      fontElements?.forEach((fontEl) => {
        const span = document.createElement('span');
        span.style.fontSize = fontSize;
        span.style.fontWeight = fontInfo.weight;
        span.innerHTML = fontEl.innerHTML;
        fontEl.replaceWith(span);
      });

      updateCharCount();
    } catch (error) {
      console.error('폰트 크기 적용 실패:', error);
    }
  }, [updateCharCount]);

  // 폰트 크기 변경
  const handleFontSizeChange = useCallback((newSize: string) => {
    setCurrentFontSize(newSize);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed) {
      applyFontSizeToSelection(newSize);
    }
  }, [applyFontSizeToSelection]);

  // 링크 삽입
  const insertLink = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    let savedRange: Range | null = null;

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;

      const isInsideEditor = editorRef.current.contains(
        container.nodeType === Node.TEXT_NODE ? container.parentNode : container
      );

      if (!isInsideEditor) {
        showAlert({ message: '편집기 내부를 클릭한 후 링크를 삽입해주세요.' });
        return;
      }

      savedRange = range.cloneRange();
    } else {
      showAlert({ message: '편집기 내부를 클릭한 후 링크를 삽입해주세요.' });
      return;
    }

    // 모달 생성
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;';

    const dialog = document.createElement('div');
    dialog.style.cssText = 'background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); min-width: 400px;';
    dialog.innerHTML = `
      <div style="margin-bottom: 16px; font-size: 16px; font-weight: 600; color: #333;">링크 URL 입력</div>
      <input type="text" id="url-input" placeholder="https://..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; margin-bottom: 16px; box-sizing: border-box;" />
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button id="url-cancel" style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer; font-size: 14px;">취소</button>
        <button id="url-ok" style="padding: 8px 16px; border: none; border-radius: 6px; background: #3b82f6; color: white; cursor: pointer; font-size: 14px;">확인</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const input = document.getElementById('url-input') as HTMLInputElement;
    const okBtn = document.getElementById('url-ok');
    const cancelBtn = document.getElementById('url-cancel');

    input?.focus();

    const cleanup = () => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    };

    const handleInsert = () => {
      const url = input?.value.trim();
      if (!url) {
        cleanup();
        return;
      }

      const linkCard = document.createElement('div');
      linkCard.contentEditable = 'false';
      linkCard.className = 'blog-link-card';
      linkCard.setAttribute('data-link-url', url);
      linkCard.style.cssText = 'border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px 16px; margin: 12px 0; background: #fafafa; display: inline-block; max-width: 100%; cursor: default;';

      const link = document.createElement('a');
      link.href = url;
      link.textContent = url;
      link.style.cssText = 'color: #03c75a; font-size: 14px; word-break: break-all; text-decoration: none;';

      linkCard.appendChild(link);

      if (savedRange) {
        const newSelection = window.getSelection();
        if (newSelection) {
          newSelection.removeAllRanges();
          newSelection.addRange(savedRange);

          savedRange.deleteContents();
          savedRange.insertNode(linkCard);

          const br = document.createElement('br');
          savedRange.setStartAfter(linkCard);
          savedRange.insertNode(br);

          savedRange.setStartAfter(br);
          savedRange.collapse(true);
        }
      } else {
        editorRef.current?.appendChild(linkCard);
        const br = document.createElement('br');
        editorRef.current?.appendChild(br);
      }

      updateCharCount();
      cleanup();
    };

    okBtn?.addEventListener('click', handleInsert);
    cancelBtn?.addEventListener('click', cleanup);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup();
    });
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleInsert();
      if (e.key === 'Escape') cleanup();
    });
  }, [updateCharCount, showAlert]);

  // 구분선 삽입
  const insertSeparator = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      showAlert({ message: '편집기 내부를 클릭한 후 구분선을 삽입해주세요.' });
      return;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const isInsideEditor = editorRef.current.contains(
      container.nodeType === Node.TEXT_NODE ? container.parentNode : container
    );

    if (!isInsideEditor) {
      showAlert({ message: '편집기 내부를 클릭한 후 구분선을 삽입해주세요.' });
      return;
    }

    const separatorHTML = `
      <p class="se-text-paragraph se-text-paragraph-align-center" style="line-height: 1.8;"><span class="se-ff-nanumgothic se-fs15" style="color: rgb(0, 0, 0);">&nbsp;</span></p>
      <hr style="border: none; border-top: 1px solid #666; margin: 16px auto; width: 30%;">
      <p class="se-text-paragraph se-text-paragraph-align-center" style="line-height: 1.8;"><span class="se-ff-nanumgothic se-fs15" style="color: rgb(0, 0, 0);">&nbsp;</span></p>
    `;

    range.deleteContents();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = separatorHTML;

    while (tempDiv.firstChild) {
      range.insertNode(tempDiv.firstChild);
    }

    updateCharCount();
  }, [updateCharCount, showAlert]);

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Ctrl + 1/2/3/4 단축키로 글씨 크기 변경
    if (e.ctrlKey && ['1', '2', '3', '4'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      const fontSizeMap: { [key: string]: string } = {
        '1': '24px',
        '2': '19px',
        '3': '16px',
        '4': '15px'
      };
      const fontSize = fontSizeMap[e.key];
      applyFontSizeToSelection(fontSize);
      setCurrentFontSize(fontSize);
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const br = document.createElement('br');
      range.deleteContents();
      range.insertNode(br);

      const newRange = document.createRange();
      newRange.setStartAfter(br);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }, [applyFontSizeToSelection]);

  // 클릭 이벤트 핸들러
  const handleClick = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const element = container.nodeType === 3 ? container.parentElement : container as HTMLElement;

      if (element) {
        const computedSize = window.getComputedStyle(element).fontSize;
        setCurrentFontSize(computedSize);
      }
    }
  }, []);

  // 초기 콘텐츠 설정
  useEffect(() => {
    setOriginalContent(initialContent);
    const processed = processMarkdown(initialContent);
    setEditedContent(processed);

    if (editorRef.current) {
      editorRef.current.innerHTML = processed;
      const text = editorRef.current.innerText || '';
      const textWithoutSpaces = text.replace(/\s/g, '');
      setCharCount(textWithoutSpaces.length);
      setCharCountWithSpaces(text.length);
    }
  }, [initialContent, processMarkdown]);

  return {
    editorRef,
    originalContent,
    editedContent,
    charCount,
    charCountWithSpaces,
    currentFontSize,
    fontSizes,
    activeTab,

    setOriginalContent,
    setEditedContent,
    setCurrentFontSize,
    setActiveTab,

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
  };
};
