"use client"

import { type FormEvent, useEffect, useState } from "react"
import { type Expense, type Trip, useFirestore } from "../hooks/useFirestore"

const CATEGORIES = ["Food", "Transport", "Stay", "Activities", "Shopping", "Misc"]

type Dish = {
  name: string
  price: number
  portions: number
  memberPortions: Record<string, number>
}

type Props = {
  trip: Trip
  onCreated?: (e: Expense) => void
  prefillDescription?: string
  prefillAmount?: number
}

export default function ExpenseForm({ trip, onCreated, prefillDescription, prefillAmount }: Props) {
  const { addExpense } = useFirestore()
  const [description, setDescription] = useState(prefillDescription ?? "")
  const [category, setCategory] = useState("Food")
  const [payer, setPayer] = useState(trip.members[0] || "")
  const [dishes, setDishes] = useState<Dish[]>([])
  const [showDishMode, setShowDishMode] = useState(false)

  const [shares, setShares] = useState<Record<string, number>>({})

  
  const addDish = () => {
    const emptyPortions: Record<string, number> = {}
    for (const m of trip.members) emptyPortions[m] = 0
    setDishes((prev) => [...prev, { name: "", price: 0, portions: 1, memberPortions: emptyPortions }])
  }

  
  const updateDish = (index: number, key: keyof Dish, value: any) => {
    setDishes((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [key]: value }
      return updated
    })
  }

  
  const updateMemberPortion = (dishIndex: number, member: string, value: number) => {
    setDishes((prev) => {
      const updated = [...prev]
      updated[dishIndex].memberPortions[member] = value
      return updated
    })
  }

  
  useEffect(() => {
    const newShares: Record<string, number> = {}
    for (const dish of dishes) {
      if (!dish.portions || !dish.price) continue
      const costPerPortion = dish.price / dish.portions
      for (const [member, eaten] of Object.entries(dish.memberPortions)) {
        newShares[member] = (newShares[member] || 0) + costPerPortion * eaten
      }
    }
    setShares(newShares)
  }, [dishes])

  const totalAmount = Object.values(shares).reduce((a, b) => a + b, 0)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const exp = addExpense(trip.id, {
      description: description || "Meal Expense",
      amount: Number(totalAmount.toFixed(2)),
      currency: trip.currency,
      category,
      payer,
      split: "custom",
      shares,
      date: new Date().toISOString(),
    })
    setDescription("")
    setDishes([])
    setShares({})
    onCreated?.(exp)
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
          Category
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

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

      <div className="mt-2">
        <label className="form-label">
          Mode:
          <select
            className="input"
            value={showDishMode ? "dish" : "normal"}
            onChange={(e) => setShowDishMode(e.target.value === "dish")}
          >
            <option value="normal">Normal</option>
            <option value="dish">Per-Item Mode</option>
          </select>
        </label>
      </div>

      {showDishMode && (
        <div className="card muted">
          <h4>Items</h4>
         {dishes.map((dish, i) => (
  <div key={i} className="dish-block bg-slate-900 p-4 rounded-xl shadow-md space-y-4">
    {/* Top Fields: Dish Name, Price, Portions */}
    <div className="grid grid-cols-3 gap-4">
      <div className="flex flex-col">
        <label className="text-sm text-slate-300 mb-1">Item Name</label>
        <input
          className="input bg-slate-800 border border-slate-700 rounded-md p-2 text-white"
          placeholder="Item name"
          value={dish.name}
          onChange={(e) => updateDish(i, "name", e.target.value)}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-sm text-slate-300 mb-1">Total Price</label>
        <input
          className="input bg-slate-800 border border-slate-700 rounded-md p-2 text-white"
          type="number"
          placeholder="Total price"
          value={dish.price}
          onChange={(e) => updateDish(i, "price", Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-sm text-slate-300 mb-1">Total Portions</label>
        <input
          className="input bg-slate-800 border border-slate-700 rounded-md p-2 text-white"
          type="number"
          placeholder="Total portions"
          value={dish.portions}
          onChange={(e) => updateDish(i, "portions", Number(e.target.value))}
        />
      </div>
    </div>

    {/* Member Portion Inputs */}
    <div className="grid grid-cols-5 gap-4">
      {trip.members.map((m) => (
        <div key={m} className="flex flex-col">
          <label className="text-sm text-slate-300 mb-1">{m}</label>
          <input
            className="input bg-slate-800 border border-slate-700 rounded-md p-2 text-white text-center"
            type="number"
            step="1"
            value={dish.memberPortions[m] ?? 0}
            onChange={(e) => updateMemberPortion(i, m, Number(e.target.value))}
          />
        </div>
      ))}
    </div>
  </div>
))}


          <button type="button" className="btn" onClick={addDish}>
            + Add Item
          </button>
        </div>
      )}

      {showDishMode && dishes.length > 0 && (
        <div className="card">
          <h4>Per-Person Total</h4>
          {trip.members.map((m) => (
            <div key={m} className="grid-2">
              <span>{m}</span>
              <span>
                {trip.currency} {(shares[m] ?? 0).toFixed(2)}
              </span>
            </div>
          ))}
          <hr />
          <strong>Total: {trip.currency} {totalAmount.toFixed(2)}</strong>
        </div>
      )}

      <button className="btn mt-3" type="submit">
        Add Expense
      </button>
    </form>
  )
}
