import React, { lazy, Suspense } from 'react';
import ErrorBoundary from '@/shared/components/error/ErrorBoundary';
import LoadingFallback from '@/shared/components/ui/LoadingFallback';
import { useWorkflow } from './contexts/WorkflowContext';

// Code Splitting
const SetupContainer = lazy(() => import('./01-setup').then(module => ({ default: module.SetupContainer })));
const GenerationContainer = lazy(() => import('./02-generation').then(module => ({ default: module.GenerationContainer })));

const BlogAutomationPage: React.FC = () => {
  const { currentStep } = useWorkflow();

  return (
    <div className="h-full overflow-y-auto">
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback message="컴포넌트 로딩 중..." fullScreen />}>
          {currentStep === 1 && <SetupContainer />}
          {currentStep === 2 && <GenerationContainer />}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default BlogAutomationPage;
