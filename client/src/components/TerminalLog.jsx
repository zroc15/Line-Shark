import { useRef, useEffect } from 'react'
import './TerminalLog.css'

export default function TerminalLog({ logs, isActive }) {
  const bodyRef = useRef(null)

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="terminal-log" id="terminal-log">
      <div className="terminal-header">
        <div className="terminal-dot red" />
        <div className="terminal-dot yellow" />
        <div className="terminal-dot green" />
        <span className="terminal-title">line-shark pipeline</span>
      </div>
      <div className="terminal-body" ref={bodyRef}>
        {logs.map((log, i) => (
          <div key={i} className="terminal-line">
            <span className="prefix">▸</span>
            <span className="timestamp">[{log.time}]</span>
            <span className={log.type || ''}>{log.message}</span>
          </div>
        ))}
        {isActive && (
          <div className="terminal-line">
            <span className="prefix">▸</span>
            <span className="terminal-cursor" />
          </div>
        )}
      </div>
    </div>
  )
}
