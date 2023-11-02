import React from 'react';
import toast from 'react-hot-toast';
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
  return children;
}

export default Template;
