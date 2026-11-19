// Small inline spinner for buttons and page elements. Hidden from screen readers:
// the text next to it ("Saving…") already says what's happening.
function Spinner() {
  return <span className="spinner" aria-hidden="true" />
}

export default Spinner
