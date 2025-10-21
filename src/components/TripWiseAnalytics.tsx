"use client";

import { useEffect, useState, useMemo } from "react";
import { useFirestore, type Trip, type Expense } from "../hooks/useFirestore";

export default function TripAnalyticsAll() {
  const { getTrips, getExpenses } = useFirestore();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Record<string, Expense[]>>({});

  useEffect(() => {
    const allTrips = getTrips();
    setTrips(allTrips);

    // Load all trip expenses
    const allExpenses: Record<string, Expense[]> = {};
    for (const t of allTrips) {
      allExpenses[t.id] = getExpenses(t.id);
    }
    setExpenses(allExpenses);
  }, [getTrips, getExpenses]);

  const analytics = useMemo(() => {
    const summary: {
      [tripId: string]: {
        total: number;
        perCategory: Record<string, number>;
      };
    } = {};

    for (const t of trips) {
      const exps = expenses[t.id] || [];
      const perCategory: Record<string, number> = {};
      let total = 0;

      for (const e of exps) {
        total += e.amount;
        perCategory[e.category] = (perCategory[e.category] || 0) + e.amount;
      }

      summary[t.id] = { total, perCategory };
    }

    return summary;
  }, [trips, expenses]);

  const overallTotal = useMemo(
    () => Object.values(analytics).reduce((sum, a) => sum + a.total, 0),
    [analytics]
  );

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Trip-wise Analytics Overview</h2>

      <div className="grid gap-6 md:grid-cols-2">
        {trips.map((trip) => {
          const data = analytics[trip.id];
          if (!data) return null;
          return (
            <div key={trip.id} className="bg-black dark:bg-gray-800 rounded-xl shadow p-4">
              <h3 className="text-xl font-bold mb-2">
                {trip.name} ({trip.currency})
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Members: {trip.members.join(", ")}
              </p>

              <p className="font-medium">
                Total Spend: <span className="font-semibold">{data.total.toFixed(2)}</span>
              </p>

              {Object.entries(data.perCategory).length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold mb-1">Category Breakdown:</h4>
                  <ul className="text-sm space-y-1">
                    {Object.entries(data.perCategory).map(([cat, val]) => (
                      <li key={cat} className="flex justify-between border-b border-gray-200 dark:border-gray-700 py-1">
                        <span>{cat}</span>
                        <span>{val.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
