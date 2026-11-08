import { Link, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import EventPage from './pages/EventPage.jsx'
import EventForm from './pages/EventForm.jsx'
import './App.css'

function App() {
  return (
    <>
      <header className="site-header">
        <Link to="/" className="logo">🌸 Local Bloom</Link>
        <Link to="/events/new" className="header-action">+ Post an event</Link>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events/new" element={<EventForm />} />
          <Route path="/events/:id" element={<EventPage />} />
          <Route path="*" element={<p className="status">Page not found.</p>} />
        </Routes>
      </main>
    </>
  )
}

export default App
