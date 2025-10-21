import { useState, useEffect } from 'react';

type Trip = {
  id: string;
  name: string;
  currency: string;
  members: string[];
  createdAt: number;
};

type MarkerData = {
  name: string;
  coords: [number, number];
};

// Mock useFirestore hook for demonstration
function useFirestore() {
  const getTrips = () => {
    try {
      const raw = localStorage.getItem('tp_trips');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  return { getTrips };
}

// Geocode a place using Nominatim API
async function getCoordinates(place: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        place
      )}&limit=1`,
      { headers: { 'User-Agent': 'SplitTripApp/1.0' } }
    );

    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) return [lat, lon];
    }
    return null;
  } catch (err) {
    console.warn('Geocode error for', place, err);
    return null;
  }
}

export default function MapPage() {
  const { getTrips } = useFirestore();
  const [tripMarkers, setTripMarkers] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Load Leaflet CSS and JS
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(link);

    // Add custom styles for labels
    const style = document.createElement('style');
    style.textContent = `
      .trip-label {
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid #3b82f6;
        border-radius: 6px;
        padding: 4px 8px;
        font-weight: 600;
        font-size: 13px;
        color: #1f2937;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }
      .trip-label::before {
        display: none;
      }
    `;
    document.head.appendChild(style);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = () => {
      // Fix for default marker icon
      const L = (window as any).L;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      setMapReady(true);
    };
    document.body.appendChild(script);

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(style)) document.head.removeChild(style);
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  // Fetch trip coordinates
  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      
      const trips = getTrips();
      
      if (trips.length === 0) {
        setLoading(false);
        return;
      }

      const coordsPromises = trips.map(async (trip: Trip) => {
        const coords = await getCoordinates(trip.name);
        return coords ? { name: trip.name, coords } : null;
      });

      const results = (await Promise.all(coordsPromises)).filter(
        (r): r is MarkerData => r !== null
      );

      setTripMarkers(results);
      setLoading(false);
    };

    fetchTrips();
  }, []);

  // Initialize map with Leaflet
  useEffect(() => {
    if (!mapReady || tripMarkers.length === 0) return;

    const L = (window as any).L;
    
    // Create map
    const map = L.map('map-container').setView([20, 0], 2);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add markers with permanent labels
    const markers = tripMarkers.map((trip) => {
      const marker = L.marker([trip.coords[0], trip.coords[1]]).addTo(map);
      marker.bindPopup(`<strong>${trip.name}</strong>`);
      
      // Add permanent tooltip label
      marker.bindTooltip(trip.name, {
        permanent: true,
        direction: 'top',
        className: 'trip-label',
        offset: [0, -35]
      });
      
      return marker;
    });

    // Fit bounds to show all markers
    if (tripMarkers.length > 0) {
      const bounds = L.latLngBounds(tripMarkers.map(t => [t.coords[0], t.coords[1]]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Invalidate size after a short delay to ensure proper rendering
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
    };
  }, [mapReady, tripMarkers]);

  return (
    <div className="p-6 h-screen flex flex-col bg-gray-50">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Trip Locations</h1>
        <p className="text-gray-600 mt-1">
          {loading ? 'Loading...' : `${tripMarkers.length} destinations mapped`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1 bg-white rounded-2xl shadow-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Finding trip locations...</p>
          </div>
        </div>
      ) : tripMarkers.length === 0 ? (
        <div className="flex items-center justify-center flex-1 bg-white rounded-2xl shadow-lg">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-2">No trip locations found</p>
            <p className="text-gray-500 text-sm">
              Make sure your trip names include city or location names
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Example: "Paris Vacation 2024" or "Tokyo Trip"
            </p>
          </div>
        </div>
      ) : (
        <div 
          id="map-container"
          className="flex-1 rounded-2xl shadow-lg overflow-hidden"
          style={{ minHeight: '400px', zIndex: 0 }}
        />
      )}
    </div>
  );
}