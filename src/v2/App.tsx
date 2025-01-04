import { trpcReact } from '@/trpc';
import TrpcWrapper from '@/trpcWrapper';
import { Toaster } from '@/v2/components/ui/toaster';
import { init as initSentry } from '@sentry/electron/renderer';
import type React from 'react';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import PhotoGallery from './components/PhotoGallery';
import { TermsModal } from './components/TermsModal';
import { terms } from './constants/terms/ja';
import { ThemeProvider } from './contexts/ThemeContext';
import { useToast } from './hooks/use-toast';

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
  const {
    mutate: syncDatabase,
    isLoading,
    error,
    isSuccess,
  } = trpcReact.settings.syncDatabase.useMutation({
    retry: 3,
    retryDelay: 5000,
    onError: (error) => {
      console.error('Database sync error:', error);
      toast({
        variant: 'destructive',
        title: 'データベース同期エラー',
        description: `${error.message}\n再試行するか、アプリケーションを再起動してください。`,
      });
    },
  });

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const sync = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error('データベース同期がタイムアウトしました')),
            30000,
          );
        });

        if (!isMounted) return;

        await Promise.race([
          syncDatabase(undefined, {
            onSuccess: () => {
              if (isMounted) {
                toast({
                  title: '同期完了',
                  description: 'データベースの同期が完了しました',
                });
              }
            },
          }),
          timeoutPromise,
        ]);
      } catch (e) {
        if (!isMounted) return;

        console.error('Unexpected error during sync:', e);

        if (retryCount < maxRetries) {
          retryCount++;
          toast({
            title: '再試行中',
            description: `データベース同期を再試行しています (${retryCount}/${maxRetries})`,
          });
          setTimeout(sync, 5000);
        } else {
          toast({
            variant: 'destructive',
            title: 'エラー',
            description:
              e instanceof Error
                ? e.message
                : '予期せぬエラーが発生しました。アプリケーションを再起動してください。',
          });
        }
      }
    };

    sync();

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4 max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
            データベース同期エラー
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error.message}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            再試行するか、アプリケーションを再起動してください
          </p>
          <button
            type="button"
            onClick={() => syncDatabase()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !isSuccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4 max-w-md mx-auto">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto" />
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            データベースを同期中...
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            初回起動時は時間がかかる場合があります
          </p>
        </div>
      </div>
    );
  }

  return <div className="h-full">{props.children}</div>;
};

export default App;
