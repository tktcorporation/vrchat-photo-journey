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
      <div className="flex flex-1">{children}</div>
    </div>
  );
}

export default DefaultLayout;
