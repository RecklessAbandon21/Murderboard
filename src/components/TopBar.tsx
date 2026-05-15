import { UserButton } from '@clerk/clerk-react'
import type { BoardView, SaveState } from '../types'

type TopBarProps = {
  view: BoardView
  saveState: SaveState
  search: string
  searchMatchCount: number
  searchMatchIndex: number
  onViewChange: (view: BoardView) => void
  onSearchChange: (value: string) => void
  onSearchStep: (direction: 1 | -1) => void
  onExportJson: () => void
  onImportJson: (file: File) => void
  onMobileMenuToggle: () => void
  onRestartTour: () => void
}

const SAVE_LABELS: Record<SaveState, string> = {
  idle: 'Saved',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Error',
}

export function TopBar({
  view,
  saveState,
  search,
  searchMatchCount,
  searchMatchIndex,
  onViewChange,
  onSearchChange,
  onSearchStep,
  onExportJson,
  onImportJson,
  onMobileMenuToggle,
  onRestartTour,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="top-bar-brand">
        <span className="top-bar-logo-wrap">
          <img src="/logo.png" alt="" className="top-bar-logo" aria-hidden="true" />
        </span>
        <strong className="top-bar-wordmark">Murderboard</strong>
      </div>

      <div className="top-bar-search-wrap">
        <div className="top-bar-search">
          <svg className="top-bar-search-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            data-tour="search"
            type="text"
            placeholder="Find on board…"
            value={search}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
          />
          {search && searchMatchCount > 0 && (
            <span className="search-count">
              {searchMatchIndex}/{searchMatchCount}
            </span>
          )}
        </div>
        {search && searchMatchCount > 1 && (
          <div className="search-nav">
            <button onClick={() => onSearchStep(-1)} aria-label="Previous match">↑</button>
            <button onClick={() => onSearchStep(1)} aria-label="Next match">↓</button>
          </div>
        )}
      </div>

      <div className="top-bar-actions">
        <span className={`save-pill save-pill--${saveState}`}>{SAVE_LABELS[saveState]}</span>
        <button
          data-tour="archive-btn"
          className={`top-bar-chip ${view === 'archive' ? 'top-bar-chip--active' : ''}`}
          onClick={() => onViewChange(view === 'archive' ? 'board' : 'archive')}
        >
          {view === 'archive' ? '← Board' : 'Archive'}
        </button>
        <button className="top-bar-icon-btn" onClick={onExportJson} title="Export JSON" aria-label="Export board as JSON">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <label className="top-bar-icon-btn" title="Import JSON" aria-label="Import board from JSON">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 10V2M5 5l3-3 3 3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="file"
            accept="application/json"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0]
              if (file) onImportJson(file)
              e.currentTarget.value = ''
            }}
          />
        </label>
        <button
          className="top-bar-icon-btn top-bar-help-btn"
          onClick={onRestartTour}
          title="Restart tour"
          aria-label="Restart onboarding tour"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 11v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M8 5.5c0-.83.67-1.5 1.5-1.5S11 6.17 11 7c0 1-1 1.5-2 2v.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
          </svg>
        </button>
        <button
          className="top-bar-icon-btn top-bar-mobile-menu"
          onClick={onMobileMenuToggle}
          aria-label="Open menu"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  )
}

