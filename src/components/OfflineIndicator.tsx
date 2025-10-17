"use client"

import { useEffect, useState } from "react"

export default function OfflineIndicator() {
  const [online, setOnline] = useState<boolean>(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    return () => {
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
    }
  }, [])

  return (
    <div
      title={online ? "Online" : "Offline"}
      aria-label={online ? "Online" : "Offline"}
      className="offline-indicator"
      role="status"
    >
      <span className={`dot ${online ? "dot-online" : "dot-offline"}`} aria-hidden="true" />
      <span className="status-text">{online ? "Online" : "Offline"}</span>
    </div>
  )
}
