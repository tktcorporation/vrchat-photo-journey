import { init } from '@sentry/electron/renderer';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element');
}

// Sentryの初期化
init({
  dsn: 'https://0c062396cbe896482888204f42f947ec@o4504163555213312.ingest.us.sentry.io/4508574659837952',
  debug: process.env.NODE_ENV === 'development',
});

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
