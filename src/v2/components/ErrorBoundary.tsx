import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      'エラーバウンダリーでエラーをキャッチしました:',
      error,
      errorInfo,
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
          <div className="text-center p-4 max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
              予期せぬエラーが発生しました
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {this.state.error?.message ||
                'アプリケーションで問題が発生しました'}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              再読み込みを試してください
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
