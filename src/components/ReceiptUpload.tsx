"use client"

import { useState } from "react"
import Tesseract from "tesseract.js"

type Item = {
  name: string
  quantity: number
  rate: number
  amount: number
}

type Tax = {
  type: string
  base: number
  value: number
}

type Props = {
  onExtracted?: (text: string, items: Item[], subtotal: number, taxes: Tax[], grandTotal: number) => void
}

export default function ReceiptUpload({ onExtracted }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState("")
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [items, setItems] = useState<Item[]>([])
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [subtotal, setSubtotal] = useState<number>(0)
  const [grandTotal, setGrandTotal] = useState<number>(0)

  const handleFile = (f: File | null) => {
    setFile(f)
    setText("")
    setProgress(0)
    setItems([])
    setTaxes([])
  }

  const extract = async () => {
    if (!file) return
    setProcessing(true)
    try {
      const { data } = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress)
            setProgress(Math.round(m.progress * 100))
        },
      })
      const txt = data.text || ""
      setText(txt)

      const parsedItems = parseItems(txt)
      const parsedTaxes = parseTaxes(txt)
      const subtotal = parsedItems.reduce((sum, i) => sum + i.amount, 0)
      const totalTax = parsedTaxes.reduce((s, t) => s + t.value, 0)
      const total = subtotal + totalTax

      setItems(parsedItems)
      setTaxes(parsedTaxes)
      setSubtotal(subtotal)
      setGrandTotal(total)

      onExtracted?.(txt, parsedItems, subtotal, parsedTaxes, total)
    } finally {
      setProcessing(false)
    }
  }

  /** Parse individual item rows */
  const parseItems = (txt: string): Item[] => {
    const lines = txt
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !/Total Quantity|Sub Total|CGST|SGST|IGST/i.test(l))

    const results: Item[] = []
    const regex =
      /^([A-Za-z0-9\s&\-.()]+)\s+(\d+)\s+([\d.]+)\s+([\d.]+)$/i

    for (const line of lines) {
      const match = line.match(regex)
      if (match) {
        const name = match[1].trim()
        const quantity = parseFloat(match[2])
        const rate = parseFloat(match[3])
        const amount = parseFloat(match[4])
        results.push({ name, quantity, rate, amount })
      }
    }

    return results
  }

  /** Parse tax lines (CGST, SGST, IGST, etc.) */
  const parseTaxes = (txt: string): Tax[] => {
    const taxes: Tax[] = []
    const regex =
      /([\d.]+)\s*@\s*(CGST|SGST|IGST)[^₹]*₹\s*([\d.]+)/gi
    let m
    while ((m = regex.exec(txt)) !== null) {
      taxes.push({
        type: m[2].toUpperCase(),
        base: parseFloat(m[1]),
        value: parseFloat(m[3]),
      })
    }
    return taxes
  }

  const handleItemChange = (index: number, field: keyof Item, value: string) => {
    const updated = [...items]
    const item = { ...updated[index] }
    if (field === "name") item.name = value
    else item[field] = Number(value)
    item.amount = item.quantity * item.rate
    updated[index] = item
    setItems(updated)
    const newSubtotal = updated.reduce((sum, i) => sum + i.amount, 0)
    setSubtotal(newSubtotal)
    const total = newSubtotal + taxes.reduce((s, t) => s + t.value, 0)
    setGrandTotal(total)
  }

  return (
    <div className="card">
      <h3>Receipt OCR</h3>
      <input
        className="input"
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
      />
      <button className="btn" onClick={extract} disabled={!file || processing}>
        {processing ? `Processing… ${progress}%` : "Extract Text"}
      </button>

      {processing && <p>⏳ Analyzing receipt...</p>}

      {items.length > 0 && (
        <div className="mt-4">
          <h4>🧾 Extracted Items</h4>
          <table className="table-auto w-full border mt-2 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1 text-left">Item</th>
                <th className="border px-2 py-1">Qty</th>
                <th className="border px-2 py-1">Rate (₹)</th>
                <th className="border px-2 py-1">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1">
                    <input
                      type="text"
                      value={item.name}
                      className="w-full bg-transparent"
                      onChange={(e) => handleItemChange(i, "name", e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      value={item.quantity}
                      className="w-16 text-center bg-transparent"
                      onChange={(e) => handleItemChange(i, "quantity", e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      value={item.rate}
                      className="w-20 text-center bg-transparent"
                      onChange={(e) => handleItemChange(i, "rate", e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    ₹{item.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td colSpan={3} className="border px-2 py-1 text-right">Subtotal</td>
                <td className="border px-2 py-1 text-center">₹{subtotal.toFixed(2)}</td>
              </tr>

              {taxes.map((tax, i) => (
                <tr key={`tax-${i}`}>
                  <td colSpan={2}></td>
                  <td className="border px-2 py-1 text-right">
                    {tax.base.toFixed(2)} @ {tax.type}
                  </td>
                  <td className="border px-2 py-1 text-center">
                    ₹{tax.value.toFixed(2)}
                  </td>
                </tr>
              ))}

              <tr className="font-bold bg-gray-50">
                <td colSpan={3} className="border px-2 py-1 text-right">Grand Total</td>
                <td className="border px-2 py-1 text-center">₹{grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {text && (
        <details className="mt-4">
          <summary>Raw Extracted Text</summary>
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-2 rounded">
            {text}
          </pre>
        </details>
      )}
    </div>
  )
}
