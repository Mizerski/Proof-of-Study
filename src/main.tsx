import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Raiz } from '@/app/Raiz'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Raiz />
  </StrictMode>,
)
