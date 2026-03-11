interface ConnectPanelProps {
  sectionNum: string
  title: string
  envKey: string
  note: string
}

export function ConnectPanel({ sectionNum, title, envKey, note }: ConnectPanelProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 220,
        border: '1px dashed rgba(240,237,232,0.12)',
        padding: '32px 24px',
        gap: 12,
        textAlign: 'center',
      }}
    >
      <span
        style={{
          fontFamily: "ui-monospace, 'SF Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.15em',
          color: '#605850',
          textTransform: 'uppercase',
        }}
      >
        {sectionNum} / {title}
      </span>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: "ui-monospace, 'SF Mono', monospace",
          fontSize: 10,
          color: '#605850',
          border: '1px solid rgba(240,237,232,0.08)',
          padding: '3px 8px',
          marginTop: 4,
        }}
      >
        <span style={{ color: '#605850', fontSize: 8 }}>●</span>
        DISCONNECTED
      </div>

      <p
        style={{
          fontFamily: "ui-monospace, 'SF Mono', monospace",
          fontSize: 11,
          color: '#605850',
          marginTop: 8,
        }}
      >
        API key required
      </p>
      <p
        style={{
          fontFamily: "ui-monospace, 'SF Mono', monospace",
          fontSize: 10,
          color: '#403830',
          background: 'rgba(240,237,232,0.03)',
          padding: '4px 10px',
          border: '1px solid rgba(240,237,232,0.06)',
        }}
      >
        {envKey}
      </p>
      <p
        style={{
          fontFamily: "ui-monospace, 'SF Mono', monospace",
          fontSize: 10,
          color: '#403830',
          marginTop: 4,
          maxWidth: 240,
          lineHeight: 1.5,
        }}
      >
        {note}
      </p>
    </div>
  )
}
