"use client"

import { type FormEvent, useEffect, useState } from "react"
import { type Expense, type Trip, useFirestore } from "../hooks/useFirestore"

const CATEGORIES = ["Food", "Transport", "Stay", "Activities", "Shopping", "Misc"]

type Props = {
  trip: Trip
  onCreated?: (e: Expense) => void
  prefillDescription?: string
  prefillAmount?: number
}

export default function ExpenseForm({ trip, onCreated, prefillDescription, prefillAmount }: Props) {
  const { addExpense } = useFirestore()
  const [description, setDescription] = useState(prefillDescription ?? "")
  const [amount, setAmount] = useState<number>(prefillAmount ?? 0)
  const [category, setCategory] = useState("Food")
  const [payer, setPayer] = useState(trip.members[0] || "")
  const [split, setSplit] = useState<"equal" | "custom">("equal")
  const [shares, setShares] = useState<Record<string, number>>({})

  useEffect(() => {
    if (prefillDescription) setDescription(prefillDescription)
  }, [prefillDescription])
  useEffect(() => {
    if (typeof prefillAmount === "number") setAmount(prefillAmount)
  }, [prefillAmount])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const exp = addExpense(trip.id, {
      description,
      amount: Number(amount),
      currency: trip.currency,
      category,
      payer,
      split,
      shares: split === "custom" ? shares : undefined,
      date: new Date().toISOString(),
    })
    setDescription("")
    setAmount(0)
    onCreated?.(exp)
  }

  const handleShareChange = (member: string, value: number) => {
    setShares((prev) => ({ ...prev, [member]: value }))
  }

  return (
    <form className="card" onSubmit={onSubmit} aria-label="Add Expense Form">
      <h3>Add Expense</h3>
      <div className="grid-2">
        <label className="form-label">
          Description
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </label>
        <label className="form-label">
          Amount ({trip.currency})
          <input
            className="input"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(Number.parseFloat(e.target.value))}
            required
          />
        </label>
      </div>
      <div className="grid-2">
        <label className="form-label">
          Category
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Payer
          <select className="input" value={payer} onChange={(e) => setPayer(e.target.value)}>
            {trip.members.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid-2">
        <label className="form-label">
          Split Type
          <select className="input" value={split} onChange={(e) => setSplit(e.target.value as any)}>
            <option value="equal">Equal</option>
            <option value="custom">Custom</option>
          </select>
        </label>
      </div>
      {split === "custom" && (
        <div className="card muted">
          <p>Enter shares for each member (sum should equal total amount):</p>
          <div className="grid-3">
            {trip.members.map((m) => (
              <label key={m} className="form-label">
                {m}
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={shares[m] ?? 0}
                  onChange={(e) => handleShareChange(m, Number.parseFloat(e.target.value))}
                />
              </label>
            ))}
          </div>
        </div>
      )}
      <button className="btn" type="submit">
        Add Expense
      </button>
    </form>
  )
}
