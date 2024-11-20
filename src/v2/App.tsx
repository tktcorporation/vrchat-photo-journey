import React from 'react';
import PhotoGallery from './components/PhotoGallery';
import { ThemeProvider } from './contexts/ThemeContext';
import TrpcWrapper from '@/trpcWrapper';
import { useToast } from './hooks/use-toast';
import { Toaster } from '@/v2/components/ui/toaster';
import { trpcReact } from '@/trpc';

function App() {
  return (
    <TrpcWrapper>
      <ThemeProvider>
        <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-gray-900">
          <Contents />
          <PhotoGallery />
        </div>
      </ThemeProvider>
    </TrpcWrapper>
  );
}

const Contents = () => {
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

export default App;