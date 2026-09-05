import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyFontScale, loadFontScaleIndex } from './store/fontScale';

// Before the first render, so a non-default size does not flash at 16px first.
applyFontScale(loadFontScaleIndex());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
