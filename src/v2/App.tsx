import { trpcReact } from '@/trpc';
import TrpcWrapper from '@/trpcWrapper';
import { Toaster } from '@/v2/components/ui/toaster';
import type React from 'react';
import { useEffect } from 'react';
import PhotoGallery from './components/PhotoGallery';
import { ThemeProvider } from './contexts/ThemeContext';
import { useToast } from './hooks/use-toast';

function App() {
  return (
    <TrpcWrapper>
      <ThemeProvider>
        <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-gray-900">
          <ToasterWrapper />
          <Contents>
            <PhotoGallery />
          </Contents>
        </div>
      </ThemeProvider>
    </TrpcWrapper>
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
  const {
    mutate: syncDatabase,
    isLoading,
    error,
    isSuccess,
  } = trpcReact.settings.syncDatabase.useMutation();

  useEffect(() => {
    const sync = async () => {
      try {
        await syncDatabase(undefined, {
          onError: (error) => {
            console.error('Database sync error:', error);
          },
        });
      } catch (e) {
        console.error('Unexpected error during sync:', e);
      }
    };
    sync();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
            エラーが発生しました
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error.message}
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
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto" />
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            データベースを同期中...
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            しばらくお待ちください
          </p>
        </div>
      </div>
    );
  }

  return <div className="h-full">{props.children}</div>;
};

export default App;
