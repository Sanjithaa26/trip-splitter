"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
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

  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string>("")
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [items, setItems] = useState<ItineraryItem[]>([])

  const [title, setTitle] = useState("")
  const [date, setDate] = useState<string>("")
  const [notes, setNotes] = useState("")

  // Load trips on mount
  useEffect(() => {
    setTrips(getTrips())
  }, [])

  // When selectedTripId changes, refresh expenses and itinerary
  useEffect(() => {
    if (!selectedTripId) return

    const refreshExpenses = () => setExpenses(getExpenses(selectedTripId))
    const unsubscribeExpenses = subscribeExpenses(selectedTripId, refreshExpenses)
    refreshExpenses()

    const refreshItinerary = () => setItems(getItinerary(selectedTripId))
    const unsubscribeItinerary = subscribeItinerary(selectedTripId, refreshItinerary)
    refreshItinerary()

    return () => {
      unsubscribeExpenses()
      unsubscribeItinerary()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTripId])

  const byId = useMemo(() => Object.fromEntries(expenses.map((e) => [e.id, e])), [expenses])
  const selectedTrip = trips.find((t) => t.id === selectedTripId)

  const onAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !selectedTripId) return
    addItineraryItem(selectedTripId, { title, date, notes, expenseIds: [] })
    setTitle("")
    setDate("")
    setNotes("")
  }

  const toggleExpense = (item: ItineraryItem, expId: string) => {
    const set = new Set(item.expenseIds || [])
    if (set.has(expId)) set.delete(expId)
    else set.add(expId)
    updateItineraryItem(selectedTripId, { ...item, expenseIds: Array.from(set) })
  }

  return (
    <div className="card">
      <h2>Trip Itinerary Manager</h2>

      {/* Trip Selector */}
      <div className="mb-4">
        <label>Select Trip: </label>
        <select
          value={selectedTripId}
          onChange={(e) => setSelectedTripId(e.target.value)}
          className="input"
        >
          <option value="">-- Select a trip --</option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTripId && selectedTrip && (
        <>
          {/* Add Itinerary */}
          <form className="grid-3 mb-4" onSubmit={onAdd}>
            <input
              className="input"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <input
              className="input"
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button className="btn" type="submit">
              Add Item
            </button>
          </form>

          {/* Itinerary List */}
          {!items.length ? (
            <p>No itinerary items yet.</p>
          ) : (
            <ul className="list">
              {items.map((item) => (
                <li key={item.id} className="list-item">
                  <div className="it-row">
                    <div className="it-main">
                      <strong>{item.title}</strong>
                      <small>{item.date || "No date"}</small>
                      {item.notes && <small>{item.notes}</small>}
                    </div>
                    <div className="it-actions">
                      <button
                        className="btn btn-danger"
                        onClick={() => deleteItineraryItem(selectedTripId, item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="card muted">
                    <strong>Link Expenses</strong>
                    <div className="grid-3">
                      {expenses.map((e) => (
                        <label key={e.id} className="check">
                          <input
                            type="checkbox"
                            checked={Boolean(item.expenseIds?.includes(e.id))}
                            onChange={() => toggleExpense(item, e.id)}
                          />
                          <span>
                            {e.description} ({selectedTrip.currency} {e.amount.toFixed(2)})
                          </span>
                        </label>
                      ))}
                    </div>
                    {item.expenseIds?.length ? (
                      <p className="muted-text">
                        Total linked: {selectedTrip.currency}{" "}
                        {item.expenseIds.reduce((s, id) => s + (byId[id]?.amount || 0), 0).toFixed(2)}
                      </p>
                    ) : (
                      <p className="muted-text">No expenses linked.</p>
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
