import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { Root } from './components/Root'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!publishableKey) throw new Error('VITE_CLERK_PUBLISHABLE_KEY is required')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#ffd84a',
          colorTextOnPrimaryBackground: '#17120a',
        },
      }}
    >
      <Root />
    </ClerkProvider>
  </StrictMode>,
)
