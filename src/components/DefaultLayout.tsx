import type React from 'react';
import AppBar from './AppBar';
import MainNav from './MainNav';

type Props = {
  children: React.ReactNode;
};
function DefaultLayout({ children }: Props) {
  return (
    <>
      <div className="z-10">{window.Main && <AppBar />}</div>
      <div className="overflow-hidden flex-grow">
        <div className="flex flex-col h-full rounded">
          <div className="overflow-auto flex-grow">{children}</div>
        </div>
      </div>
    </>
  );
}

export default DefaultLayout;
