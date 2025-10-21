"use client";
import { useCallback, useMemo } from "react";

export type Trip = {
  id: string;
  name: string;
  currency: string;
  members: string[];
  createdAt: number;
};

export type Expense = {
  id: string;
  tripId: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  payer: string;
  split: "equal" | "custom";
  shares?: Record<string, number>;
  date: string;
  location?: { lat: number; lng: number };
  receiptText?: string;
};

export type Message = {
  id: string;
  tripId: string;
  author: string;
  text: string;
  createdAt: number;
};

export type ItineraryItem = {
  id: string;
  tripId: string;
  title: string;
  date: string;
  notes?: string;
  expenseIds?: string[];
};

type Listener = () => void;

const tripsKey = "tp_trips";
const expensesKey = (tripId: string) => `tp_expenses_${tripId}`;
const chatKey = (tripId: string) => `tp_chat_${tripId}`;
const itineraryKey = (tripId: string) => `tp_itinerary_${tripId}`;

const emitter = new EventTarget();
const emit = (channel: string) => emitter.dispatchEvent(new Event(channel));
const on = (channel: string, cb: Listener) => {
  const handler = () => cb();
  emitter.addEventListener(channel, handler);
  return () => emitter.removeEventListener(channel, handler);
};

const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const uid = () => Math.random().toString(36).slice(2, 10);

export function useFirestore() {
  // --- Trips ---
  const getTrips = useCallback(() => readJSON<Trip[]>(tripsKey, []), []);
  const getTrip = useCallback((id: string) => getTrips().find((t) => t.id === id), [getTrips]);
  const addTrip = useCallback(
    (data: Omit<Trip, "id" | "createdAt">) => {
      const trip: Trip = { ...data, id: uid(), createdAt: Date.now() };
      const all = getTrips();
      writeJSON(tripsKey, [trip, ...all]);
      emit(tripsKey);
      return trip;
    },
    [getTrips]
  );
  const subscribeTrips = useCallback((cb: Listener) => on(tripsKey, cb), []);
  const subscribeTrip = useCallback(
    (id: string, cb: Listener) =>
      subscribeTrips(() => {
        const all = getTrips();
        if (all.some((t) => t.id === id)) cb();
      }),
    [getTrips, subscribeTrips]
  );

  // --- Expenses ---
  const getExpenses = useCallback((tripId: string) => readJSON<Expense[]>(expensesKey(tripId), []), []);
  const addExpense = useCallback(
    (tripId: string, data: Omit<Expense, "id" | "tripId">) => {
      const exp: Expense = { ...data, id: uid(), tripId };
      const all = getExpenses(tripId);
      writeJSON(expensesKey(tripId), [exp, ...all]);
      emit(expensesKey(tripId));
      return exp;
    },
    [getExpenses]
  );
  const deleteExpense = useCallback(
    (tripId: string, expenseId: string) => {
      const all = getExpenses(tripId).filter((e) => e.id !== expenseId);
      writeJSON(expensesKey(tripId), all);
      emit(expensesKey(tripId));
    },
    [getExpenses]
  );
  const subscribeExpenses = useCallback((tripId: string, cb: Listener) => on(expensesKey(tripId), cb), []);

  // --- Chat ---
  const getMessages = useCallback((tripId: string) => readJSON<Message[]>(chatKey(tripId), []), []);
  const addMessage = useCallback(
    (tripId: string, msg: Omit<Message, "id" | "createdAt" | "tripId">) => {
      const m: Message = { ...msg, id: uid(), createdAt: Date.now(), tripId };
      const all = getMessages(tripId);
      writeJSON(chatKey(tripId), [...all, m]);
      emit(chatKey(tripId));
      return m;
    },
    [getMessages]
  );
  const subscribeMessages = useCallback((tripId: string, cb: Listener) => on(chatKey(tripId), cb), []);

  // --- Itinerary ---
  const getItinerary = useCallback((tripId: string) => readJSON<ItineraryItem[]>(itineraryKey(tripId), []), []);
  const addItineraryItem = useCallback(
    (tripId: string, item: Omit<ItineraryItem, "id" | "tripId">) => {
      const i: ItineraryItem = { ...item, id: uid(), tripId };
      const all = getItinerary(tripId);
      writeJSON(itineraryKey(tripId), [...all, i]);
      emit(itineraryKey(tripId));
      return i;
    },
    [getItinerary]
  );
  const updateItineraryItem = useCallback(
    (tripId: string, item: ItineraryItem) => {
      const all = getItinerary(tripId).map((i) => (i.id === item.id ? item : i));
      writeJSON(itineraryKey(tripId), all);
      emit(itineraryKey(tripId));
    },
    [getItinerary]
  );
  const deleteItineraryItem = useCallback(
    (tripId: string, itemId: string) => {
      const all = getItinerary(tripId).filter((i) => i.id !== itemId);
      writeJSON(itineraryKey(tripId), all);
      emit(itineraryKey(tripId));
    },
    [getItinerary]
  );
  // --- Trips ---
const deleteTrip = (id: string) => {
  const all = getTrips().filter((t) => t.id !== id);
  writeJSON(tripsKey, all);

  // Optionally, delete all related data for that trip
  localStorage.removeItem(expensesKey(id));
  localStorage.removeItem(chatKey(id));
  localStorage.removeItem(itineraryKey(id));

  emit(tripsKey);
};

  const subscribeItinerary = useCallback((tripId: string, cb: Listener) => on(itineraryKey(tripId), cb), []);

  return useMemo(
    () => ({
      getTrips,
      getTrip,
      addTrip,
      deleteTrip,
      subscribeTrips,
      subscribeTrip,

      getExpenses,
      addExpense,
      deleteExpense,
      subscribeExpenses,

      getMessages,
      addMessage,
      subscribeMessages,

      getItinerary,
      addItineraryItem,
      updateItineraryItem,
      deleteItineraryItem,
      subscribeItinerary,
    }),
    [
      getTrips,
      getTrip,
      addTrip,
      deleteTrip,
      subscribeTrips,
      subscribeTrip,
      getExpenses,
      addExpense,
      deleteExpense,
      subscribeExpenses,
      getMessages,
      addMessage,
      subscribeMessages,
      getItinerary,
      addItineraryItem,
      updateItineraryItem,
      deleteItineraryItem,
      subscribeItinerary,
    ]
  );
}
