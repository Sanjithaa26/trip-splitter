"use client";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { type Message, type Trip, useFirestore } from "../hooks/useFirestore";

type Props = { trip: Trip };

export default function ChatSection({ trip }: Props) {
  const { getMessages, addMessage, subscribeMessages } = useFirestore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [author, setAuthor] = useState(trip.members?.[0] || "Anon");
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to messages
  useEffect(() => {
    const refresh = () => {
      const msgs = getMessages(trip.id) || [];
      setMessages(msgs);
    };

    refresh(); // initial load
    const unsubscribe = subscribeMessages(trip.id, refresh);

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [trip.id, getMessages, subscribeMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Send message
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addMessage(trip.id, { author, text });
    setText("");
  };

  return (
    <div className="card">
      <h3>Group Chat</h3>
      <div className="chat-box" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="chat-empty">No messages yet</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="chat-row">
              <span className="chat-author">{m.author}</span>
              <span className="chat-text">{m.text}</span>
              <span className="chat-time">
                {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ""}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form className="chat-form" onSubmit={onSubmit}>
        <select
          className="input"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          disabled={!trip.members || trip.members.length === 0}
        >
          {trip.members?.map((m) => (
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
    </div>
  );
}
