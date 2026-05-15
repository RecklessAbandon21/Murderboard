import { SignInButton, SignUpButton } from '@clerk/clerk-react'
import { Brain, LayoutGrid, Layers, Zap } from 'lucide-react'

const FEATURES = [
  {
    Icon: Brain,
    title: "Your brain isn't linear. Stop forcing it.",
    body: 'You think in clusters, connections, "oh right that thing." Lists flatten everything into the same level of importance. That\'s the problem.',
  },
  {
    Icon: LayoutGrid,
    title: 'See everything. No hiding.',
    body: "Your whole project, laid out in front of you. Priorities. Blockers. The thing you've been avoiding. Hard to ignore it when it's staring back at you.",
  },
  {
    Icon: Layers,
    title: 'Infinite space for your chaos',
    body: "Your work doesn't fit into neat categories. So this doesn't have any. Make a mess. Then make it make sense.",
  },
  {
    Icon: Zap,
    title: 'Move things until they click',
    body: "Drop it. Drag it. Adjust. No systems to maintain. No structure to babysit. Just progress.",
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Make a board.',
    body: "Call it whatever. You'll rename it later anyway.",
  },
  {
    num: '02',
    title: 'Dump everything.',
    body: "Tasks, ideas, loose ends. Get it out of your head and onto something you can actually track and see.",
  },
  {
    num: '03',
    title: 'Start finishing things.',
    body: "Organize tasks. Mark them done. Clear space. Repeat until the list is gone and the work is done.",
  },
]

const FOR_WHO = [
  'visual thinkers',
  'overwhelmed builders',
  'list abandoners',
  'people who actually get things done',
]

export function LandingPage() {
  return (
    <div className="landing">
      {/* Nav — wordmark only, logo lives in the hero */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <span className="landing-wordmark">Murderboard</span>
          <div className="landing-nav-actions">
            <SignInButton mode="modal">
              <button className="landing-btn-ghost">Sign in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="landing-btn-primary">Get started</button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-glow" aria-hidden="true" />
        <div className="landing-container landing-hero-content">
          <div className="landing-hero-left">
            <img src="/logo.png" alt="Murderboard" className="landing-hero-logo" />
          </div>

          <div className="landing-hero-right">
            <p className="landing-eyebrow">∞ canvas · 0 excuses</p>
            <h1 className="landing-h1">
              You don't have too much to do.<br />You just can't see it all.
            </h1>
            <p className="landing-lead">
              Your list isn't helping. It's slowly killing your momentum. So kill it first.
            </p>
            <div className="landing-for-who">
              <span className="landing-for-who-label">Built for</span>
              {FOR_WHO.map((label) => (
                <span key={label} className="landing-for-who-tag">{label}</span>
              ))}
            </div>
            <div className="landing-hero-actions">
              <SignUpButton mode="modal">
                <button className="landing-btn-primary landing-btn-lg">🔪 Kill your list. →</button>
              </SignUpButton>
            </div>
          </div>
        </div>

        {/* App preview — same style as the ui-cleanup-proposals.html mockups */}
        <div className="landing-container landing-mockup-outer">
          <AppMockup />
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="landing-container">
          <h2 className="landing-section-title">Why your list had this coming</h2>
          <p className="landing-section-sub">
            Lists are fine. For groceries. Not for your actual work.
          </p>
          <div className="landing-features-grid">
            {FEATURES.map(({ Icon, title, body }) => (
              <div key={title} className="landing-feature-card">
                <div className="landing-feature-icon">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <h3 className="landing-feature-title">{title}</h3>
                <p className="landing-feature-body">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-how">
        <div className="landing-container">
          <h2 className="landing-section-title">So simple it's almost annoying</h2>
          <p className="landing-section-sub">No system. No setup. No pretending this is complicated.</p>
          <div className="landing-steps">
            {STEPS.map(({ num, title, body }) => (
              <div key={num} className="landing-step">
                <div className="landing-step-num">{num}</div>
                <h3 className="landing-step-title">{title}</h3>
                <p className="landing-step-body">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta-section">
        <div className="landing-cta-glow" aria-hidden="true" />
        <div className="landing-container landing-cta-content">
          <h2 className="landing-cta-title">
            Still using a list?<br />That explains a lot.
          </h2>
          <p className="landing-cta-sub">
            You don't need another system. You need to see what you're doing
            and start killing tasks instead of collecting them.
          </p>
          <SignUpButton mode="modal">
            <button className="landing-btn-primary landing-btn-lg">🔪 Make your first board. →</button>
          </SignUpButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-footer-brand">
            <img src="/logo.png" alt="" className="landing-small-logo" aria-hidden="true" />
            <span>Murderboard</span>
          </div>
          <div className="landing-footer-links">
            <a href="mailto:hello@murderboard.dev" className="landing-footer-link">Contact</a>
          </div>
          <p className="landing-footer-copy">
            © {new Date().getFullYear()} Murderboard · Your to-do list had this coming
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ─── App UI Mockup ─── */

function AppMockup() {
  return (
    <div className="mockup-frame">
      {/* Browser chrome */}
      <div className="mockup-chrome">
        <div className="mockup-chrome-dots">
          <span />
          <span />
          <span />
        </div>
      </div>

      {/* Screen */}
      <div className="mockup-screen">
        {/* TopBar */}
        <div className="mockup-topbar">
          <div className="mockup-brand">
            <img src="/logo.png" alt="" className="landing-small-logo" aria-hidden="true" />
            <strong>Murderboard</strong>
          </div>
          <div className="mockup-search">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Find on board…
          </div>
          <div className="mockup-topbar-actions">
            <span className="mockup-save-pill">Saved</span>
            <span className="mockup-chip">Archive</span>
            <span className="mockup-icon-sq">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="4" cy="8" r="1.25" fill="currentColor" />
                <circle cx="8" cy="8" r="1.25" fill="currentColor" />
                <circle cx="12" cy="8" r="1.25" fill="currentColor" />
              </svg>
            </span>
            <span className="mockup-avatar" />
          </div>
        </div>

        {/* Tab bar */}
        <div className="mockup-tabbar">
          <span className="mockup-tab mockup-tab--active">My First Board <span className="mockup-tab-x">×</span></span>
          <span className="mockup-tab">Side Project</span>
          <span className="mockup-tab">Home</span>
          <span className="mockup-tab mockup-tab--add">+ Board</span>
        </div>

        {/* Floating dock */}
        <div className="mockup-dock">
          <button className="mockup-dock-btn mockup-dock-btn--primary">+</button>
          <button className="mockup-dock-btn">▢</button>
          <button className="mockup-dock-btn">≡</button>
        </div>

        {/* Inspector panel */}
        <div className="mockup-inspector">
          <div className="mockup-inspector-header">
            <span>Selected task</span>
            <span className="mockup-inspector-close">×</span>
          </div>
          <div className="mockup-inspector-field mockup-inspector-field--tall" />
          <div className="mockup-inspector-colors">
            {['#ffe566','#ffadad','#96e6a8','#99c2ff','#d499ff'].map(c => (
              <span key={c} style={{ background: c }} />
            ))}
          </div>
          <button className="mockup-inspector-done-btn">✓ Mark Done</button>
        </div>

        {/* Group region */}
        <div className="mockup-group" style={{ left: 162, top: 104, width: 270, height: 165 }}>
          <span className="mockup-group-label">This week</span>
        </div>

        {/* Sticky notes */}
        <div className="mockup-note" style={{ background: '#ffe566', left: 192, top: 132 }}>
          <strong>Ship v2 beta</strong>
          <span className="mockup-note-line" style={{ width: '80%' }} />
          <span className="mockup-note-line" style={{ width: '55%' }} />
        </div>
        <div className="mockup-note" style={{ background: '#99c2ff', left: 330, top: 116 }}>
          <strong>Review docs</strong>
          <span className="mockup-note-line" style={{ width: '70%' }} />
          <span className="mockup-note-line" style={{ width: '45%' }} />
        </div>
        <div className="mockup-note" style={{ background: '#ffadad', left: 472, top: 158 }}>
          <strong>Call vendor</strong>
          <span className="mockup-note-line" style={{ width: '75%' }} />
        </div>
        <div className="mockup-note" style={{ background: '#96e6a8', left: 600, top: 128 }}>
          <strong>Deploy staging</strong>
          <span className="mockup-note-line" style={{ width: '60%' }} />
          <span className="mockup-note-line" style={{ width: '40%' }} />
        </div>
        <div className="mockup-note" style={{ background: '#d499ff', left: 260, top: 272 }}>
          <strong>Fix that bug</strong>
          <span className="mockup-note-line" style={{ width: '85%' }} />
        </div>
        <div className="mockup-note" style={{ background: '#ffe566', left: 410, top: 295 }}>
          <strong>Team sync</strong>
          <span className="mockup-note-line" style={{ width: '65%' }} />
        </div>

        {/* Status pill */}
        <div className="mockup-status">Saved · 3 boards · 7 done</div>

        {/* Bottom fade */}
        <div className="mockup-screen-fade" aria-hidden="true" />
      </div>
    </div>
  )
}

