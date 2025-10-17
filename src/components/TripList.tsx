import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { type Trip, useFirestore } from "../hooks/useFirestore"

export default function TripList() {
  const { getTrips, subscribeTrips } = useFirestore()
  const [trips, setTrips] = useState<Trip[]>([])

  const refresh = () => setTrips(getTrips() || [])

  useEffect(() => {
    refresh()
    return subscribeTrips(refresh)
  }, [])

  if (!trips.length) return <p>No trips yet. Create your first trip below!</p>

  return (
    <ul className="list">
      {trips.map((t) => (
        <li key={t.name} className="list-item">
          <div className="trip-card">
            <div className="trip-title">
              <h3>{t.name}</h3>
              <small>Base currency: {t.currency || "—"}</small>
            </div>
            <div className="trip-actions">
              <Link to={`/trip/${encodeURIComponent(t.name)}`} className="btn">
                Open
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
