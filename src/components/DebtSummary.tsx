"use client"

import { useEffect, useMemo, useState } from "react"
import { type Expense, type Trip, useFirestore } from "../hooks/useFirestore"

type Transfer = {
  from: string
  to: string
  amount: number
  purpose?: string
  tripName?: string
}

function simplifyBalances(
  balances: Record<string, number>,
  expenses: Expense[],
  trip: Trip
): Transfer[] {
  const creditors = Object.entries(balances)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < 0)
    .sort((a, b) => a[1] - b[1])

  const transfers: Transfer[] = []
  let i = 0,
    j = 0
  while (i < creditors.length && j < debtors.length) {
    const [cName, cAmt] = creditors[i]
    const [dName, dAmt] = debtors[j]
    const amount = Math.min(cAmt, -dAmt)

    if (amount > 0.0001) {
      const relatedExpense = expenses.find(
        (e) =>
          (e.payer === cName && (e.shares?.[dName] || e.split === "equal")) ||
          (e.payer === dName && (e.shares?.[cName] || e.split === "equal"))
      )
      transfers.push({
        from: dName,
        to: cName,
        amount,
        purpose: relatedExpense?.description || "Shared expense",
        tripName: trip.name,
      })
      creditors[i][1] -= amount
      debtors[j][1] += amount
    }
    if (creditors[i][1] <= 0.0001) i++
    if (debtors[j][1] >= -0.0001) j++
  }
  return transfers
}

export default function DebtSummary() {
  const { getTrips, getExpenses } = useFirestore()
  const [trips, setTrips] = useState<Trip[]>([])
  const [expensesByTrip, setExpensesByTrip] = useState<Record<string, Expense[]>>({})
  const [memberName, setMemberName] = useState("")

  useEffect(() => {
    const allTrips = getTrips()
    setTrips(allTrips)
    const allExpenses: Record<string, Expense[]> = {}
    for (const trip of allTrips) {
      allExpenses[trip.id] = getExpenses(trip.id)
    }
    setExpensesByTrip(allExpenses)
  }, [])

  // Compute all transfers across all trips
  const allTransfers = useMemo(() => {
    const transfers: Transfer[] = []
    for (const trip of trips) {
      const expenses = expensesByTrip[trip.id] || []
      if (!trip.members?.length) continue

      const balances: Record<string, number> = Object.fromEntries(trip.members.map((m) => [m, 0]))

      for (const e of expenses) {
        if (e.split === "equal") {
          const share = e.amount / trip.members.length
          for (const m of trip.members) balances[m] -= share
          balances[e.payer] += e.amount
        } else {
          const totalShares = Object.values(e.shares || {}).reduce((a, b) => a + b, 0) || e.amount
          for (const m of trip.members) {
            const s = e.shares?.[m] ?? 0
            balances[m] -= s
          }
          balances[e.payer] += e.amount
          const remainder = e.amount - totalShares
          if (Math.abs(remainder) > 0.001) {
            const adj = remainder / trip.members.length
            for (const m of trip.members) balances[m] -= adj
          }
        }
      }
      transfers.push(...simplifyBalances(balances, expenses, trip))
    }
    return transfers
  }, [trips, expensesByTrip])

  const filteredTransfers = memberName
  ? allTransfers.filter(
      (t) =>
        t.from.toLowerCase().includes(memberName.toLowerCase().trim()) ||
        t.to.toLowerCase().includes(memberName.toLowerCase().trim())
    )
  : allTransfers


  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Debt Summary Across Trips</h2>
      <br></br>
      <div style={{ marginBottom: "1rem" }}>
        <label>Enter member name: </label>
        <input
          type="text"
          value={memberName}
          onChange={(e) => setMemberName(e.target.value)}
          placeholder="e.g., Diya"
          style={{
            padding: "6px 10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            marginLeft: "8px",
          }}
        />
      </div>

      {!filteredTransfers.length ? (
        <p>{memberName ? `All settled up for ${memberName}!` : "All settled up!"}</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filteredTransfers.map((t, idx) => (
            <li
              key={idx}
              style={{
                border: "3px solid #ccc",
                borderRadius: "6px",
                padding: "10px",
                marginBottom: "10px",
                background: "#f9f9f9",
                color: "#333",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",

              }}
            >
              <div>
                <strong>{t.from}</strong> owes <strong>{t.to}</strong> –{" "}
                {t.amount.toFixed(2)} ({t.tripName})
              </div>
              <div style={{ fontSize: "0.9em", color: "#666" }}>
                Purpose: {t.purpose}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
