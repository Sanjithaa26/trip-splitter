"use client";

import { useEffect, useMemo, useState } from "react";
import { type Expense, type Trip, useFirestore } from "../hooks/useFirestore";


export default function DebtTrip({ trip }: { trip: Trip }) {
  const { getExpenses, subscribeExpenses } = useFirestore();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const update = () => setExpenses(getExpenses(trip.id));
    update();
    return subscribeExpenses(trip.id, update);
  }, [trip.id, getExpenses, subscribeExpenses]);

  
  const balances = useMemo(() => {
    const map: Record<string, number> = {};

    for (const e of expenses) {
      const total = e.amount;
      const payer = e.payer;

      if (e.split === "equal") {
        const perHead = total / trip.members.length;
        for (const m of trip.members) {
          if (!map[m]) map[m] = 0;
          map[m] -= perHead;
        }
        map[payer] += total;
      } else if (e.split === "custom" && e.shares) {
        for (const [m, share] of Object.entries(e.shares)) {
          if (!map[m]) map[m] = 0;
          map[m] -= share;
        }
        map[payer] += total;
      }
    }

    return map;
  }, [expenses, trip.members]);

  
  const transfers = useMemo(() => {
    const creditors: { name: string; amount: number }[] = [];
    const debtors: { name: string; amount: number }[] = [];

    for (const [person, balance] of Object.entries(balances)) {
      if (balance > 0.01) creditors.push({ name: person, amount: balance });
      else if (balance < -0.01) debtors.push({ name: person, amount: -balance });
    }

    const results: { from: string; to: string; amount: number }[] = [];

    while (creditors.length && debtors.length) {
      const c = creditors[0];
      const d = debtors[0];
      const amt = Math.min(c.amount, d.amount);

      results.push({ from: d.name, to: c.name, amount: parseFloat(amt.toFixed(2)) });

      c.amount -= amt;
      d.amount -= amt;

      if (c.amount < 0.01) creditors.shift();
      if (d.amount < 0.01) debtors.shift();
    }

    return results;
  }, [balances]);

  return (
    <div className="card">
      <h2>Debt Summary for {trip.name}</h2>

      {transfers.length === 0 ? (
        <p>All settled up!</p>
      ) : (
        <ul className="debt-list">
          {transfers.map((t, idx) => (
            <li key={idx}>
              <strong>{t.from}</strong> → <strong>{t.to}</strong>: {t.amount.toFixed(2)}{" "}
              {trip.currency}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
