import { useState } from 'react'

const s = {
  bg: '#0a0a0f',
  surface: '#12121a',
  border: '#1e1e2e',
  coral: '#f97316',
  azure: '#64748b',
  text: '#f8fafc',
  muted: '#94a3b8',
}

interface Feature {
  icon: JSX.Element
  title: string
  desc: string
}

function Icon({ d }: { d: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={s.coral} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const features: Feature[] = [
  {
    icon: <Icon d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />,
    title: 'File Storage',
    desc: 'S3-compatible storage for all your digital assets. Upload, organize, and access files from anywhere.',
  },
  {
    icon: <Icon d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />,
    title: 'Organization',
    desc: 'Folders, tags, and smart search. Keep your assets organized with a powerful taxonomy system.',
  },
  {
    icon: <Icon d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />,
    title: 'Preview',
    desc: 'In-browser preview for images, PDFs, and videos. View any asset without downloading or switching apps.',
  },
  {
    icon: <Icon d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />,
    title: 'Sharing',
    desc: 'Secure file sharing with access controls. Share assets with teams or clients using expiring links.',
  },
  {
    icon: <Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    title: 'Versioning',
    desc: 'Track file versions and changes. Roll back to any previous version with a complete revision history.',
  },
  {
    icon: <Icon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    title: 'Usage Analytics',
    desc: 'Monitor storage usage and access patterns. Understand how your team uses assets to optimize workflows.',
  },
]

const nav: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '16px 32px', borderBottom: `1px solid ${s.border}`,
  position: 'sticky', top: 0, background: `${s.bg}ee`, backdropFilter: 'blur(12px)', zIndex: 50,
}

const btn: React.CSSProperties = {
  padding: '10px 24px', background: s.coral, color: '#fff', border: 'none',
  borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: 14, transition: 'opacity .2s',
}

const card: React.CSSProperties = {
  padding: 28, background: s.surface, borderRadius: 16,
  border: `1px solid ${s.border}`, transition: 'border-color .2s',
}

export default function LandingPage({ onSignIn }: { onSignIn: () => void }) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <nav style={nav}>
        <div style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.02em' }}>
          <span style={{ color: s.coral, fontWeight: 500 }}>clr</span>Vault
        </div>
        <button style={btn} onClick={onSignIn}>Sign In</button>
      </nav>

      <section style={{ textAlign: 'center', padding: '96px 24px 64px', maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontSize: 52, fontWeight: 300, lineHeight: 1.15, margin: '0 0 20px', letterSpacing: '-0.03em' }}>
          Digital Asset{' '}
          <span style={{ color: s.coral, fontWeight: 400 }}>Management</span>
        </h1>
        <p style={{ fontSize: 18, color: s.muted, fontWeight: 300, lineHeight: 1.7, margin: '0 0 40px' }}>
          Store, organize, and share your digital assets in one secure platform. S3-powered storage with smart search and version control.
        </p>
        <button style={{ ...btn, padding: '14px 36px', fontSize: 16 }} onClick={onSignIn}>
          Get Started
        </button>
      </section>

      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 96px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} style={{ ...card, borderColor: hovered === i ? s.coral + '44' : s.border }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <div style={{ marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 500, margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: s.muted, fontWeight: 300, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ textAlign: 'center', padding: '64px 24px 96px', borderTop: `1px solid ${s.border}` }}>
        <h2 style={{ fontSize: 32, fontWeight: 300, margin: '0 0 16px' }}>Ready to get started?</h2>
        <p style={{ color: s.muted, fontWeight: 300, margin: '0 0 32px' }}>
          Take control of your digital assets today.
        </p>
        <button style={{ ...btn, padding: '14px 36px', fontSize: 16 }} onClick={onSignIn}>
          Sign Up Free
        </button>
      </section>
    </div>
  )
}
