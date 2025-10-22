"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { type Message, type Trip, useFirestore } from "../hooks/useFirestore";

export default function ChatSection() {
  const { getTrips, getMessages, addMessage, subscribeMessages } = useFirestore();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Load all trips
  useEffect(() => {
    const tripsList = getTrips();
    setTrips(tripsList);
  }, [getTrips]);

  // Subscribe to messages for the selected trip
  useEffect(() => {
    if (!selectedTripId) return;

    const refresh = () => {
      const msgs = getMessages(selectedTripId) || [];
      setMessages(msgs);
    };

    refresh(); // initial load
    const unsubscribe = subscribeMessages(selectedTripId, refresh);

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [selectedTripId, getMessages, subscribeMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Send message
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !selectedTripId) return;
    addMessage(selectedTripId, { author, text });
    setText("");
  };

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  return (
    <div className="card">
      <h3>Trip Chat</h3>

      {/* Step 1: Select a trip */}
      <div className="grid-2">
        <select
          className="input"
          value={selectedTripId}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedTripId(id);
            const trip = trips.find((t) => t.id === id);
            setAuthor(trip?.members?.[0] || "Anon");
          }}
        >
          <option value="">-- Select a Trip --</option>
          {trips.map((trip) => (
            <option key={trip.id} value={trip.id}>
              {trip.name}
            </option>
          ))}
        </select>
      </div>

      {/* Step 2: Show chat if trip selected */}
      {!selectedTripId ? (
        <p className="muted-text">Please select a trip to view the chat.</p>
      ) : (
        <>
          <div className="chat-box" role="log" aria-live="polite">
            {messages.length === 0 ? (
              <div className="chat-empty">No messages yet</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="chat-row">
                  <span className="chat-author">{m.author}</span>
                  <span className="chat-text">{m.text}</span>
                  <span className="chat-time">
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleTimeString()
                      : ""}
                  </span>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Chat input */}
          <form className="chat-form" onSubmit={onSubmit}>
            <select
              className="input"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              disabled={!selectedTrip?.members?.length}
            >
              {selectedTrip?.members?.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <input
              className="input"
              placeholder="Write a message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="btn" type="submit">
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}
