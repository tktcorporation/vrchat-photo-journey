import React from 'react';
import { FallbackProps } from 'react-error-boundary';

const ErrorFallback: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <div role="alert">
      <p>何か問題が発生しました。</p>
      <pre>{error.message}</pre>
      <button type="button" onClick={resetErrorBoundary}>
        リトライ
      </button>
    </div>
  );
};

export { ErrorFallback };
