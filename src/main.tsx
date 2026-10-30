import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { Gallery } from './screens/Gallery';
import { ProgressProvider } from './store';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressProvider>
      {location.hash === '#gallery' ? <Gallery /> : <App />}
    </ProgressProvider>
  </StrictMode>,
);
