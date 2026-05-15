import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  onGiveFeedback: () => void
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
  onGiveFeedback,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  function openMenu() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      })
    }
    setMenuOpen(true)
  }

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const dropdown = menuOpen
    ? createPortal(
        <div
          ref={dropdownRef}
          className="top-bar-dropdown"
          role="menu"
          style={{ top: dropdownPos.top, right: dropdownPos.right }}
        >
          <button
            className="top-bar-dropdown-item"
            role="menuitem"
            onClick={() => { onExportJson(); setMenuOpen(false) }}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export JSON
          </button>
          <label className="top-bar-dropdown-item" role="menuitem">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 10V2M5 5l3-3 3 3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Import JSON
            <input
              type="file"
              accept="application/json"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0]
                if (file) onImportJson(file)
                e.currentTarget.value = ''
                setMenuOpen(false)
              }}
            />
          </label>
          <button
            className="top-bar-dropdown-item"
            role="menuitem"
            onClick={() => { onRestartTour(); setMenuOpen(false) }}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 5.5L9 9 5.5 10.5 7 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
            Restart Tour
          </button>
          <div className="top-bar-dropdown-divider" role="separator" />
          <button
            className="top-bar-dropdown-item"
            role="menuitem"
            onClick={() => { onGiveFeedback(); setMenuOpen(false) }}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M13 1H3a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2l2 3 2-3h4a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            Give Feedback
          </button>
        </div>,
        document.body
      )
    : null

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
        <button
          ref={triggerRef}
          className={`top-bar-icon-btn${menuOpen ? ' top-bar-icon-btn--active' : ''}`}
          onClick={() => menuOpen ? setMenuOpen(false) : openMenu()}
          aria-label="More options"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="4" cy="8" r="1.25" fill="currentColor" />
            <circle cx="8" cy="8" r="1.25" fill="currentColor" />
            <circle cx="12" cy="8" r="1.25" fill="currentColor" />
          </svg>
        </button>
        {dropdown}
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
