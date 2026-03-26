import { useEffect, type CSSProperties } from 'react';

const colors = {
  bg: '#FAFBFC',
  surface: 'rgba(255, 255, 255, 0.7)',
  surfaceElevated: 'rgba(255, 255, 255, 0.85)',
  border: 'rgba(0, 0, 0, 0.06)',
  borderLight: 'rgba(255, 255, 255, 0.5)',
  coral: '#FF4F28',
  coralHover: '#E8451F',
  azure: '#69859E',
  textPrimary: '#1A1D21',
  textSecondary: '#5C6370',
  textTertiary: '#9CA3AF',
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  shadowHover: '0 8px 16px -2px rgba(0, 0, 0, 0.08)',
};

const FONT_LINK_ID = 'clrtech-roboto-condensed';
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@100;300;400;500&display=swap';

function ensureFont() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(FONT_LINK_ID)) return;
  const link = document.createElement('link');
  link.id = FONT_LINK_ID;
  link.rel = 'stylesheet';
  link.href = FONT_URL;
  document.head.appendChild(link);
}

interface Feature { icon: string; title: string; description: string; }

const features: Feature[] = [
  { icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12", title: "File Storage", description: "S3-compatible storage for all your digital assets. Upload, organize, and access files from anywhere." },
  { icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z", title: "Organization", description: "Folders, tags, and smart search. Keep your assets organized with a powerful taxonomy system." },
  { icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z", title: "Preview", description: "In-browser preview for images, PDFs, and videos. View any asset without downloading or switching apps." },
  { icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z", title: "Sharing", description: "Secure file sharing with access controls. Share assets with teams or clients using expiring links." },
  { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", title: "Versioning", description: "Track file versions and changes. Roll back to any previous version with a complete revision history." },
  { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", title: "Usage Analytics", description: "Monitor storage usage and access patterns. Understand how your team uses assets to optimize workflows." },
];

export default function LandingPage({ onSignIn }: { onSignIn: () => void }) {
  useEffect(() => { ensureFont(); }, []);
  const year = new Date().getFullYear();

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <span style={styles.logo}>clrVault</span>
          <button
            style={styles.signInBtn}
            onClick={onSignIn}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.coralHover; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.01)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.coral; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            Sign In
          </button>
        </div>
      </nav>

      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>Digital Asset Management</h1>
        <p style={styles.heroDescription}>Store, organize, and share your digital assets in one secure platform. S3-powered storage with smart search and version control.</p>
        <button
          style={styles.heroCta}
          onClick={onSignIn}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.coralHover; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.01)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.coral; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          Get Started
        </button>
      </section>

      {features.length > 0 && (
        <section style={styles.featuresSection}>
          <div style={styles.featuresGrid}>
            {features.map((feature, i) => (
              <div
                key={i}
                style={styles.featureCard}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = colors.shadowHover; (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.01)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = colors.shadow; (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
              >
                <div style={styles.featureIconWrap}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={colors.azure} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d={feature.icon} />
                  </svg>
                </div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDesc}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer style={styles.footer}>
        <span style={styles.footerText}>Powered by clrTech Solutions &middot; {year}</span>
      </footer>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', background: colors.bg, fontFamily: "'Roboto Condensed', 'Segoe UI', system-ui, sans-serif", color: colors.textPrimary, display: 'flex', flexDirection: 'column' },
  nav: { position: 'sticky', top: 0, zIndex: 50, background: colors.surfaceElevated, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: `1px solid ${colors.border}` },
  navInner: { maxWidth: 1200, margin: '0 auto', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 20, fontWeight: 500, color: colors.textPrimary, letterSpacing: '-0.02em' },
  signInBtn: { padding: '10px 24px', background: colors.coral, color: '#FFFFFF', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 400, fontFamily: "'Roboto Condensed', 'Segoe UI', system-ui, sans-serif", cursor: 'pointer', transition: 'all 250ms ease' },
  hero: { maxWidth: 800, margin: '0 auto', padding: '120px 32px 80px', textAlign: 'center' as const },
  heroTitle: { fontSize: 56, fontWeight: 100, lineHeight: 1.1, margin: '0 0 24px', color: colors.textPrimary, letterSpacing: '-0.03em' },
  heroDescription: { fontSize: 18, fontWeight: 300, lineHeight: 1.6, color: colors.textSecondary, margin: '0 0 40px', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' },
  heroCta: { padding: '14px 40px', background: colors.coral, color: '#FFFFFF', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 400, fontFamily: "'Roboto Condensed', 'Segoe UI', system-ui, sans-serif", cursor: 'pointer', transition: 'all 250ms ease' },
  featuresSection: { maxWidth: 1200, margin: '0 auto', padding: '0 32px 100px' },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 },
  featureCard: { background: colors.surface, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${colors.borderLight}`, borderRadius: 16, padding: '32px', boxShadow: colors.shadow, transition: 'all 250ms ease' },
  featureIconWrap: { width: 48, height: 48, borderRadius: 12, background: 'rgba(105, 133, 158, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  featureTitle: { fontSize: 18, fontWeight: 400, margin: '0 0 8px', color: colors.textPrimary },
  featureDesc: { fontSize: 14, fontWeight: 300, lineHeight: 1.6, margin: 0, color: colors.textSecondary },
  footer: { marginTop: 'auto', padding: '32px', textAlign: 'center' as const, borderTop: `1px solid ${colors.border}` },
  footerText: { fontSize: 13, fontWeight: 300, color: colors.textTertiary },
};
