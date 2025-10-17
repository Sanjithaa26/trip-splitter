// A lightweight localStorage-backed "Firestore-like" helper with pub/sub.
// Swap this out later for real Firebase if needed, keeping the same API.

export type Trip = {
  id: string
  name: string
  currency: string
  members: string[]
  createdAt: number
}

export type Expense = {
  id: string
  tripId: string
  description: string
  amount: number
  currency: string
  category: string
  payer: string
  split: "equal" | "custom"
  shares?: Record<string, number>
  date: string
  location?: { lat: number; lng: number }
  receiptText?: string
}

export type Message = {
  id: string
  tripId: string
  author: string
  text: string
  createdAt: number
}

export type ItineraryItem = {
  id: string
  tripId: string
  title: string
  date: string
  notes?: string
  expenseIds?: string[]
}

type Listener = () => void

const tripsKey = "tp_trips"
const expensesKey = (tripId: string) => `tp_expenses_${tripId}`
const chatKey = (tripId: string) => `tp_chat_${tripId}`
const itineraryKey = (tripId: string) => `tp_itinerary_${tripId}`

const emitter = new EventTarget()
const emit = (channel: string) => emitter.dispatchEvent(new Event(channel))
const on = (channel: string, cb: Listener) => {
  const handler = () => cb()
  emitter.addEventListener(channel, handler)
  return () => emitter.removeEventListener(channel, handler)
}

const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const writeJSON = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const uid = () => Math.random().toString(36).slice(2, 10)

export function useFirestore() {
  // Trips
const getTrip = (id: string): Trip | undefined => {
  return getTrips().find((t) => t.id === id)
}
const subscribeTrip = (id: string, cb: Listener) => {
  return subscribeTrips(() => {
    const all = getTrips()
    if (all.some((t) => t.id === id)) cb()
  })
}
  const getTrips = (): Trip[] => readJSON<Trip[]>(tripsKey, [])
  const addTrip = (data: Omit<Trip, "id" | "createdAt">): Trip => {
    const trip: Trip = { ...data, id: uid(), createdAt: Date.now() }
    const all = getTrips()
    writeJSON(tripsKey, [trip, ...all])
    emit(tripsKey)
    return trip
  }
  const subscribeTrips = (cb: Listener) => on(tripsKey, cb)

  // Expenses
  const getExpenses = (tripId: string): Expense[] => readJSON<Expense[]>(expensesKey(tripId), [])
  const addExpense = (tripId: string, data: Omit<Expense, "id" | "tripId">): Expense => {
    const exp: Expense = { ...data, id: uid(), tripId }
    const all = getExpenses(tripId)
    writeJSON(expensesKey(tripId), [exp, ...all])
    emit(expensesKey(tripId))
    return exp
  }
  const deleteExpense = (tripId: string, expenseId: string) => {
    const all = getExpenses(tripId).filter((e) => e.id !== expenseId)
    writeJSON(expensesKey(tripId), all)
    emit(expensesKey(tripId))
  }
  const subscribeExpenses = (tripId: string, cb: Listener) => on(expensesKey(tripId), cb)

  // Chat
  const getMessages = (tripId: string): Message[] => readJSON<Message[]>(chatKey(tripId), [])
  const addMessage = (tripId: string, msg: Omit<Message, "id" | "createdAt" | "tripId">): Message => {
    const m: Message = { ...msg, id: uid(), createdAt: Date.now(), tripId }
    const all = getMessages(tripId)
    writeJSON(chatKey(tripId), [...all, m])
    emit(chatKey(tripId))
    return m
  }
  const subscribeMessages = (tripId: string, cb: Listener) => on(chatKey(tripId), cb)

  // Itinerary
  const getItinerary = (tripId: string): ItineraryItem[] => readJSON<ItineraryItem[]>(itineraryKey(tripId), [])
  const addItineraryItem = (tripId: string, item: Omit<ItineraryItem, "id" | "tripId">): ItineraryItem => {
    const i: ItineraryItem = { ...item, id: uid(), tripId }
    const all = getItinerary(tripId)
    writeJSON(itineraryKey(tripId), [...all, i])
    emit(itineraryKey(tripId))
    return i
  }
  const updateItineraryItem = (tripId: string, item: ItineraryItem) => {
    const all = getItinerary(tripId).map((i) => (i.id === item.id ? item : i))
    writeJSON(itineraryKey(tripId), all)
    emit(itineraryKey(tripId))
  }
  const deleteItineraryItem = (tripId: string, itemId: string) => {
    const all = getItinerary(tripId).filter((i) => i.id !== itemId)
    writeJSON(itineraryKey(tripId), all)
    emit(itineraryKey(tripId))
  }
const subscribeItinerary = (tripId: string, cb: Listener) => on(itineraryKey(tripId), cb)

return {
    // trips
    getTrips,
    getTrip,
    addTrip,
    subscribeTrips,
    subscribeTrip,
    // expenses
    getExpenses,
    addExpense,
    deleteExpense,
    subscribeExpenses,
    // chat
    getMessages,
    addMessage,
    subscribeMessages,
    // itinerary
    getItinerary,
    addItineraryItem,
    updateItineraryItem,
    deleteItineraryItem,
    subscribeItinerary,
  
  }
}
