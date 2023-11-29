import React from 'react';
import MainNav from './MainNav';

type Props = {
  children: React.ReactNode;
};
function DefaultLayout({ children }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div>
        <MainNav />
      </div>
      <div className="overflow-auto flex-grow">{children}</div>
    </div>
  );
}

export default DefaultLayout;
