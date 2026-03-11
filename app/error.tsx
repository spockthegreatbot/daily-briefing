'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#16161A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "ui-monospace, 'SF Mono', monospace",
    }}>
      <p style={{ color: '#C8102E', fontSize: '0.75rem', letterSpacing: '0.15em', marginBottom: '1rem' }}>
        CLIENT ERROR
      </p>
      <p style={{ color: '#F0EDE8', fontSize: '0.9rem', marginBottom: '0.5rem', maxWidth: 600, textAlign: 'center' }}>
        {error.message || 'Unknown error'}
      </p>
      {error.digest && (
        <p style={{ color: '#605850', fontSize: '0.7rem', marginBottom: '1.5rem' }}>
          digest: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          background: 'none',
          border: '1px solid rgba(240,237,232,0.15)',
          color: '#A09890',
          padding: '0.5rem 1.25rem',
          cursor: 'pointer',
          fontFamily: "ui-monospace, 'SF Mono', monospace",
          fontSize: '0.7rem',
          letterSpacing: '0.1em',
        }}
      >
        RETRY
      </button>
    </div>
  )
}
