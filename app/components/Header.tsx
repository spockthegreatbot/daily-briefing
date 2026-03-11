'use client'

import { useEffect, useState } from 'react'
import { useRefresh } from './RefreshProvider'

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function formatBrisbanetime(date: Date): string {
  // Brisbane is UTC+10 always (no DST)
  const brisbane = new Date(date.getTime() + 10 * 60 * 60 * 1000)
  const day = DAYS[brisbane.getUTCDay()]
  const dd = brisbane.getUTCDate().toString().padStart(2, '0')
  const mon = MONTHS[brisbane.getUTCMonth()]
  const hh = brisbane.getUTCHours().toString().padStart(2, '0')
  const mm = brisbane.getUTCMinutes().toString().padStart(2, '0')
  return `${day} ${dd} ${mon} · ${hh}:${mm} AEST`
}

function timeAgo(from: Date, now: Date): string {
  const diffMs = now.getTime() - from.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin === 1) return '1m ago'
  return `${diffMin}m ago`
}

export function Header() {
  const [now, setNow] = useState<Date | null>(null)
  const { refreshedAt } = useRefresh()

  useEffect(() => {
    setNow(new Date())
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  const displayTime = now ? formatBrisbanetime(now) : ''
  const refreshLabel = now ? timeAgo(refreshedAt, now) : 'just now'

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 48,
        backgroundColor: '#16161A',
        borderBottom: '1px solid rgba(240,237,232,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      {/* Left */}
      <span
        style={{
          fontFamily: "ui-monospace, 'SF Mono', monospace",
          fontSize: 10,
          color: '#605850',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      >
        縁人 ENJIN / INTELLIGENCE
      </span>

      {/* Centre */}
      <span
        style={{
          fontFamily: "ui-monospace, 'SF Mono', monospace",
          fontSize: 11,
          color: '#A09890',
          letterSpacing: '0.06em',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        {displayTime}
      </span>

      {/* Right */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: "ui-monospace, 'SF Mono', monospace",
          fontSize: 10,
          color: '#605850',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
          }}
        />
        <span style={{ color: '#A09890' }}>LIVE</span>
        <span style={{ color: '#403830', marginLeft: 4 }}>refreshed {refreshLabel}</span>
      </div>
    </header>
  )
}
