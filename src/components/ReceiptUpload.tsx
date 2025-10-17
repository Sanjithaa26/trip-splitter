"use client"

import { useState } from "react"
// Using tesseract.js for OCR
// Modules are inferred; ensure network connectivity
import Tesseract from "tesseract.js"

type Props = {
  onExtracted?: (text: string, amountGuess?: number) => void
}

export default function ReceiptUpload({ onExtracted }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState("")
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFile = (f: File | null) => {
    setFile(f)
    setText("")
    setProgress(0)
  }

  const extract = async () => {
    if (!file) return
    setProcessing(true)
    try {
      const { data } = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress) setProgress(Math.round(m.progress * 100))
        },
      })
      setText(data.text || "")
      const amountGuess = guessTotal(data.text || "")
      onExtracted?.(data.text || "", amountGuess)
    } finally {
      setProcessing(false)
    }
  }

  const guessTotal = (txt: string) => {
    const matches = txt.match(/(?:total|amount)\s*[:-]?\s*\$?(\d+(?:\.\d{1,2})?)/i)
    if (matches?.[1]) return Number.parseFloat(matches[1])
    const money =
      txt
        .match(/\$?\d{1,6}(?:\.\d{1,2})?/g)
        ?.map((v) => Number.parseFloat(v.replace("$", "")))
        .filter((n) => !isNaN(n)) || []
    return money.length ? Math.max(...money) : undefined
  }

  return (
    <div className="card">
      <h3>Receipt OCR</h3>
      <input className="input" type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
      <button className="btn" onClick={extract} disabled={!file || processing}>
        {processing ? `Processing… ${progress}%` : "Extract Text"}
      </button>
      {text && (
        <div className="card muted" style={{ whiteSpace: "pre-wrap" }}>
          <strong>Extracted Text:</strong>
          <p>{text}</p>
        </div>
      )}
    </div>
  )
}
