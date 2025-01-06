import { Toaster } from '@/components/ui/toaster';
import { trpcReact } from '@/trpc';
import TrpcWrapper from '@/trpcWrapper';
import { init as initSentry } from '@sentry/electron/renderer';
import type React from 'react';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import PhotoGallery from './components/PhotoGallery';
import { TermsModal } from './components/TermsModal';
import { terms } from './constants/terms/ja';
import { ThemeProvider } from './contexts/ThemeContext';
import { useToast } from './hooks/use-toast';
import { useStartupStage } from './hooks/useStartUpStage';
import type { ProcessError } from './hooks/useStartUpStage';

function AppContent() {
  const [showTerms, setShowTerms] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const { toast } = useToast();

  const { data: termsStatus } = trpcReact.getTermsAccepted.useQuery();
  const { mutateAsync: setTermsAccepted } =
    trpcReact.setTermsAccepted.useMutation({
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: '規約同意の保存に失敗しました',
          description: error.message,
        });
      },
    });
  const { mutateAsync: initializeSentryMain } =
    trpcReact.initializeSentry.useMutation({
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Sentryの初期化に失敗しました',
          description: error.message,
        });
      },
    });

  useEffect(() => {
    const checkTermsAcceptance = async () => {
      if (!termsStatus) return;

      const { accepted, version } = termsStatus;
      const currentVersion = terms.version;
      console.log('termsStatus', termsStatus);

      if (!accepted) {
        setShowTerms(true);
        setIsUpdate(false);
        setHasAcceptedTerms(false);
      } else if (version !== currentVersion) {
        setShowTerms(true);
        setIsUpdate(true);
        setHasAcceptedTerms(false);
      } else {
        setHasAcceptedTerms(true);
        // 規約同意済みの場合のみSentryを初期化
        await initializeSentry();
      }
    };

    checkTermsAcceptance();
  }, [termsStatus]);

  const initializeSentry = async () => {
    // レンダラープロセスのSentryを初期化
    if (termsStatus?.accepted && process.env.NODE_ENV === 'production') {
      initSentry({
        dsn: process.env.VITE_SENTRY_DSN,
        enableNative: true,
      });
      // メインプロセスのSentryを初期化
      await initializeSentryMain();
    }
  };

  const handleTermsAccept = async () => {
    await setTermsAccepted({
      accepted: true,
      version: terms.version,
    });
    setShowTerms(false);
    setHasAcceptedTerms(true);
    // 規約同意時にSentryを初期化
    await initializeSentry();
  };

  if (!hasAcceptedTerms) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-gray-900">
        <TermsModal
          open={showTerms}
          onAccept={handleTermsAccept}
          isUpdate={isUpdate}
          canClose={false}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-gray-900">
      <ToasterWrapper />
      <Contents>
        <PhotoGallery />
      </Contents>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <TrpcWrapper>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </TrpcWrapper>
    </ErrorBoundary>
  );
}

const ToasterWrapper = () => {
  const { toast } = useToast();
  trpcReact.subscribeToast.useSubscription(undefined, {
    onData: (content: unknown) => {
      if (typeof content === 'string') {
        console.log('toast', content);
        toast({
          description: content,
        });
        return;
      }
      console.log('toast', JSON.stringify(content));
      toast({
        description: JSON.stringify(content),
      });
    },
  });
  return (
    <>
      <Toaster />
    </>
  );
};

const Contents = (props: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const { stages, errorMessage, retryProcess } = useStartupStage({
    onError: (error: ProcessError) => {
      toast({
        variant: 'destructive',
        title: 'スタートアップエラー',
        description: error.message,
      });
    },
    onComplete: () => {
      toast({
        title: '準備完了',
        description: 'アプリケーションの初期化が完了しました',
      });
    },
  });

  if (
    stages.startingSync === 'error' ||
    stages.syncDone === 'error' ||
    stages.logsStored === 'error' ||
    stages.indexLoaded === 'error'
  ) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4 max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
            初期化エラー
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={retryProcess}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (
    stages.startingSync === 'inProgress' ||
    stages.syncDone === 'inProgress' ||
    stages.logsStored === 'inProgress' ||
    stages.indexLoaded === 'inProgress'
  ) {
    const currentStage = (() => {
      if (stages.indexLoaded === 'inProgress')
        return 'インデックスを読み込み中...';
      if (stages.logsStored === 'inProgress') return 'ログを保存中...';
      if (stages.syncDone === 'inProgress') return 'データベースを同期中...';
      if (stages.startingSync === 'inProgress')
        return 'データベースの初期化を開始中...';
      return '初期化中...';
    })();

    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {currentStage}
          </p>
        </div>
      </div>
    );
  }

  return props.children;
};

export default App;
