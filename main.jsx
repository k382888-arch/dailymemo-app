import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Register SW for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

const root = createRoot(document.getElementById('root'))
root.render(<App />)
