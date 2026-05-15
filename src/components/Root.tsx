import { useAuth } from '@clerk/clerk-react'
import App from '../App'
import { LandingPage } from './LandingPage'
import { setTokenGetter } from '../lib/api'

export function Root() {
  const { isSignedIn, isLoaded, getToken } = useAuth()

  // Set synchronously each render so API calls always have the current token getter
  setTokenGetter(getToken)

  if (!isLoaded) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
      </div>
    )
  }

  if (!isSignedIn) return <LandingPage />
  return <App />
}
