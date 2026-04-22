import React, { useState } from 'react'
import type { ActiveLayer } from '../../../hooks/usePCBWiring'

interface PCBToolbarProps {
  isRouting: boolean
  activeLayer: ActiveLayer
  traceWidth: number
  onStartRouting: (layer: ActiveLayer) => void
  onStopRouting: () => void
  onLayerChange: (layer: ActiveLayer) => void
  onWidthChange: (w: number) => void
}

const TRACE_WIDTHS = [0.1, 0.15, 0.2, 0.25, 0.3, 0.5, 0.8, 1.0]

export function PCBToolbar({
  isRouting,
  activeLayer,
  traceWidth,
  onStartRouting,
  onStopRouting,
  onLayerChange,
  onWidthChange,
}: PCBToolbarProps) {
  const [showWidthMenu, setShowWidthMenu] = useState(false)

  const isFCu = activeLayer === 'F.Cu'

  const handleRouteClick = (layer: ActiveLayer) => {
    if (isRouting && activeLayer === layer) {
      onStopRouting()
    } else {
      onLayerChange(layer)
      onStartRouting(layer)
    }
  }

  const handleSelectClick = () => {
    onStopRouting()
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'flex-end',
      }}
    >
      {/* Main toolbar pill */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          background: 'rgba(4, 12, 20, 0.92)',
          border: '1px solid rgba(200, 160, 32, 0.2)',
          borderRadius: 14,
          padding: '10px 8px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          minWidth: 52,
        }}
      >
        {/* ── Select tool ── */}
        <ToolButton
          label="Select"
          active={!isRouting}
          onClick={handleSelectClick}
          title="Select / Move (Esc)"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 2l12 8-6 1-3 6L4 2z" fill="currentColor" />
          </svg>
        </ToolButton>

        <div style={{ height: 1, background: 'rgba(200,160,32,0.15)', margin: '4px 0' }} />

        {/* ── Route F.Cu ── */}
        <ToolButton
          label="F.Cu"
          active={isRouting && activeLayer === 'F.Cu'}
          activeColor="#c8a020"
          onClick={() => handleRouteClick('F.Cu')}
          title="Route trace on F.Cu (front copper)"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M3 14 L8 14 L14 8 L17 8"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="3" cy="14" r="2" fill="currentColor" />
            <circle cx="17" cy="8" r="2" fill="currentColor" />
          </svg>
        </ToolButton>

        {/* ── Route B.Cu ── */}
        <ToolButton
          label="B.Cu"
          active={isRouting && activeLayer === 'B.Cu'}
          activeColor="#4090e8"
          onClick={() => handleRouteClick('B.Cu')}
          title="Route trace on B.Cu (back copper)"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M3 8 L8 8 L14 14 L17 14"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="4 2"
            />
            <circle cx="3" cy="8" r="2" fill="currentColor" />
            <circle cx="17" cy="14" r="2" fill="currentColor" />
          </svg>
        </ToolButton>

        <div style={{ height: 1, background: 'rgba(200,160,32,0.15)', margin: '4px 0' }} />

        {/* ── Trace width button ── */}
        <div style={{ position: 'relative' }}>
          <ToolButton
            label={`${traceWidth}`}
            active={false}
            onClick={() => setShowWidthMenu(v => !v)}
            title={`Trace width: ${traceWidth} mm`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth={Math.max(1.5, traceWidth * 6)} strokeLinecap="round" />
            </svg>
          </ToolButton>

          {showWidthMenu && (
            <div
              style={{
                position: 'absolute',
                right: 56,
                top: 0,
                background: 'rgba(4,12,20,0.97)',
                border: '1px solid rgba(200,160,32,0.25)',
                borderRadius: 10,
                padding: '6px 0',
                minWidth: 110,
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ padding: '4px 12px 8px', fontSize: 10, color: 'rgba(200,160,32,0.5)', fontFamily: 'monospace', letterSpacing: 1, textTransform: 'uppercase' }}>
                Trace Width
              </div>
              {TRACE_WIDTHS.map(w => (
                <button
                  key={w}
                  onClick={() => { onWidthChange(w); setShowWidthMenu(false) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '6px 12px',
                    background: traceWidth === w ? 'rgba(200,160,32,0.15)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: traceWidth === w ? '#c8a020' : '#aaa',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 32,
                    height: Math.max(2, w * 10),
                    background: traceWidth === w ? '#c8a020' : '#555',
                    borderRadius: 2,
                  }} />
                  {w} mm
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status badge */}
      {isRouting && (
        <div
          style={{
            background: activeLayer === 'F.Cu'
              ? 'rgba(200,160,32,0.15)'
              : 'rgba(64,144,232,0.15)',
            border: `1px solid ${activeLayer === 'F.Cu' ? 'rgba(200,160,32,0.4)' : 'rgba(64,144,232,0.4)'}`,
            borderRadius: 8,
            padding: '5px 10px',
            fontSize: 11,
            fontFamily: 'monospace',
            color: activeLayer === 'F.Cu' ? '#c8a020' : '#4090e8',
            backdropFilter: 'blur(8px)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          ● Routing {activeLayer} · {traceWidth}mm · ESC to cancel
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.65; }
        }
      `}</style>
    </div>
  )
}

// ─── Reusable tool button ─────────────────────────────────────────────────────

function ToolButton({
  children,
  label,
  active,
  activeColor = '#c8a020',
  onClick,
  title,
}: {
  children: React.ReactNode
  label?: string
  active: boolean
  activeColor?: string
  onClick: () => void
  title?: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        width: 44,
        height: 44,
        borderRadius: 10,
        border: active
          ? `1px solid ${activeColor}55`
          : hovered
          ? '1px solid rgba(200,160,32,0.2)'
          : '1px solid transparent',
        background: active
          ? `${activeColor}1a`
          : hovered
          ? 'rgba(200,160,32,0.08)'
          : 'transparent',
        color: active ? activeColor : hovered ? '#ddd' : '#777',
        cursor: 'pointer',
        padding: 0,
        transition: 'all 0.15s ease',
        boxShadow: active ? `0 0 10px ${activeColor}33` : 'none',
      }}
    >
      {children}
      {label && (
        <span style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: 0.5 }}>
          {label}
        </span>
      )}
    </button>
  )
}
