"use client";

import { useState, useEffect, FormEvent } from "react";
import Tesseract from "tesseract.js";
import { useFirestore, Trip, Expense } from "../hooks/useFirestore";

const CATEGORIES = ["Food", "Transport", "Stay", "Activities", "Shopping", "Misc"];

type Item = {
  name: string;
  quantity: number;
  rate: number;
  amount: number;
  memberPortions: Record<string, number>;
};

export default function ReceiptExpenseForm() {
  const { getTrips, addExpense } = useFirestore();

  // --- Trip selection ---
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  // --- OCR & form state ---
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [payer, setPayer] = useState("");

  const [items, setItems] = useState<Item[]>([]);
  const [showItemMode, setShowItemMode] = useState(false);

  // --- Load trips ---
  useEffect(() => {
    setTrips(getTrips());
  }, [getTrips]);

  useEffect(() => {
    if (selectedTrip) setPayer(selectedTrip.members[0] || "");
  }, [selectedTrip]);

  // --- OCR extraction ---
  const extract = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const { data } = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress) setProgress(Math.round(m.progress * 100));
        },
      });
      const txt = data.text || "";
      setText(txt);

      if (!selectedTrip) return;

      const parsedItems = parseItems(txt, selectedTrip.members);
      setItems(parsedItems);
      setShowItemMode(true);
      setDescription("Receipt OCR Expense");
    } finally {
      setProcessing(false);
    }
  };

  const parseItems = (txt: string, members: string[]): Item[] => {
    const lines = txt
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !/Total|Sub Total|CGST|SGST|IGST/i.test(l));

    const results: Item[] = [];
    const regex = /^([A-Za-z0-9\s&\-.()]+)\s+(\d+)\s+([\d.]+)\s+([\d.]+)$/i;

    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        const name = match[1].trim();
        const quantity = parseFloat(match[2]);
        const rate = parseFloat(match[3]);
        const amount = parseFloat(match[4]);
        const memberPortions: Record<string, number> = {};
        for (const m of members) memberPortions[m] = 0;
        results.push({ name, quantity, rate, amount, memberPortions });
      }
    }

    return results;
  };

  // --- Handle item change ---
  const updateItem = (index: number, field: keyof Item, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "quantity" || field === "rate") {
        updated[index].amount = updated[index].quantity * updated[index].rate;
      }
      return updated;
    });
  };

  const updateMemberPortion = (itemIndex: number, member: string, value: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[itemIndex].memberPortions[member] = value;
      return updated;
    });
  };

  // --- Compute shares dynamically ---
  const shares = selectedTrip
    ? items.reduce<Record<string, number>>((acc, item) => {
        for (const [m, val] of Object.entries(item.memberPortions)) {
          acc[m] = (acc[m] || 0) + val;
        }
        return acc;
      }, {})
    : {};

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  // --- Submit expense ---
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;

    addExpense(selectedTrip.id, {
      description: description || "Receipt OCR Expense",
      amount: totalAmount,
      currency: selectedTrip.currency,
      category,
      payer,
      split: "custom",
      shares,
      date: new Date().toISOString(),
      receiptText: text,
    });

    // Reset
    setFile(null);
    setText("");
    setItems([]);
    setDescription("");
    setShowItemMode(false);
    alert("Expense added ✅");
  };

  return (
    <form className="card" onSubmit={onSubmit}>
      <h3>Receipt OCR Expense</h3>

      {/* Trip selection */}
      <label className="form-label">
        Trip:
        <select value={selectedTripId} onChange={(e) => setSelectedTripId(e.target.value)} className="input">
          <option value="">-- Select Trip --</option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      {selectedTrip && (
        <>
          <div className="grid-2 mt-2">
            <label className="form-label">
              Description
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" required />
            </label>
            <label className="form-label">
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="form-label mt-2">
            Payer
            <select value={payer} onChange={(e) => setPayer(e.target.value)} className="input">
              {selectedTrip.members.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          {/* File input & OCR */}
          <input type="file" accept="image/*" className="input mt-2" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button type="button" onClick={extract} className="btn mt-2" disabled={!file || processing}>
            {processing ? `Processing ${progress}%` : "Extract Text"}
          </button>

          {/* Items / per-member split */}
          {showItemMode && items.length > 0 && (
            <div className="card mt-3">
              <h4>Items / Splits</h4>
              {items.map((item, i) => (
                <div key={i} className="dish-block">
                  <div className="grid-3">
                    <input
                      className="input"
                      value={item.name}
                      onChange={(e) => updateItem(i, "name", e.target.value)}
                      placeholder="Item name"
                    />
                    <input
                      className="input"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                      placeholder="Total portions"
                    />
                    <input
                      className="input"
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateItem(i, "rate", Number(e.target.value))}
                      placeholder="Rate per portion"
                    />
                  </div>

                  <div className="grid-3 mt-1">
                    {selectedTrip.members.map((m) => (
                      <label key={m}>
                        {m} portions
                        <input
                          type="number"
                          className="input"
                          value={item.memberPortions[m] || 0}
                          onChange={(e) => updateMemberPortion(i, m, Number(e.target.value))}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Compute per-member share */}
              <div className="mt-2">
                <h4>Per-Person Total</h4>
                {selectedTrip.members.map((m) => {
                  let total = 0;
                  for (const item of items) {
                    const totalPortions = item.quantity || 1;
                    const memberPortion = item.memberPortions[m] || 0;
                    total += (memberPortion / totalPortions) * item.amount;
                  }
                  return (
                    <div key={m} className="grid-2">
                      <span>{m}</span>
                      <span>
                        {selectedTrip.currency} {total.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
                <hr />
                <strong>
                  Total: {selectedTrip.currency} {items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                </strong>
              </div>
            </div>
          )}

          <br />
          <button className="btn mt-3" type="submit">
            Add Expense
          </button>
        </>
      )}
    </form>
  );
}
