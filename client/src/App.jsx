import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import EventPage from './pages/EventPage.jsx'
import EventForm from './pages/EventForm.jsx'
import VenuesPage from './pages/VenuesPage.jsx'
import Filters from './components/Filters.jsx'
import './App.css'

function App() {
  // On the home page the header doubles as the filter bar and the grid runs edge to edge
  const isHome = useLocation().pathname === '/'

  return (
    <>
      <header className="site-header">
        <Link to="/" className="logo">Local Bloom</Link>
        {isHome && <Filters />}
        <Link to="/events/new" className="post-button">
          <span className="post-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          Post
        </Link>
      </header>
      <main className={isHome ? 'home' : undefined}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/venues" element={<VenuesPage />} />
          {/* Keys stop React reusing form state when switching between create and edit */}
          <Route path="/events/new" element={<EventForm key="new" />} />
          <Route path="/events/:id/edit" element={<EventForm key="edit" />} />
          <Route path="/events/:id" element={<EventPage />} />
          <Route path="*" element={<p className="status">Page not found.</p>} />
        </Routes>
      </main>
    </>
  )
}

export default App
