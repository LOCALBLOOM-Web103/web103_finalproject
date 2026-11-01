import { Link, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import './App.css'

function App() {
  return (
    <>
      <header className="site-header">
        <Link to="/" className="logo">🌸 Local Bloom</Link>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="*" element={<p className="status">Page not found.</p>} />
        </Routes>
      </main>
    </>
  )
}

export default App
