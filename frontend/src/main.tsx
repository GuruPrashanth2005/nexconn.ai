import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import 'katex/dist/katex.min.css'
import App from './App.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'


import { GoogleOAuthProvider } from '@react-oauth/google';

// Note: Replace with frontend env var in real production setup
const GOOGLE_CLIENT_ID = "276420874298-q7c376gp0jd2qb8bojjn6cd91r85h652.apps.googleusercontent.com";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
