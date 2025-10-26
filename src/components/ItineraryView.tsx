"use client"

import { useEffect, useMemo, useState, FormEvent } from "react"
import { type Expense, type ItineraryItem, type Trip, useFirestore } from "../hooks/useFirestore"

type Props = { trip: Trip }

export default function ItineraryView({ trip }: Props) {
  const {
    getExpenses,
    subscribeExpenses,
    getItinerary,
    addItineraryItem,
    updateItineraryItem,
    deleteItineraryItem,
    subscribeItinerary,
  } = useFirestore()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [items, setItems] = useState<ItineraryItem[]>([])
  const [form, setForm] = useState({ title: "", date: "", notes: "" })


  useEffect(() => {
    const refreshExpenses = () => setExpenses(getExpenses(trip.id))
    const refreshItinerary = () => setItems(getItinerary(trip.id))

    refreshExpenses()
    refreshItinerary()

    const unsubExp = subscribeExpenses(trip.id, refreshExpenses)
    const unsubIt = subscribeItinerary(trip.id, refreshItinerary)

    return () => {
      unsubExp()
      unsubIt()
    }
  }, [trip.id])

  
  const expenseById = useMemo(() => Object.fromEntries(expenses.map((e) => [e.id, e])), [expenses])

  
  const handleAddItem = (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    addItineraryItem(trip.id, { title: form.title, date: form.date, notes: form.notes, expenseIds: [] })
    setForm({ title: "", date: "", notes: "" })
  }

  
  const toggleExpense = (item: ItineraryItem, expId: string) => {
    const updated = new Set(item.expenseIds || [])
    updated.has(expId) ? updated.delete(expId) : updated.add(expId)
    updateItineraryItem(trip.id, { ...item, expenseIds: Array.from(updated) })
  }


  const getTotalLinked = (item: ItineraryItem) =>
    item.expenseIds?.reduce((sum, id) => sum + (expenseById[id]?.amount || 0), 0) ?? 0

  return (
    <div className="card bg-slate-900 text-white p-6 rounded-2xl shadow-lg space-y-6">
      <h2 className="text-2xl font-semibold border-b border-slate-700 pb-2">Itinerary</h2>

      <form className="grid grid-cols-4 gap-4 items-end" onSubmit={handleAddItem}>
        <div className="col-span-1">
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="input w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white"
            placeholder="Enter title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            className="input w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium mb-1">Notes</label>
          <input
            className="input w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white"
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="col-span-1 flex justify-end">
          <button
            className="btn bg-gradient-to-r from-green-400 to-orange-400 text-slate-900 font-semibold py-2 px-4 rounded-lg shadow hover:opacity-90"
            type="submit"
          >
            Add Item
          </button>
        </div>
      </form>

      {/* 🧾 Itinerary Items */}
      {items.length === 0 ? (
        <p className="text-slate-400 italic">No itinerary items added yet.</p>
      ) : (
        <ul className="space-y-6">
          {items.map((item) => (
            <li key={item.id} className="p-4 bg-slate-800 rounded-xl shadow border border-slate-700">
              {/* Item Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-slate-400 text-sm">
                    {item.date || "No date set"} {item.notes && `| ${item.notes}`}
                  </p>
                </div>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md font-medium"
                  onClick={() => deleteItineraryItem(trip.id, item.id)}
                >
                  Delete
                </button>
              </div>

              {/* Expense Linking Section */}
              <div className="bg-slate-900 p-4 rounded-md border border-slate-700">
                <strong className="block mb-3 text-slate-200">Link Expenses</strong>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  {expenses.map((e) => (
                    <label
                      key={e.id}
                      className="flex items-center gap-2 bg-slate-800 p-2 rounded hover:bg-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={item.expenseIds?.includes(e.id) || false}
                        onChange={() => toggleExpense(item, e.id)}
                        className="accent-orange-400"
                      />
                      <span className="text-sm">
                        {e.description} ({trip.currency} {e.amount.toFixed(2)})
                      </span>
                    </label>
                  ))}
                </div>

                {/* Total Linked */}
                {item.expenseIds?.length ? (
                  <p className="text-slate-300 text-sm">
                    <strong>Total linked:</strong> {trip.currency} {getTotalLinked(item).toFixed(2)}
                  </p>
                ) : (
                  <p className="text-slate-500 text-sm">No expenses linked.</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
