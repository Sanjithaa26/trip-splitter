"use client"
import DebtSummary from "../components/DebtSummary"

export default function DebtPage() {
  return (
    <div>
      <h1>Debt Summary</h1>
      <DebtSummary trip={{} as any} />
    </div>
  )
}