import flower from '../assets/flower.svg'

// Spinning flower shown while a page's data loads
function Loading({ label = 'Loading…' }) {
  return (
    <div className="loading" role="status">
      <img className="loading-flower" src={flower} alt="" />
      <span>{label}</span>
    </div>
  )
}

export default Loading
