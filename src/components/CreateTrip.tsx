"use client"

import { type FormEvent, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useFirestore } from "../hooks/useFirestore"

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"]

export default function CreateTrip() {
  const { addTrip } = useFirestore()
  const [name, setName] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [members, setMembers] = useState("")
  const navigate = useNavigate()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const memberList = members
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean)
    const trip = addTrip({ name, currency, members: memberList })
    setName("")
    setMembers("")
    navigate(`/trips`)
  }

  return (
    <form className="card" onSubmit={onSubmit} aria-label="Create Trip Form">
      <h2>Create a New Trip</h2>
      <label className="form-label">
        Trip Name
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="form-label">
        Base Currency
        <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="form-label">
        Members (comma-separated)
        <input
          className="input"
          placeholder="e.g., Alice, Bob, Carol"
          value={members}
          onChange={(e) => setMembers(e.target.value)}
        />
      </label>
      <button className="btn btn-primary" type="submit">
        Create Trip
      </button>
    </form>
  )
}
