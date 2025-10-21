// Home page: lists all features as gradient cards (no Tailwind)
import { Link } from "react-router-dom";
import TripList from "../components/TripList";
import CurrencyConverter from "../components/CurrencyConverter";
import ReceiptUpload from "../components/ReceiptUpload";

const features = [
  { title: "Trips", desc: "View and open your trips", to: "/trips", anchor: false, gradient: "grad-1" },
  { title: "Create Trip", desc: "Add a new trip with members", to: "/create-trip", anchor: false, gradient: "grad-2" }, // ✅ updated
  { title: "Add Expense", desc: "Quickly add an expense", to: "/add-expense", anchor: false, gradient: "grad-3" },
  { title: "Debt Summary", desc: "Auto-simplify who owes whom", to: "/debts", anchor: false, gradient: "grad-4" },
  { title: "Currency Converter", desc: "Live exchange rates", to: "/currency", anchor: false, gradient: "grad-5" },
  { title: "Receipt OCR", desc: "Upload receipts and extract text", to: "/ocr", anchor: false, gradient: "grad-2" },
  { title: "Analytics", desc: "See category-wise spending", to: "/analytics", anchor: false, gradient: "grad-3" },
  { title: "Map", desc: "See expenses on a map", to: "/map", anchor: false, gradient: "grad-4" },
  { title: "Chat", desc: "Group chat/comments", to: "/chat", anchor: false, gradient: "grad-5" },
  { title: "Itinerary", desc: "Link expenses to itinerary", to: "/trip/:name/itinerary", anchor: false, gradient: "grad-1" },
];

export default function Home() {
  return (
    <div>
      <section className="hero">
        <h1 className="title text-balance">Plan. Split. Settle. Travel together.</h1>
        <p className="subtitle">All-in-one trip planning with expenses, debts, chat, maps, and more.</p>
      </section>

      <section className="feature-grid" aria-label="Features">
        {features.map((f) =>
          f.anchor ? (
            <a key={f.title} href={f.to} className={`feature-card ${f.gradient}`}>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </a>
          ) : (
            <Link key={f.title} to={f.to} className={`feature-card ${f.gradient}`}>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </Link>
          )
        )}
      </section>

      <div className="note">
        Explore more features by creating a trip and opening it from the Trips list. Debt Summary, Analytics, Map, Chat,
        and Itinerary live inside a trip’s details page.
      </div>
    </div>
  );
}
