import type React from 'react';
import AppBar from './AppBar';
import MainNav from './MainNav';

type Props = {
  children: React.ReactNode;
};
function DefaultLayout({ children }: Props) {
  return (
    <div className="flex flex-col h-screen">
      <div>{window.Main && <AppBar />}</div>
      <div className="overflow-hidden flex-grow flex">
        <div className="flex flex-col flex-1">
          <div className="overflow-auto flex-grow flex">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default DefaultLayout;
