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
  const [clearedDebts, setClearedDebts] = useState<Transfer[]>([])
  const [showCleared, setShowCleared] = useState(true)

  // 🔹 Load trips and expenses
  useEffect(() => {
    const allTrips = getTrips()
    setTrips(allTrips)
    const allExpenses: Record<string, Expense[]> = {}
    for (const trip of allTrips) {
      allExpenses[trip.id] = getExpenses(trip.id)
    }
    setExpensesByTrip(allExpenses)
  }, [])

  // 🔹 Load cleared debts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("clearedDebts")
    if (stored) setClearedDebts(JSON.parse(stored))
  }, [])

  // 🔹 Save cleared debts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("clearedDebts", JSON.stringify(clearedDebts))
  }, [clearedDebts])

  // 🔹 Compute all transfers across trips
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

  // 🔹 Identify cleared vs active debts
  const isCleared = (t: Transfer) =>
    clearedDebts.some(
      (c) =>
        c.from === t.from &&
        c.to === t.to &&
        Math.abs(c.amount - t.amount) < 0.01 &&
        c.tripName === t.tripName
    )

  const activeTransfers = allTransfers.filter((t) => !isCleared(t))
  const clearedTransfers = allTransfers.filter(isCleared)

  // 🔹 Handle clearing a debt
  const handleClearDebt = (t: Transfer) => {
    setClearedDebts((prev) => [...prev, t])
  }

  // 🔹 Filter by member name
  const filteredTransfers = memberName
    ? activeTransfers.filter(
        (t) =>
          t.from.toLowerCase().includes(memberName.toLowerCase().trim()) ||
          t.to.toLowerCase().includes(memberName.toLowerCase().trim())
      )
    : activeTransfers

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
      <h2 className="text-2xl font-semibold mb-4 text-primary">💸 Debt Summary Across Trips</h2>

      {/* Member filter */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ marginRight: "8px" }}>Search Member:</label>
        <input
          type="text"
          value={memberName}
          onChange={(e) => setMemberName(e.target.value)}
          placeholder="e.g., Diya"
          style={{
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            minWidth: "200px",
          }}
        />
      </div>

      {/* Active Debts */}
      {!filteredTransfers.length ? (
        <p style={{ color: "#ccc" }}>
          {memberName ? `All settled up for ${memberName}!` : "All settled up! 🎉"}
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filteredTransfers.map((t, idx) => (
            <li
              key={idx}
              style={{
                border: "2px solid #444",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "10px",
                background: "#121826",
                color: "#fff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>{t.from}</strong> owes <strong>{t.to}</strong> —{" "}
                {t.amount.toFixed(2)} ({t.tripName})
                <div style={{ fontSize: "0.9em", color: "#bbb" }}>
                  Purpose: {t.purpose}
                </div>
              </div>
              <button
                onClick={() => handleClearDebt(t)}
                style={{
                  background: "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Clear
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Cleared Debts */}
      {showCleared && clearedTransfers.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3
            style={{
              color: "#8bc34a",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "bold",
            }}
          >
            <input
              type="checkbox"
              checked={showCleared}
              onChange={(e) => setShowCleared(e.target.checked)}
              style={{ accentColor: "#8bc34a" }}
            />
            Cleared Debts
          </h3>
          <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
            {clearedTransfers.map((t, idx) => (
              <li
                key={idx}
                style={{
                  border: "1px solid #66bb6a",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "10px",
                  background: "#e6f4ea",
                  color: "#2e7d32",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontWeight: 500,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              >
                <span>
                  {t.from} → {t.to} ({t.tripName}) — {t.amount.toFixed(2)}
                </span>
                <span style={{ fontSize: "1.2em" }}>✅</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
