import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'
import { initIam } from './iam/index.ts'
import { composedHomeDataSource } from './app/home-data-source.ts'
import { registerHomeDataSource } from './shared/presentation/views/home/home.data-source.ts'

void initIam()
registerHomeDataSource(composedHomeDataSource)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
