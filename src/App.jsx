// =====================================================================
// App.jsx  -  the main screen of the "Purified Drinking Water" dashboard
//
// How this file is organised:
//   1. imports            -> bring in other files/tools we need
//   2. data               -> brands, payment options, helper functions
//   3. App component      -> state (memory), logic, and the screen (JSX)
// =====================================================================

// useState  = lets a component REMEMBER a value (when it changes, the screen redraws)
// useEffect = lets us run code AFTER the screen draws (used here for a timer)
import { useEffect, useState } from 'react'
// our page styles (colours, layout, animations)
import './App.css'
// the left side: tank, tap, podium and cans
import Stage from './Stage.jsx'
// the full-screen animation that plays after "Confirm payment"
import DeliveryScene from './DeliveryScene.jsx'
// the top banner, the insight tiles, and a hook that makes live temperature/purity numbers
import { Hero, Insights, useReadings } from './Insights.jsx'
// the cartoon QR popup shown when UPI is chosen
import UpiPopup from './Upipopup.jsx'

// ---------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------

// The list of water brands. Each brand has:
//   id   -> a short unique name used by the code
//   name -> what the customer sees
//   tag  -> small description under the name
//   rate -> price per litre in rupees
const BRANDS = [
  { id: 'crystal', name: 'Crystal Drop', tag: 'Everyday RO water', rate: 2.5 },
  { id: 'blueridge', name: 'Blue Ridge', tag: 'Added minerals', rate: 3 },
  { id: 'nirmal', name: 'Nirmal Jal', tag: 'Triple filtered', rate: 3.5 },
  { id: 'himvarsha', name: 'Himvarsha', tag: 'Spring source', rate: 4.5 },
  { id: 'aquaprime', name: 'Aqua Prime', tag: 'Alkaline', rate: 6 },
]

// Settings shared by all three small payment icons, so we write them only once.
// (They are spread into each <svg> below using {...iconProps}.)
const iconProps = {
  width: 22, // icon width in pixels
  height: 22, // icon height in pixels
  viewBox: '0 0 24 24', // the invisible drawing grid the icon is drawn on
  fill: 'none', // do not colour the inside of the shapes
  stroke: 'currentColor', // draw lines in the current text colour
  strokeWidth: 2, // line thickness
  strokeLinecap: 'round', // rounded line ends
  strokeLinejoin: 'round', // rounded corners
  'aria-hidden': true, // screen readers skip it (it is only decoration)
}

// The three payment options shown after "Bill me".
// Each has an id, a label, a small note, and an icon drawn with SVG.
const PAYMENTS = [
  {
    id: 'upi',
    label: 'UPI',
    note: 'Pay from any UPI app',
    icon: (
      <svg {...iconProps}>
        {/* a phone: rounded rectangle + a small line for the home button */}
        <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
        <path d="M11 18.5h2" />
      </svg>
    ),
  },
  {
    id: 'net',
    label: 'Net banking',
    note: 'Pay from your bank account',
    icon: (
      <svg {...iconProps}>
        {/* a bank building: roof triangle, pillars and a base line */}
        <path d="M3 9.5 12 4l9 5.5z" />
        <path d="M5.5 12v6M10 12v6M14 12v6M18.5 12v6M3 20.5h18" />
      </svg>
    ),
  },
  {
    id: 'cod',
    label: 'Cash on delivery',
    note: 'Pay when the water arrives',
    icon: (
      <svg {...iconProps}>
        {/* a banknote: rectangle with a circle in the middle */}
        <rect x="2.5" y="6" width="19" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.8" />
      </svg>
    ),
  },
]

// Turns a number into money text. money(12.5) -> "₹12.50"
// toFixed(2) forces exactly 2 digits after the decimal point.
const money = (n) => `₹${n.toFixed(2)}`

// Turns a number into plain text without extra zeros. plain(2.50) -> "2.5"
// toFixed(2) rounds, the "+" turns it back into a number (drops extra zeros),
// String() turns it into text again.
const plain = (n) => String(+n.toFixed(2))

// A small custom "hook". It gives back `value`, but only AFTER the value has
// stopped changing for `ms` milliseconds. We use it so the "Approx amount"
// box waits until the user is done typing.
function useDebounced(value, ms) {
  // v = the delayed copy of value (starts equal to value)
  const [v, setV] = useState(value)
  useEffect(() => {
    // every time `value` changes, start a countdown; when it ends, copy the value
    const t = setTimeout(() => setV(value), ms)
    // if value changes again before the countdown ends, cancel the old countdown
    return () => clearTimeout(t)
  }, [value, ms]) // run this effect again whenever value (or ms) changes
  return v // hand the delayed copy back
}

// ---------------------------------------------------------------------
// THE APP COMPONENT  (a component = a function that returns screen content)
// ---------------------------------------------------------------------
export default function App() {
  // ---- STATE: values the app remembers --------------------------------
  // Each line is:  [currentValue, functionToChangeIt] = useState(startValue)

  // the text inside the "How many litres" box (kept as text, e.g. "5" or "3.4")
  const [liters, setLiters] = useState('')
  // which brand is chosen (its id), or null if none yet
  const [brandId, setBrandId] = useState(null)
  // true after the user presses "Bill me" (shows the bill + payment options)
  const [billed, setBilled] = useState(false)
  // which payment method is chosen ('upi' / 'net' / 'cod'), or null
  const [payId, setPayId] = useState(null)
  // true while the full-screen delivery animation is playing
  const [delivering, setDelivering] = useState(false)
  // a counter; changing it makes React rebuild the Stage from scratch (used by Reorder)
  const [stageKey, setStageKey] = useState(0)
  // a counter; every time it goes up, the Stage sends the can back to the shelf
  const [releaseKey, setReleaseKey] = useState(0)
  // true while the UPI QR popup is open
  const [qrOpen, setQrOpen] = useState(false)
  // live temperature / purity / pH / ppm numbers (they drift every few seconds)
  const readings = useReadings()

  // ---- DERIVED VALUES: worked out from the state above -----------------

  // litres as a real number. parseFloat("3.4") -> 3.4. If the box is empty, parseFloat gives
  // NaN (not a number), and `|| 0` replaces that with 0.
  const litersNum = parseFloat(liters) || 0
  // the litres text, but delayed until typing stops for 700 ms
  const settledLiters = useDebounced(liters, 700)
  // the delayed litres as a number
  const settledNum = parseFloat(settledLiters) || 0
  // if the live text differs from the delayed text, the user is still typing (or a can is filling)
  const stillTyping = liters !== settledLiters
  // find the full brand object that matches brandId; if none matches, use null
  const brand = BRANDS.find((b) => b.id === brandId) || null
  // total price = litres x rate (0 if no brand is chosen yet)
  const total = brand ? litersNum * brand.rate : 0
  // "Bill me" works only when litres > 0 AND a brand is chosen
  const canBill = litersNum > 0 && brand !== null

  // ---- EVENT FUNCTIONS: run when the user does something ---------------

  // Runs when the user TYPES in the litres box.
  const onLiters = (e) => {
    // e.target.value = what is now in the box.
    // 1) remove everything except digits and dots  2) split at the dots
    const parts = e.target.value.replace(/[^\d.]/g, '').split('.')
    // keep at most 3 digits before the dot, and at most 1 digit after the first dot
    const clean = parts[0].slice(0, 3) + (parts.length > 1 ? '.' + parts[1].slice(0, 1) : '')
    // save the cleaned text into the box
    setLiters(clean)
    // the old bill is now wrong, so hide it
    setBilled(false)
    // tell the Stage: "send the can back to the shelf and empty it"
    setReleaseKey((k) => k + 1)
  }

  // Runs when the Stage reports the can's fill level while water is pouring.
  const onFill = (text) => {
    // show the filled litres in the box (this does NOT empty the can)
    setLiters(text)
    // hide any old bill because the amount changed
    setBilled(false)
  }

  // Runs when the user picks a payment method.
  const choosePay = (id) => {
    // UPI is special: open the QR popup first; it is selected only after pressing OK
    if (id === 'upi') setQrOpen(true)
    // the other methods are selected straight away
    else setPayId(id)
  }

  // Runs when the user picks a brand.
  const pickBrand = (id) => {
    setBrandId(id) // remember the brand
    setBilled(false) // the price changed, so hide the old bill
  }

  // Runs when the user presses "Reorder": put everything back to the start.
  const reorder = () => {
    setLiters('') // empty litres box
    setBrandId(null) // no brand
    setBilled(false) // no bill
    setPayId(null) // no payment method
    setQrOpen(false) // QR popup closed
    setDelivering(false) // close the delivery animation
    setStageKey((k) => k + 1) // new key = fresh tank, tap and cans
    window.scrollTo({ top: 0 }) // scroll back to the top of the page
  }

  // ---- HELPER TEXT shown under the "Bill me" button --------------------
  // Tells the user what is still missing.
  let helper = ''
  if (litersNum <= 0 && !brand) helper = 'Enter the litres you need and pick a brand.'
  else if (litersNum <= 0) helper = 'Enter the litres you need.'
  else if (!brand) helper = 'Pick a brand.'
  // if nothing is missing, helper stays '' and no message is shown

  // ---- THE SCREEN (JSX = HTML-like code inside JavaScript) ------------
  return (
    // <main> is the whole page
    <main className="app">
      {/* the big rounded frosted container */}
      <div className="shell">
        {/* top banner with title and live readings; r = the readings numbers */}
        <Hero r={readings} />

        {/* two-column area: stage on the left, order panel on the right */}
        <div className="layout">
          {/* LEFT CARD: tank, tap, podium, cans */}
          <section className="card stage-card" aria-label="Tank, tap and cans">
            {/* key   -> changing it rebuilds the Stage (Reorder uses this)
                onFill -> function the Stage calls while filling
                releaseKey -> when it changes, the Stage returns the can to the shelf */}
            <Stage key={stageKey} onFill={onFill} releaseKey={releaseKey} />
          </section>

          {/* RIGHT CARD: the order form */}
          <section className="card order-card" aria-label="Place your order">
            {/* ---------- litres box ---------- */}
            <div>
              {/* htmlFor links this label to the input with id="liters" */}
              <label htmlFor="liters" className="field-title">
                How many litres do you need?
              </label>
              <div className="liters-box">
                {/* inputMode="decimal" shows a number keypad on phones
                    value={liters}  -> the box always shows our state
                    onChange        -> runs onLiters on every key press */}
                <input
                  id="liters"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0"
                  value={liters}
                  onChange={onLiters}
                />
                <span>litres</span>
              </div>
            </div>

            {/* ---------- approx amount box ---------- */}
            {/* aria-live: screen readers announce when the text inside changes */}
            <div className="approx-box" aria-live="polite">
              <span className="approx-label">Approx amount</span>
              {/* three possible contents, chosen with ? : (if / else) */}
              {stillTyping ? (
                // 1) still typing or filling -> show a waiting message
                <span className="approx-wait">Calculating…</span>
              ) : settledNum > 0 && brand ? (
                // 2) litres entered AND brand chosen -> show the sum, e.g. 5 L × ₹2.5 = ₹12.50
                <div className="approx-sum">
                  <span className="approx-formula">
                    {plain(settledNum)} L × ₹{plain(brand.rate)}
                  </span>
                  <strong className="approx-total">= {money(settledNum * brand.rate)}</strong>
                </div>
              ) : (
                // 3) something is missing -> say what
                <span className="approx-wait">
                  {settledNum > 0 ? 'Pick a brand to see the amount' : 'Enter litres and pick a brand'}
                </span>
              )}
            </div>

            {/* ---------- brand list ---------- */}
            {/* fieldset + legend groups the radio buttons under one heading */}
            <fieldset className="brands">
              <legend className="field-title">Choose a brand</legend>
              {/* shows the chosen brand's rate, or a hint if none is chosen */}
              <p className="rate-line">
                {brand ? `Rate: ${money(brand.rate)} per litre` : 'Rate per litre appears when you pick a brand'}
              </p>
              {/* .map() loops over BRANDS and draws one row for each brand */}
              {BRANDS.map((b) => (
                // key helps React tell the rows apart.
                // "is-on" is added to the chosen row so CSS can highlight it.
                <label key={b.id} className={`choice ${brandId === b.id ? 'is-on' : ''}`}>
                  {/* a real radio button, hidden visually (sr-only) but still usable with keyboard.
                      checked  -> true only for the chosen brand
                      onChange -> runs when this brand is clicked */}
                  <input
                    type="radio"
                    name="brand"
                    className="sr-only"
                    checked={brandId === b.id}
                    onChange={() => pickBrand(b.id)}
                  />
                  {/* the round dot we draw ourselves */}
                  <span className="dot" aria-hidden="true" />
                  <span className="choice-main">
                    <strong>{b.name}</strong>
                    <small>{b.tag}</small>
                  </span>
                  <span className="choice-rate">
                    {money(b.rate)}
                    <small> / L</small>
                  </span>
                </label>
              ))}
            </fieldset>

            {/* ---------- "Bill me" button ---------- */}
            <div>
              {/* disabled = greyed out until litres and brand are both set
                  onClick  = show the bill section */}
              <button
                type="button"
                className="btn btn-primary btn-wide"
                disabled={!canBill}
                onClick={() => setBilled(true)}
              >
                Bill me
              </button>
              {/* only draw the helper line if it has text (&& means "and then draw") */}
              {helper && <p className="helper">{helper}</p>}
            </div>

            {/* ---------- bill + payment (slides open after "Bill me") ---------- */}
            {/* class "open" is added when billed is true; CSS animates the slide.
                aria-hidden hides it from screen readers while it is closed */}
            <div className={`reveal ${billed ? 'open' : ''}`} aria-hidden={!billed}>
              <div className="reveal-inner">
                {/* the bill */}
                <div className="bill">
                  <div className="bill-row">
                    <span>Brand</span>
                    {/* ?. means "if brand exists, read its name" (avoids an error when brand is null) */}
                    <strong>{brand?.name}</strong>
                  </div>
                  <div className="bill-row">
                    <span>
                      {litersNum} L × {brand ? money(brand.rate) : ''}
                    </span>
                    <strong>{money(total)}</strong>
                  </div>
                  <div className="bill-row bill-total">
                    <span>Net pay</span>
                    <strong>{money(total)}</strong>
                  </div>
                </div>

                {/* payment choices */}
                <fieldset className="pay">
                  <legend className="field-title">Pay with</legend>
                  {/* one row per payment option */}
                  {PAYMENTS.map((p) => (
                    <label key={p.id} className={`choice pay-choice ${payId === p.id ? 'is-on' : ''}`}>
                      {/* checked  -> true for the selected method
                          onChange -> choosePay (UPI opens the QR popup, others select directly)
                          onClick  -> also open the popup if UPI is clicked again while already selected,
                                      because onChange does not fire for an already-selected radio */}
                      <input
                        type="radio"
                        name="payment"
                        className="sr-only"
                        checked={payId === p.id}
                        onChange={() => choosePay(p.id)}
                        onClick={() => {
                          if (p.id === 'upi') setQrOpen(true)
                        }}
                      />
                      {/* the small icon from the PAYMENTS list */}
                      <span className="pay-icon">{p.icon}</span>
                      <span className="choice-main">
                        <strong>{p.label}</strong>
                        <small>{p.note}</small>
                      </span>
                      <span className="dot" aria-hidden="true" />
                    </label>
                  ))}
                </fieldset>

                {/* disabled until a payment method is chosen;
                    clicking it starts the delivery animation */}
                <button
                  type="button"
                  className="btn btn-go btn-wide"
                  disabled={!payId}
                  onClick={() => setDelivering(true)}
                >
                  Confirm payment
                </button>
                <p className="helper">Demo only. No payment details are collected.</p>
              </div>
            </div>
          </section>
        </div>

        {/* bottom tiles: purity ring, charts, nature pictures */}
        <Insights r={readings} />
      </div>

      {/* UPI QR popup: drawn only while qrOpen is true */}
      {qrOpen && (
        <UpiPopup
          // the amount shown on the popup
          amount={money(total)}
          // OK pressed -> mark UPI as the chosen method and close the popup
          onOk={() => {
            setPayId('upi')
            setQrOpen(false)
          }}
          // Escape key or click outside -> just close, UPI stays unselected
          onCancel={() => setQrOpen(false)}
        />
      )}

      {/* delivery animation: drawn only while delivering is true;
          its Reorder button calls reorder() to reset everything */}
      {delivering && <DeliveryScene onReorder={reorder} />}
    </main>
  )
}