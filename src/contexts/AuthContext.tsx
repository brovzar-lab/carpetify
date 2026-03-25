import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAppStore } from '@/stores/appStore'
import { getUserOrganization } from '@/services/organizations'

interface AuthContextType {
  user: User | null
  loading: boolean
  orgId: string | null
  needsOrgSetup: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  setOrgComplete: (orgId: string) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [needsOrgSetup, setNeedsOrgSetup] = useState(false)
  const [orgLoading, setOrgLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (!firebaseUser) {
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  // Check organization membership when user changes
  useEffect(() => {
    if (!user) {
      setOrgId(null)
      setNeedsOrgSetup(false)
      setLoading(false)
      return
    }

    let cancelled = false
    setOrgLoading(true)

    getUserOrganization(user.uid).then((org) => {
      if (cancelled) return
      if (org) {
        setOrgId(org.id)
        setNeedsOrgSetup(false)
      } else {
        setOrgId(null)
        setNeedsOrgSetup(true)
      }
      setOrgLoading(false)
      setLoading(false)
    }).catch(() => {
      if (cancelled) return
      setOrgId(null)
      setNeedsOrgSetup(true)
      setOrgLoading(false)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [user])

  // Sync Firebase user UID to appStore for cache isolation
  useEffect(() => {
    useAppStore.getState().setCurrentUserId(user?.uid ?? null)
  }, [user])

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider()
    // Per D-02: any Google account can sign in (no hd restriction)
    await signInWithPopup(auth, provider)
  }, [])

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth)
  }, [])

  // Called by OrgSetupPage after successful org creation + migration
  const setOrgComplete = useCallback((newOrgId: string) => {
    setOrgId(newOrgId)
    setNeedsOrgSetup(false)
  }, [])

  // Show loading while auth state OR org membership is being resolved
  const isLoading = loading || orgLoading

  return (
    <AuthContext.Provider value={{ user, loading: isLoading, orgId, needsOrgSetup, signInWithGoogle, signOut, setOrgComplete }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
