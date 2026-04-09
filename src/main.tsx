/**
 * アプリのエントリーポイント。
 * React 18のcreateRootを使ってマウントする。
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('[main] ルート要素が見つかりません。index.htmlを確認してください。')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
