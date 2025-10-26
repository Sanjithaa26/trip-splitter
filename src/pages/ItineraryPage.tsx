"use client"

import { useEffect, useMemo, useState, FormEvent } from "react"
import { type Expense, type ItineraryItem, type Trip, useFirestore } from "../hooks/useFirestore"

export default function TripItineraryManager() {
  const {
    getTrips,
    getExpenses,
    subscribeExpenses,
    getItinerary,
    addItineraryItem,
    updateItineraryItem,
    deleteItineraryItem,
    subscribeItinerary,
  } = useFirestore()

  // 🧠 State
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string>("")
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [items, setItems] = useState<ItineraryItem[]>([])
  const [title, setTitle] = useState("")
  const [date, setDate] = useState<string>("")
  const [notes, setNotes] = useState("")

  // 🧭 Load trips on mount
  useEffect(() => {
    setTrips(getTrips())
  }, [])

  // 🔄 Load & subscribe when trip changes
  useEffect(() => {
    if (!selectedTripId) return

    const refreshExpenses = () => setExpenses(getExpenses(selectedTripId))
    const refreshItinerary = () => setItems(getItinerary(selectedTripId))

    const unsubscribeExpenses = subscribeExpenses(selectedTripId, refreshExpenses)
    const unsubscribeItinerary = subscribeItinerary(selectedTripId, refreshItinerary)

    refreshExpenses()
    refreshItinerary()

    return () => {
      unsubscribeExpenses()
      unsubscribeItinerary()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTripId])

  // 📊 Helpers
  const byId = useMemo(() => Object.fromEntries(expenses.map((e) => [e.id, e])), [expenses])
  const selectedTrip = trips.find((t) => t.id === selectedTripId)

  // ➕ Add itinerary item
  const onAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !selectedTripId) return

    addItineraryItem(selectedTripId, { title, date, notes, expenseIds: [] })
    setTitle("")
    setDate("")
    setNotes("")
  }

  // 🔁 Toggle expense linking
  const toggleExpense = (item: ItineraryItem, expId: string) => {
    const set = new Set(item.expenseIds || [])
    set.has(expId) ? set.delete(expId) : set.add(expId)
    updateItineraryItem(selectedTripId, { ...item, expenseIds: Array.from(set) })
  }

  return (
    <div className="card bg-slate-900 text-white p-6 rounded-2xl shadow-lg space-y-6">
      {/* 🧭 Header */}
      <h2 className="text-2xl font-semibold border-b border-slate-700 pb-2">
        Trip Itinerary Manager
      </h2>

      {/* 🧳 Trip Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Select Trip:</label>
        <select
          value={selectedTripId}
          onChange={(e) => setSelectedTripId(e.target.value)}
          className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white"
        >
          <option value="">-- Select a trip --</option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* 🗓️ Show itinerary section only when trip selected */}
      {selectedTripId && selectedTrip && (
        <>
          {/* ➕ Add New Itinerary Item */}
          <form onSubmit={onAdd} className="grid grid-cols-4 gap-4 items-end mb-6">
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white"
                placeholder="Enter title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input
                className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white"
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="col-span-1 flex justify-end">
              <button
                type="submit"
                className="bg-gradient-to-r from-green-400 to-orange-400 text-slate-900 font-semibold py-2 px-4 rounded-lg shadow hover:opacity-90"
              >
                Add Item
              </button>
            </div>
          </form>

          {/* 🧾 Itinerary List */}
          {items.length === 0 ? (
            <p className="text-slate-400 italic">No itinerary items yet.</p>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="p-4 bg-slate-800 rounded-xl shadow border border-slate-700"
                >
                  {/* 🏷️ Item Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <p className="text-slate-400 text-sm">
                        {item.date || "No date"} {item.notes && `| ${item.notes}`}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteItineraryItem(selectedTripId, item.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md font-medium"
                    >
                      Delete
                    </button>
                  </div>

                  {/* 💸 Expense Linking Section */}
                  <div className="bg-slate-900 p-4 rounded-md border border-slate-700">
                    <strong className="block mb-3 text-slate-200">Link Expenses</strong>

                    {/* Expense Checkboxes */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {expenses.map((e) => (
                        <label
                          key={e.id}
                          className="flex items-center gap-2 bg-slate-800 p-2 rounded hover:bg-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(item.expenseIds?.includes(e.id))}
                            onChange={() => toggleExpense(item, e.id)}
                            className="accent-orange-400"
                          />
                          <span className="text-sm">
                            {e.description} ({selectedTrip.currency} {e.amount.toFixed(2)})
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* 💰 Total Linked */}
                    {item.expenseIds?.length ? (
                      <p className="text-slate-300 text-sm">
                        <strong>Total linked:</strong> {selectedTrip.currency}{" "}
                        {item.expenseIds
                          .reduce((s, id) => s + (byId[id]?.amount || 0), 0)
                          .toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-slate-500 text-sm">No expenses linked.</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
