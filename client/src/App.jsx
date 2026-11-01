import { Link, Route, Routes } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <>
      <header className="site-header">
        <Link to="/" className="logo">🌸 Local Bloom</Link>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<p className="status">Events are coming soon.</p>} />
          <Route path="*" element={<p className="status">Page not found.</p>} />
        </Routes>
      </main>
    </>
  )
}

export default App
