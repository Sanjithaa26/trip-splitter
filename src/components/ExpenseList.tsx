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
      <div className="list-header">
        <h3>Expenses</h3>
        <div className="badge">
          {trip.currency} {total.toFixed(2)}
        </div>
      </div>
      {!expenses.length ? (
        <p>No expenses yet.</p>
      ) : (
        <ul className="list">
          {expenses.map((e) => (
            <li key={e.id} className="list-item">
              <div className="expense-row">
                <div className="expense-main">
                  <strong>{e.description}</strong>
                  <small>
                    {e.category} • {new Date(e.date).toLocaleString()}
                  </small>
                </div>
                <div className="expense-meta">
                  <span className="badge">
                    {trip.currency} {e.amount.toFixed(2)}
                  </span>
                  <small>by {e.payer}</small>
                  <button className="btn btn-danger" onClick={() => deleteExpense(trip.id, e.id)}>
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
