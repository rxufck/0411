import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ProgressProvider } from './store';
import { initTelegram } from './telegram';
import './styles.css';

initTelegram();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressProvider>
      <App />
    </ProgressProvider>
  </StrictMode>,
);
