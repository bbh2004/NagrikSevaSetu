import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {/* Global toast notification container — positioned top-right, outside routing context */}
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
      }}
    />
  </StrictMode>,
)
