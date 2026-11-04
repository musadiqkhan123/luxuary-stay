import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { startResponsiveTables } from './utils/responsiveTables.js';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/public.css';
import './styles/dashboard.css';
import './styles/theme.css';
import './styles/print.css';

startResponsiveTables();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
