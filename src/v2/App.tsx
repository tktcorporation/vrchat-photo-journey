import React from 'react';
import PhotoGallery from './components/PhotoGallery';
import { ThemeProvider } from './contexts/ThemeContext';
import TrpcWrapper from '@/trpcWrapper';

function App() {
  return (
    <TrpcWrapper>
      <ThemeProvider>
        <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-gray-900">
          <PhotoGallery />
        </div>
      </ThemeProvider>
    </TrpcWrapper>
  );
}

export default App;