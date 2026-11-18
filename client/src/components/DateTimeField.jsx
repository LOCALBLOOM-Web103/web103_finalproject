import { useState } from 'react'
import DatePicker from './DatePicker.jsx'
import { formatTime, joinDateTime, parseTime, splitTime } from '../dateTime.js'

// A date (calendar popup) plus a time you type, like "6:30 PM".
// value and onChange use "YYYY-MM-DDTHH:mm"; onChange gets '' until both parts are valid.
// The parent only supplies the starting value; the fields keep their own draft while editing.
function DateTimeField({ label, value, onChange, minDate }) {
  const initialTime = value ? splitTime(value.slice(11)) : null
  const [date, setDate] = useState(value ? value.slice(0, 10) : '')
  const [timeText, setTimeText] = useState(
    initialTime ? formatTime(initialTime.h, initialTime.m) : '',
  )
  const [timeError, setTimeError] = useState(null)

  const emit = (nextDate, nextTimeText) => {
    const time = parseTime(nextTimeText)
    onChange(
      nextDate && time && !time.error ? joinDateTime(nextDate, time) : '',
    )
  }

  const changeDate = (iso) => {
    setDate(iso)
    emit(iso, timeText)
  }
  const changeTime = (text) => {
    setTimeText(text)
    setTimeError(null) // only complain once they've finished typing
    emit(date, text)
  }
  // On blur, show an error or tidy what was typed ("630pm" becomes "6:30 PM")
  const finishTime = () => {
    const time = parseTime(timeText)
    if (time?.error) setTimeError(time.error)
    else if (time) setTimeText(formatTime(time.h, time.m))
  }

  return (
    <div className="datetime" role="group" aria-label={label}>
      <span className="field-label">{label}</span>
      <DatePicker
        label={`${label} date`}
        value={date}
        onChange={changeDate}
        minDate={minDate}
      />
      <input
        value={timeText}
        onChange={(e) => changeTime(e.target.value)}
        onBlur={finishTime}
        placeholder="6:30 PM"
        autoComplete="off"
        aria-label={`${label} time`}
        aria-invalid={Boolean(timeError)}
        aria-describedby={timeError ? `${label}-time-error` : undefined}
      />
      {timeError && (
        <span
          className="field-hint error"
          id={`${label}-time-error`}
          role="alert"
        >
          {timeError}
        </span>
      )}
    </div>
  )
}

export default DateTimeField
