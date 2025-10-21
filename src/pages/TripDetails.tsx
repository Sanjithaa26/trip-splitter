"use client";

import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { type Trip, useFirestore } from "../hooks/useFirestore";
import ChatSection from "../components/ChatSection";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseList from "../components/ExpenseList";
import DebtSummary from "../components/DebtSummary";
import ReceiptUpload from "../components/ReceiptUpload";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import ExpenseMap from "../components/ExpenseMap";
import ItineraryView from "../components/ItineraryView";
import CurrencyConverter from "../components/CurrencyConverter";
import DebtTrip from "../components/DebtTrip";

export default function TripDetails() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { getTrips, deleteTrip, getExpenses, deleteExpense } = useFirestore();

  const [tripsList, setTripsList] = useState<Trip[]>([]);
  const [ocrText, setOcrText] = useState("");
  const [ocrAmount, setOcrAmount] = useState<number | undefined>(undefined);

  useEffect(() => {
    setTripsList(getTrips() || []);
  }, [getTrips]);

  const trip = tripsList.find(
    (t) => t.name.toLowerCase().trim() === name?.toLowerCase().trim()
  );

  if (!trip) {
    return (
      <div className="card">
        <p>Trip not found.</p>
        <Link className="btn" to="/trips">
          Back to Trips
        </Link>
      </div>
    );
  }

  // Delete the trip along with all its expenses, chat, and itinerary
  const handleDeleteTrip = () => {
    if (
      window.confirm(
        `Are you sure you want to delete the trip "${trip.name}"? This cannot be undone.`
      )
    ) {
      // Delete all expenses for the trip
      const expenses = getExpenses(trip.id);
      for (const e of expenses) {
        deleteExpense(trip.id, e.id);
      }

      // Delete the trip itself
      deleteTrip(trip.id);

      // Navigate back to trips list
      navigate("/trips");
    }
  };

  return (
    <div className="trip-details">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>{trip.name}</h1>
        <button
          onClick={handleDeleteTrip}
          style={{
            background: "#e53935",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Delete Trip
        </button>
      </div>

      <div>Members: {trip.members.join(", ") || "—"}</div>

      <div className="grid-2">
        <div className="stack">
          <ReceiptUpload
            onExtracted={(text, amount) => {
              setOcrText(text);
              setOcrAmount(amount);
            }}
          />
          <ExpenseForm
            trip={trip}
            prefillDescription={
              ocrText ? "OCR: " + ocrText.split("\n")[0].slice(0, 32) : ""
            }
            prefillAmount={ocrAmount}
          />
          <ExpenseList trip={trip} />
          <DebtTrip trip={trip} /> {/* debts across all trips */}
        </div>

        <div className="stack">
          <AnalyticsDashboard trip={trip} />
          <ExpenseMap trip={trip} />
          <ChatSection trip={trip} />
          <ItineraryView trip={trip} />
          <CurrencyConverter />
        </div>
      </div>

      <div className="footer-nav">
        <Link className="btn" to="/trips">
          ← Back to Trips
        </Link>
      </div>
    </div>
  );
}
