import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/cantarell/400.css'
import '@fontsource/cantarell/700.css'
import '@fontsource/cantarell/400-italic.css'
import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/playfair-display/400-italic.css'
import './index.css'
import './styles/motifs.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
