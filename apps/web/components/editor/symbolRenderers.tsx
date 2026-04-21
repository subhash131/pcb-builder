/**
 * symbolRenderers.tsx
 *
 * Data-driven SVG renderer map for schematic symbols.
 *
 * Each entry renders into a shared 100×100 viewBox coordinate space so that
 * SymbolShape.tsx can treat all symbols identically — no switch statements.
 *
 * ── HOW TO ADD A NEW SYMBOL ──────────────────────────────────────────────
 *  1. Add the type to `SymbolType` in packages/core/src/symbolDefs.ts.
 *  2. Add a PinDef array & dimensions to SYMBOL_DEFS there.
 *  3. Add a render function here.
 *  That's it. SymbolShape.tsx needs zero changes.
 * ─────────────────────────────────────────────────────────────────────────
 */
import type { SymbolType } from '@workspace/core'

export type SymbolRenderer = (id: string) => React.ReactNode

// All symbols render in a normalised 100×100 viewBox.
// Pin stubs always go from the shape edge (0 or 100) to the body boundary (~20/80).
// Body occupies the 20–80 range on the active axis.

const renderResistor: SymbolRenderer = () => (
  <g stroke="black" strokeWidth="2.5" fill="none">
    {/* Left pin stub */}
    <line x1="0" y1="50" x2="20" y2="50" />
    {/* IEC body rectangle */}
    <rect x="20" y="30" width="60" height="40" />
    {/* Right pin stub */}
    <line x1="80" y1="50" x2="100" y2="50" />
  </g>
)

const renderCapacitor: SymbolRenderer = () => (
  <g stroke="black" strokeWidth="2.5" fill="none">
    {/* Left pin stub */}
    <line x1="0" y1="50" x2="45" y2="50" />
    {/* Plate 1 */}
    <line x1="45" y1="20" x2="45" y2="80" />
    {/* Plate 2 */}
    <line x1="55" y1="20" x2="55" y2="80" />
    {/* Right pin stub */}
    <line x1="55" y1="50" x2="100" y2="50" />
  </g>
)

const renderLed: SymbolRenderer = (id) => {
  const markerId = `led-arrow-${id}`
  return (
    <g stroke="black" strokeWidth="2.5" fill="none">
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
        </marker>
      </defs>
      {/* Anode (left) pin stub */}
      <line x1="0" y1="50" x2="25" y2="50" />
      {/* Diode triangle — points right (conventional current) */}
      <polygon points="25,20 25,80 65,50" fill="black" stroke="black" strokeWidth="1.5" />
      {/* Cathode bar */}
      <line x1="65" y1="20" x2="65" y2="80" />
      {/* Cathode (right) pin stub */}
      <line x1="65" y1="50" x2="100" y2="50" />
      {/* Light emission arrows */}
      <line x1="48" y1="18" x2="60" y2="4" markerEnd={`url(#${markerId})`} />
      <line x1="36" y1="14" x2="48" y2="0" markerEnd={`url(#${markerId})`} />
    </g>
  )
}

const renderIc: SymbolRenderer = () => (
  <g stroke="black" strokeWidth="2" fill="none">
    {/* IC body */}
    <rect x="20" y="10" width="60" height="80" fill="white" stroke="black" />
    {/* Left pins: y=25 and y=75 in the 100×100 space */}
    <line x1="0"   y1="25" x2="20"  y2="25" />
    <line x1="0"   y1="75" x2="20"  y2="75" />
    {/* Right pins */}
    <line x1="80"  y1="25" x2="100" y2="25" />
    <line x1="80"  y1="75" x2="100" y2="75" />
    {/* Pin labels */}
    <text x="25" y="28" fontSize="10" fill="black" stroke="none">IN</text>
    <text x="25" y="78" fontSize="10" fill="black" stroke="none">GND</text>
    <text x="60" y="28" fontSize="10" fill="black" stroke="none" textAnchor="end">OUT</text>
    <text x="60" y="78" fontSize="10" fill="black" stroke="none" textAnchor="end">VCC</text>
  </g>
)

/**
 * Map of SymbolType → render function.
 * Each function receives the shape ID (for scoped marker IDs) and returns SVG nodes
 * expected to be placed inside an `<svg viewBox="0 0 100 100">`.
 */
export const SYMBOL_RENDERERS: Record<SymbolType, SymbolRenderer> = {
  resistor:  renderResistor,
  capacitor: renderCapacitor,
  led:       renderLed,
  ic:        renderIc,
}
