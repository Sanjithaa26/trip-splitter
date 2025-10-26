"use client"

import { useEffect, useMemo, useState } from "react"
import { type Expense, type Trip, useFirestore } from "../hooks/useFirestore"

type Props = { trip: Trip }

export default function ExpenseList({ trip }: Props) {
  const { getExpenses, deleteExpense, subscribeExpenses } = useFirestore()
  const [expenses, setExpenses] = useState<Expense[]>([])

  const refresh = () => setExpenses(getExpenses(trip.id))

  useEffect(() => {
    refresh()
    return subscribeExpenses(trip.id, refresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id])

  const total = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses])

  return (
    <div className="card">
      <div className="list-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Total Expenses</h3>
        <div className="badge">
          {trip.currency} {total.toFixed(2)}
        </div>
      </div>

      {!expenses.length ? (
        <p>No expenses yet.</p>
      ) : (
        <ul className="list" style={{ marginTop: "10px" }}>
          {expenses.map((e) => (
            <li
              key={e.id}
              className="list-item"
              style={{
                marginBottom: "12px",
                padding: "10px",
                borderBottom: "1px solid rgba(0,0,0,0.1)",
              }}
            >
              <div className="expense-row">
                <div className="expense-main" style={{ marginBottom: "6px" }}>
                  <strong>{e.description}</strong>
                  <small style={{ display: "block", color: "#fff" }}>
                    {e.category} • {new Date(e.date).toLocaleString()}
                  </small>
                </div>

                <div
                  className="expense-meta"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className="badge">
                      {trip.currency} {e.amount.toFixed(2)}
                    </span>
                    <small>by {e.payer}</small>
                  </div>

                  <button
                    className="btn btn-danger"
                    onClick={() => deleteExpense(trip.id, e.id)}
                    style={{
                      marginLeft: "auto",
                      padding: "6px 12px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
