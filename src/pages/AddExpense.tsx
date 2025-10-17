"use client"

import { useMemo, useState } from "react"
import ExpenseForm from "../components/ExpenseForm"
import { type Trip, useFirestore } from "../hooks/useFirestore"
import { Link } from "react-router-dom"

export default function AddExpense() {
  const { getTrips } = useFirestore()
  const trips = getTrips()
  const [tripId, setTripId] = useState(trips[0]?.id || "")

  const trip: Trip | undefined = useMemo(() => trips.find((t) => t.id === tripId), [tripId, trips])

  return (
    <div className="card">
      <h2>Add Expense</h2>
      {!trips.length ? (
        <>
          <p>No trips available. Create one first.</p>
          <Link className="btn" to="/">
            Go Home
          </Link>
        </>
      ) : (
        <>
          <label className="form-label">
            Select Trip
            <select className="input" value={tripId} onChange={(e) => setTripId(e.target.value)}>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          {trip && <ExpenseForm trip={trip} />}
        </>
      )}
    </div>
  )
}
