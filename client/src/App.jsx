import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import EventPage from './pages/EventPage.jsx'
import EventForm from './pages/EventForm.jsx'
import VenuesPage from './pages/VenuesPage.jsx'
import VenueForm from './pages/VenueForm.jsx'
import MyEventsPage from './pages/MyEventsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import Filters from './components/Filters.jsx'
import UserMenu from './components/UserMenu.jsx'
import { LOGIN_URL, RequireAuth, useAuth } from './AuthContext.jsx'
import logo from './assets/logo.svg'
import './App.css'

function App() {
  // On the home page the header doubles as the filter bar and the grid runs edge to edge
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  // Event pages, the create/edit forms, the venue/event lists and the profile share the cream background
  const isCream =
    /^\/events\/\d+$/.test(pathname) ||
    /^\/events\/(new|\d+\/edit)$/.test(pathname) ||
    /^\/venues(\/(new|\d+\/edit))?$/.test(pathname) ||
    pathname === '/my-events' ||
    pathname === '/profile'
  const { user, loading } = useAuth()

  return (
    <>
      <header className={`site-header${isCream ? ' on-cream' : ''}`}>
        <Link to="/" className="logo">
          <img className="logo-mark" src={logo} alt="" />
          Local Bloom
        </Link>
        {isHome && <Filters />}
        <div className="header-actions">
          <Link to="/events/new" className="post-button">
            <span className="post-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            Post
          </Link>
          {!loading &&
            (user ? (
              <UserMenu />
            ) : (
              <a href={LOGIN_URL} className="secondary-button">
                Log in with GitHub
              </a>
            ))}
        </div>
      </header>
      <main className={isHome ? 'home' : isCream ? 'cream' : undefined}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/venues"
            element={
              <RequireAuth>
                <VenuesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/venues/new"
            element={
              <RequireAuth>
                <VenueForm key="new" />
              </RequireAuth>
            }
          />
          <Route
            path="/venues/:id/edit"
            element={
              <RequireAuth>
                <VenueForm key="edit" />
              </RequireAuth>
            }
          />
          <Route
            path="/my-events"
            element={
              <RequireAuth>
                <MyEventsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          {/* Keys stop React reusing form state when switching between create and edit */}
          <Route
            path="/events/new"
            element={
              <RequireAuth>
                <EventForm key="new" />
              </RequireAuth>
            }
          />
          <Route
            path="/events/:id/edit"
            element={
              <RequireAuth>
                <EventForm key="edit" />
              </RequireAuth>
            }
          />
          <Route path="/events/:id" element={<EventPage />} />
          <Route path="*" element={<p className="status">Page not found.</p>} />
        </Routes>
      </main>
    </>
  )
}

export default App
