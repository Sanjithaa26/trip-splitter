"use client"

import { useEffect, useMemo, useState } from "react"
import { type Expense, type Trip, useFirestore } from "../hooks/useFirestore"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type Props = { trip: Trip }

export default function AnalyticsDashboard({ trip }: Props) {
  const { getExpenses, subscribeExpenses } = useFirestore()
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    const refresh = () => setExpenses(getExpenses(trip.id) || [])
    refresh()
    const unsubscribe = subscribeExpenses(trip.id, refresh)
    return () => unsubscribe?.()
  }, [trip.id])

  const data = useMemo(() => {
    const byCategory: Record<string, number> = {}
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
    }
    return Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [expenses])

  const totalSpending = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses])

  return (
    <div className="card">
      <h3>Spending by Category</h3>
      {!data.length ? (
        <p>No data yet for this trip.</p>
      ) : (
        <>
          <p>Total Spending: {totalSpending} {trip.currency}</p>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value} ${trip.currency}`} />
                <Legend />
                <Bar dataKey="amount" name={`Amount (${trip.currency})`} fill="var(--accent)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
