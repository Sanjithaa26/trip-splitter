"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { type Expense, type Trip, useFirestore } from "../hooks/useFirestore";

type Props = { trip: Trip };

export default function ExpenseMap({ trip }: Props) {
  const { getExpenses, subscribeExpenses } = useFirestore();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Client-only state for map
  const [LeafletReady, setLeafletReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Dynamically add Leaflet CSS only on client to avoid TypeScript module declaration errors
      const leafletLink = document.createElement("link");
      leafletLink.rel = "stylesheet";
      leafletLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(leafletLink);

      const L = require("leaflet");

      // Fix default icon paths
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
        iconUrl: require("leaflet/dist/images/marker-icon.png"),
        shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
      });

      setLeafletReady(true);
    }
  }, []);

  useEffect(() => {
    const refresh = () => setExpenses(getExpenses(trip.id) || []);
    refresh();
    const unsubscribe = subscribeExpenses(trip.id, refresh);
    return () => unsubscribe?.();
  }, [trip.id]);

  const points = useMemo(() => expenses.filter(e => e.location), [expenses]);
  const center: [number, number] = points.length > 0
    ? [points[0].location!.lat, points[0].location!.lng]
    : [0, 0];

  if (!LeafletReady) return <p>Loading map...</p>;

  // Dynamic imports for react-leaflet components (client only)
  const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false }) as any;
  const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false }) as any;
  const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false }) as any;
  const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false }) as any;

  return (
    <div className="card">
      <h3>Expenses Map</h3>
      {!points.length ? (
        <p>No locations yet. Add lat/lng to expenses.</p>
      ) : (
        <div style={{ height: 300 }}>
          <MapContainer center={center} zoom={4} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              {...({ attribution: '&copy; OpenStreetMap contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" } as any)}
            />
            {points.map(e => (
              <Marker key={e.id} position={[e.location!.lat, e.location!.lng]}>
                <Popup>
                  <strong>{e.description}</strong>
                  <br />
                  {e.category} • {trip.currency} {e.amount.toFixed(2)}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
