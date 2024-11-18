import React from 'react';
import PhotoGallery from './components/PhotoGallery';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-gray-900">
        <PhotoGallery />
      </div>
    </ThemeProvider>
  );
}

export default App;