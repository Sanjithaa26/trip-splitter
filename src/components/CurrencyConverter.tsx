"use client"

import { useState } from "react"
import { useCurrency } from "../hooks/useCurrency"

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"]

export default function CurrencyConverter() {
  const [from, setFrom] = useState("USD")
  const [to, setTo] = useState("EUR")
  const [amount, setAmount] = useState(1)
  const { convert, loading, error } = useCurrency(from)

  const result = convert ? convert(amount, from, to) : amount

  return (
    <div className="card">
      <h3>Currency Converter</h3>
      <div className="grid-3">
        <label className="form-label">
          From
          <select className="input" value={from} onChange={(e) => setFrom(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          To
          <select className="input" value={to} onChange={(e) => setTo(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Amount
          <input
            className="input"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number.parseFloat(e.target.value))}
          />
        </label>
      </div>
      {loading ? (
        <p>Loading rates…</p>
      ) : error ? (
        <p className="error">Error: {error}</p>
      ) : (
        <p className="result">
          {amount} {from} ≈{" "}
          <strong>
            {result.toFixed(2)} {to}
          </strong>
        </p>
      )}
    </div>
  )
}
