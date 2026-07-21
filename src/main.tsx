import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HostedRuntimeBoundary } from './components/HostedRuntimeBoundary';
import { SingleWriterGate } from './components/SingleWriterGate';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HostedRuntimeBoundary>
      <SingleWriterGate>
        <App />
      </SingleWriterGate>
    </HostedRuntimeBoundary>
  </React.StrictMode>
);
