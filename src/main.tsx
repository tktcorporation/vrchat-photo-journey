import React from 'react';
import { createRoot } from 'react-dom/client';
/// <reference types="@welldone-software/why-did-you-render" />
import './v2/lib/wdyr';

import App from './v2/App';

import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
