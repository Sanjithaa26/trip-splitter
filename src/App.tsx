import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import TripDetails from "./pages/TripDetails";
import AddExpense from "./pages/AddExpense";
import CreateTripPage from "./pages/CreateTripPage"; 
import OfflineIndicator from "./components/OfflineIndicator";
import CurrencyPage from "./pages/CurrencyPage";
import ReceiptPage from "./pages/ReceiptPage";
import ChatPage from "./pages/ChatPage";
import TripList from "./components/TripList";
import AnalyticsPage from "./pages/AnalyticsPage";
import DebtSummary from "./components/DebtSummary"; 

export default function App() {
  return (
    <div className="app">
      <header className="app-header" role="banner" aria-label="Trip Planner Header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="Trip Planner Home">
            <span className="brand-name"><h1>Split Trip</h1></span>
          </Link>
          <nav className="nav" aria-label="Primary Navigation">
            <Link to="/" className="nav-link">
              Home
            </Link>
            <Link to="/add-expense" className="nav-link">
              Add Expense
            </Link>
            <Link to="/create-trip" className="nav-link">
              Create Trip
            </Link>
          </nav>
          <OfflineIndicator />
        </div>
      </header>

      <main className="container main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trips" element={<TripList />} />
          <Route path="/trip/:name" element={<TripDetails />} />
          <Route path="/add-expense" element={<AddExpense />} />
          <Route path="/create-trip" element={<CreateTripPage />} /> {/* ✅ new route */}
          <Route path="/currency" element={<CurrencyPage />} />
          <Route path="/ocr" element={<ReceiptPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/debts" element={<DebtSummary trip={{} as any} />} />

        </Routes>
      </main>

      <footer className="app-footer" role="contentinfo">
        <div className="container footer-inner">
          <p>Built with love for simpler group trips.</p>
        </div>
      </footer>
    </div>
  );
}
