import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { type Trip, useFirestore } from "../hooks/useFirestore"
import ChatSection from "../components/ChatSection"
import ExpenseForm from "../components/ExpenseForm"
import ExpenseList from "../components/ExpenseList"
import DebtSummary from "../components/DebtSummary"
import ReceiptUpload from "../components/ReceiptUpload"
import AnalyticsDashboard from "../components/AnalyticsDashboard"
import ExpenseMap from "../components/ExpenseMap"
import ItineraryView from "../components/ItineraryView"
import CurrencyConverter from "../components/CurrencyConverter"

export default function TripDetails() {
  const { name } = useParams<{ name: string }>()
  const { getTrips } = useFirestore()

  // Memoized trips list
  const tripsList = useMemo(() => getTrips() || [], [getTrips])

  // Memoized trip object
  const trip = useMemo(() => {
    if (!name) return undefined
    return tripsList.find(
      (t) => t.name.toLowerCase().trim() === name.toLowerCase().trim()
    )
  }, [name, tripsList])

  const [ocrText, setOcrText] = useState("")
  const [ocrAmount, setOcrAmount] = useState<number | undefined>(undefined)

  if (!trip) {
    return (
      <div className="card">
        <p>Trip not found.</p>
        <Link className="btn" to="/trips">Back to Trips</Link>
      </div>
    )
  }

  return (
    <div className="trip-details">
      <h1>{trip.name}</h1>
      <div>Members: {trip.members.join(", ") || "—"}</div>

      <div className="grid-2">
        <div className="stack">
          <ReceiptUpload
            onExtracted={(text, amount) => {
              setOcrText(text)
              setOcrAmount(amount)
            }}
          />
          <ExpenseForm
            trip={trip}
            prefillDescription={ocrText ? "OCR: " + ocrText.split("\n")[0].slice(0, 32) : ""}
            prefillAmount={ocrAmount}
          />
          <ExpenseList trip={trip} />
          <DebtSummary trip={trip} />
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
        <Link className="btn" to="/trips">← Back to Trips</Link>
      </div>
    </div>
  )
}
