import React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { trpcReact } from './trpc';

type Props = {
  children: React.ReactNode;
};

function Template({ children }: Props) {
  trpcReact.subscribeToast.useSubscription(undefined, {
    onData: (content: string) => {
      toast(content);
    }
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
