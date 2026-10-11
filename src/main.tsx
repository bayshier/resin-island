import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

function fallback() {
  document.getElementById('root')!.innerHTML =
    '<div style="display:grid;place-items:center;height:100vh;font-family:sans-serif;color:#6b6154">当前浏览器不支持 WebGL2，无法运行本场景。</div>'
}

if (!document.createElement('canvas').getContext('webgl2')) {
  fallback()
} else {
  // 开发调试：把 console.error / 未捕获错误显示到页面浮层，便于无头截图排查
  if (import.meta.env.DEV) {
    const box = document.createElement('div')
    box.id = 'err-overlay'
    box.style.cssText =
      'position:fixed;left:8px;bottom:8px;max-width:70vw;max-height:45vh;overflow:auto;z-index:9999;' +
      'background:rgba(120,0,0,0.85);color:#fff;font:11px/1.4 monospace;padding:6px 8px;border-radius:6px;' +
      'white-space:pre-wrap;display:none;pointer-events:none'
    document.body.appendChild(box)
    const show = (msg: string) => {
      box.style.display = 'block'
      box.textContent = (box.textContent + '\n' + msg).slice(-3000)
    }
    const origError = console.error.bind(console)
    console.error = (...args: unknown[]) => {
      show(args.map(String).join(' ').slice(0, 600))
      origError(...args)
    }
    window.addEventListener('error', (e) => show('UNCAUGHT: ' + e.message))
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
