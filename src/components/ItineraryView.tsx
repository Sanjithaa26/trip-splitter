"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
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
  const [title, setTitle] = useState("")
  const [date, setDate] = useState<string>("")
  const [notes, setNotes] = useState("")

  const refreshExpenses = () => setExpenses(getExpenses(trip.id))
  const refreshItinerary = () => setItems(getItinerary(trip.id))

  useEffect(() => {
    refreshExpenses()
    return subscribeExpenses(trip.id, refreshExpenses)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id])

  useEffect(() => {
    refreshItinerary()
    return subscribeItinerary(trip.id, refreshItinerary)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id])

  const byId = useMemo(() => Object.fromEntries(expenses.map((e) => [e.id, e])), [expenses])

  const onAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addItineraryItem(trip.id, { title, date, notes, expenseIds: [] })
    setTitle("")
    setDate("")
    setNotes("")
  }

  const toggleExpense = (item: ItineraryItem, expId: string) => {
    const set = new Set(item.expenseIds || [])
    if (set.has(expId)) set.delete(expId)
    else set.add(expId)
    updateItineraryItem(trip.id, { ...item, expenseIds: Array.from(set) })
  }

  return (
    <div className="card">
      <h3>Itinerary</h3>
      <form className="grid-3" onSubmit={onAdd}>
        <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="input" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button className="btn" type="submit">
          Add Item
        </button>
      </form>

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
                  <button className="btn btn-danger" onClick={() => deleteItineraryItem(trip.id, item.id)}>
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
                        {e.description} ({trip.currency} {e.amount.toFixed(2)})
                      </span>
                    </label>
                  ))}
                </div>
                {item.expenseIds?.length ? (
                  <p className="muted-text">
                    Total linked: {trip.currency}{" "}
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
    </div>
  )
}
