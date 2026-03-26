import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { doc, getDoc } from 'firebase/firestore'
import { toast } from 'sonner'
import {
  Mail,
  AlertTriangle,
  Clock,
  FileQuestion,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { acceptInvitation, declineInvitation } from '@/services/invitations'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { es } from '@/locales/es'

const ROLE_LABELS: Record<string, string> = {
  line_producer: 'Line Producer',
  abogado: 'Abogado',
  director: 'Director',
}

type InvitationState =
  | 'loading'
  | 'sign-in'
  | 'not-found'
  | 'expired'
  | 'already-accepted'
  | 'email-mismatch'
  | 'valid'

interface InvitationData {
  projectId: string
  projectTitle: string
  inviteeEmail: string
  role: string
  inviterName: string
  expiresAt: Date
  status: string
}

export function InvitationPage() {
  const { invitationId } = useParams<{ invitationId: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth()

  const [state, setState] = useState<InvitationState>('loading')
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  // Store return URL for unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('carpetify_return_url', window.location.pathname)
      setState('sign-in')
    }
  }, [authLoading, user])

  // Fetch invitation data after auth is resolved and user is signed in
  useEffect(() => {
    if (authLoading || !user || !invitationId) return

    // Capture user email for use in async closure (avoids null narrowing loss)
    const userEmail = user.email?.toLowerCase().trim() ?? ''
    let cancelled = false

    async function fetchInvitation() {
      try {
        const invRef = doc(db, 'invitations', invitationId!)
        const invSnap = await getDoc(invRef)

        if (cancelled) return

        if (!invSnap.exists()) {
          setState('not-found')
          return
        }

        const data = invSnap.data()
        const expiresAt = data.expiresAt?.toDate?.()
          ? data.expiresAt.toDate()
          : new Date(data.expiresAt)

        const invData: InvitationData = {
          projectId: data.projectId as string,
          projectTitle: data.projectTitle as string,
          inviteeEmail: data.inviteeEmail as string,
          role: data.role as string,
          inviterName: data.inviterName as string,
          expiresAt,
          status: data.status as string,
        }

        setInvitation(invData)

        // Determine state based on invitation data
        if (invData.status === 'accepted') {
          setState('already-accepted')
        } else if (invData.status !== 'pending') {
          setState('not-found')
        } else if (expiresAt < new Date()) {
          setState('expired')
        } else if (
          userEmail !== invData.inviteeEmail.toLowerCase().trim()
        ) {
          setState('email-mismatch')
        } else {
          setState('valid')
        }
      } catch {
        if (!cancelled) {
          setState('not-found')
        }
      }
    }

    fetchInvitation()
    return () => {
      cancelled = true
    }
  }, [authLoading, user, invitationId])

  const handleSignIn = async () => {
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch {
      toast.error(es.invitation.errorToast)
    } finally {
      setSigningIn(false)
    }
  }

  const handleSwitchAccount = async () => {
    setSigningIn(true)
    try {
      await signOut()
      sessionStorage.setItem('carpetify_return_url', window.location.pathname)
      await signInWithGoogle()
    } catch {
      toast.error(es.invitation.errorToast)
    } finally {
      setSigningIn(false)
    }
  }

  const handleAccept = async () => {
    if (!invitationId) return
    setAccepting(true)
    try {
      const result = await acceptInvitation(invitationId)
      toast.success(es.invitation.acceptedToast)
      navigate(`/project/${result.projectId}`, { replace: true })
    } catch {
      toast.error(es.invitation.errorToast)
      setAccepting(false)
    }
  }

  const handleDecline = async () => {
    if (!invitationId) return
    setDeclining(true)
    try {
      await declineInvitation(invitationId)
      setDeclineDialogOpen(false)
      toast.success(es.invitation.declinedToast)
      navigate('/', { replace: true })
    } catch {
      toast.error(es.invitation.errorToast)
      setDeclining(false)
    }
  }

  const formatExpiry = (date: Date) =>
    new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)

  const isActionDisabled = accepting || declining

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[480px]">
        {/* Loading state */}
        {state === 'loading' && (
          <Skeleton className="h-64 w-full rounded-xl" />
        )}

        {/* Not signed in */}
        {state === 'sign-in' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center gap-4">
                <Mail className="h-12 w-12 text-primary" />
                <h1 className="text-xl font-semibold text-center">
                  {es.invitation.signInHeading}
                </h1>
                <p className="text-sm text-muted-foreground text-center">
                  {es.invitation.signInBody}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="default"
                className="w-full"
                onClick={handleSignIn}
                disabled={signingIn}
              >
                {signingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {es.invitation.signInCTA}
                  </>
                ) : (
                  es.invitation.signInCTA
                )}
              </Button>
            </CardContent>
            <CardFooter>
              <p className="w-full text-center text-xs text-muted-foreground">
                Carpetify - Lemon Studios
              </p>
            </CardFooter>
          </Card>
        )}

        {/* Not found */}
        {state === 'not-found' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center gap-4">
                <FileQuestion className="h-12 w-12 text-muted-foreground/50" />
                <h1 className="text-xl font-semibold text-center">
                  {es.invitation.notFoundHeading}
                </h1>
                <p className="text-sm text-muted-foreground text-center">
                  {es.invitation.notFoundBody}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/', { replace: true })}
              >
                {es.invitation.goToDashboard}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Expired */}
        {state === 'expired' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center gap-4">
                <Clock className="h-12 w-12 text-muted-foreground/50" />
                <h1 className="text-xl font-semibold text-center">
                  {es.invitation.expiredHeading}
                </h1>
                <p className="text-sm text-muted-foreground text-center">
                  {es.invitation.expiredBody}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/', { replace: true })}
              >
                {es.invitation.goToDashboard}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Already accepted */}
        {state === 'already-accepted' && invitation && (
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center gap-4">
                <CheckCircle2 className="h-12 w-12 text-[hsl(142,76%,36%)]" />
                <h1 className="text-xl font-semibold text-center">
                  {es.invitation.alreadyAcceptedHeading}
                </h1>
                <p className="text-sm text-muted-foreground text-center">
                  {es.invitation.alreadyAcceptedBody}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="default"
                className="w-full"
                onClick={() =>
                  navigate(`/project/${invitation.projectId}`, {
                    replace: true,
                  })
                }
              >
                {es.invitation.goToProject}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Email mismatch */}
        {state === 'email-mismatch' && invitation && (
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center gap-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <h1 className="text-xl font-semibold text-center">
                  {es.invitation.emailMismatchHeading}
                </h1>
                <p className="text-sm text-muted-foreground text-center">
                  {es.invitation.emailMismatchBody(invitation.inviteeEmail)}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSwitchAccount}
                disabled={signingIn}
              >
                {signingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {es.invitation.switchAccount}
                  </>
                ) : (
                  es.invitation.switchAccount
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Valid invitation */}
        {state === 'valid' && invitation && (
          <>
            <Card>
              <CardHeader>
                <h1 className="text-xl font-semibold">
                  {es.invitation.detailHeading}
                </h1>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {es.invitation.projectLabel}
                    </span>
                    <span className="font-semibold">
                      {invitation.projectTitle}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {es.invitation.inviterLabel}
                    </span>
                    <span>{invitation.inviterName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {es.invitation.roleLabel}
                    </span>
                    <Badge variant="outline">
                      {ROLE_LABELS[invitation.role] || invitation.role}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {es.invitation.expiresLabel}
                    </span>
                    <span className="text-muted-foreground">
                      {formatExpiry(invitation.expiresAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex w-full justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeclineDialogOpen(true)}
                    disabled={isActionDisabled}
                    aria-label={`${es.invitation.declineButton} ${invitation.projectTitle}`}
                  >
                    {es.invitation.declineButton}
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleAccept}
                    disabled={isActionDisabled}
                    aria-label={`${es.invitation.acceptButton} ${invitation.projectTitle}`}
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {es.invitation.accepting}
                      </>
                    ) : (
                      es.invitation.acceptButton
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>

            {/* Decline confirmation dialog */}
            <Dialog
              open={declineDialogOpen}
              onOpenChange={setDeclineDialogOpen}
            >
              <DialogContent showCloseButton={false}>
                <DialogHeader>
                  <DialogTitle>
                    {es.invitation.declineConfirmTitle}
                  </DialogTitle>
                  <DialogDescription>
                    {es.invitation.declineConfirmBody}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeclineDialogOpen(false)}
                    disabled={declining}
                    autoFocus
                  >
                    {es.invitation.declineConfirmCancel}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDecline}
                    disabled={declining}
                  >
                    {declining ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {es.invitation.declining}
                      </>
                    ) : (
                      es.invitation.declineConfirmCTA
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  )
}
