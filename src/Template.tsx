import type React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { trpcReact } from './trpc';

type Props = {
  children: React.ReactNode;
};

function Template({ children }: Props) {
  trpcReact.subscribeToast.useSubscription(undefined, {
    onData: (content: unknown) => {
      if (typeof content === 'string') {
        toast(content);
        return;
      }
      toast(JSON.stringify(content));
    },
  });

  // Return children directly instead of wrapping them in a fragment
  return (
    <>
      <Toaster />
      {children}
    </>
  );
}

export default Template;
