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
          {/* <Contents>
            <PhotoGallery />
          </Contents> */}
          <div>Hello</div>
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

// const Contents = (props: { children: React.ReactNode }) => {
//   const { mutate: syncDatabase, isLoading } =
//     trpcReact.settings.syncDatabase.useMutation();
//   useEffect(() => {
//     syncDatabase();
//   }, []);
//   if (isLoading) {
//     return <div>Loading...</div>;
//   }
//   return <div>{props.children}</div>;
// };

export default App;
