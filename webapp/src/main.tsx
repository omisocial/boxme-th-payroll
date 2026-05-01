import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n/I18n'
import { WarehouseProvider } from './context/WarehouseContext'
import { ConfigProvider } from './context/ConfigContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <WarehouseProvider>
        <ConfigProvider>
          <App />
        </ConfigProvider>
      </WarehouseProvider>
    </I18nProvider>
  </StrictMode>,
)
