/**
 * Score estimation right panel for the validation dashboard.
 * Fixed 360px width with three tabs: Viabilidad, Artistico, Bonus.
 *
 * Viability tab: deterministic scores from project data.
 * Artistic tab: AI persona evaluation via estimateScore Cloud Function.
 * Bonus tab: bonus category eligibility.
 *
 * "Evaluar puntaje" button triggers httpsCallable with 120s client timeout.
 */
import { useState, useCallback, useMemo } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { es } from '@/locales/es'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { ViabilityScoreCard } from './ViabilityScoreCard'
import { ArtisticScoreCard } from './ArtisticScoreCard'
import { BonusPointsCard } from './BonusPointsCard'
import type { ScoreCategory, ImprovementSuggestion, PersonaScore } from '@/validation/scoring'

interface ScoreEstimationPanelProps {
  projectId: string
  viabilityScore: ScoreCategory[]
  improvements: ImprovementSuggestion[]
}

/** Default artistic categories (before AI evaluation). */
const ARTISTIC_CATEGORIES: ScoreCategory[] = [
  {
    id: 'guion',
    name: 'Guion (40 pts)',
    maxPoints: 40,
    estimatedPoints: 0,
    signals: [],
    isViability: false,
  },
  {
    id: 'direccion',
    name: 'Direccion (12 pts)',
    maxPoints: 12,
    estimatedPoints: 0,
    signals: [],
    isViability: false,
  },
  {
    id: 'material_visual',
    name: 'Material Visual (10 pts)',
    maxPoints: 10,
    estimatedPoints: 0,
    signals: [],
    isViability: false,
  },
]

export function ScoreEstimationPanel({
  projectId,
  viabilityScore,
  improvements,
}: ScoreEstimationPanelProps) {
  // -- AI evaluation state --
  const [personaScores, setPersonaScores] = useState<PersonaScore[]>([])
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasEvaluated, setHasEvaluated] = useState(false)

  // -- Manual artistic overrides (local state only) --
  const [overrides, setOverrides] = useState<Record<string, number>>({})

  // -- Computed scores --
  const viabilityTotal = viabilityScore.reduce(
    (sum, cat) => sum + cat.estimatedPoints,
    0,
  )

  // Build artistic categories from persona scores (averaged)
  const artisticCategories = useMemo((): ScoreCategory[] => {
    if (personaScores.length === 0) return ARTISTIC_CATEGORIES

    return ARTISTIC_CATEGORIES.map((cat) => {
      // Collect all persona scores for this category
      const scores = personaScores
        .map((p) => p.scores[cat.id])
        .filter((s): s is number => s !== undefined)

      const avgScore =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0

      return {
        ...cat,
        estimatedPoints: Math.round(avgScore * 10) / 10,
      }
    })
  }, [personaScores])

  const artisticTotal = artisticCategories.reduce(
    (sum, cat) => {
      const override = overrides[cat.id]
      return sum + (override !== undefined ? override : cat.estimatedPoints)
    },
    0,
  )

  // Bonus (from viabilityScore -- bonus detection is part of scoring module)
  const bonusPoints = 0 // Will be populated when bonus evaluation runs
  const bonusCategory: string | null = null
  const eligibleCategories: string[] = []

  const totalEstimated = viabilityTotal + artisticTotal + bonusPoints
  const totalPercentage = (totalEstimated / 100) * 100
  const meetsThreshold = totalEstimated >= 90

  // -- Cloud Function call --
  const handleEvaluate = useCallback(async () => {
    setEvaluating(true)
    setError(null)
    try {
      const estimateScoreFn = httpsCallable(functions, 'estimateScore', {
        timeout: 120_000,
      })
      const result = await estimateScoreFn({ projectId })
      const data = result.data as { personaScores: PersonaScore[] }
      setPersonaScores(data.personaScores)
      setHasEvaluated(true)
    } catch (err) {
      console.error('Score estimation failed:', err)
      setError(es.scoring.timeoutError)
    } finally {
      setEvaluating(false)
    }
  }, [projectId])

  const handleOverride = useCallback((categoryId: string, value: number) => {
    setOverrides((prev) => ({ ...prev, [categoryId]: value }))
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Panel heading */}
      <h2 className="text-xl font-semibold">{es.scoring.panelHeading}</h2>

      {/* Total score display with progress bar */}
      <div className="space-y-2">
        <Progress value={totalPercentage}>
          <ProgressLabel className="text-sm font-semibold">
            {es.scoring.totalEstimated(
              Math.round(totalEstimated),
              bonusPoints,
            )}
          </ProgressLabel>
          <ProgressValue className="font-mono text-sm font-semibold">
            {Math.round(totalEstimated)}/100
          </ProgressValue>
        </Progress>

        {/* Threshold indicator */}
        <p
          className={`text-xs ${
            meetsThreshold
              ? 'text-[hsl(142_76%_36%)]'
              : totalEstimated >= 85
                ? 'text-[hsl(38_92%_50%)]'
                : 'text-[hsl(0_84%_60%)]'
          }`}
        >
          {meetsThreshold
            ? es.scoring.thresholdPass
            : totalEstimated >= 85
              ? es.scoring.thresholdClose
              : es.scoring.thresholdFail}
        </p>

        {/* Reference line */}
        <p className="text-xs text-muted-foreground">
          {es.scoring.averageWinner}
        </p>
      </div>

      <Separator />

      {/* Tabs: Viabilidad / Artistico / Bonus */}
      <Tabs defaultValue="viabilidad">
        <TabsList className="w-full">
          <TabsTrigger value="viabilidad" className="flex-1 text-xs">
            Viabilidad
          </TabsTrigger>
          <TabsTrigger value="artistico" className="flex-1 text-xs">
            Artistico
          </TabsTrigger>
          <TabsTrigger value="bonus" className="flex-1 text-xs">
            Bonus
          </TabsTrigger>
        </TabsList>

        {/* Viability tab */}
        <TabsContent value="viabilidad">
          <div className="space-y-4 pt-4">
            <p className="text-xs text-muted-foreground font-medium">
              {es.scoring.viabilitySection(viabilityTotal)}
            </p>
            {viabilityScore.map((cat) => (
              <ViabilityScoreCard key={cat.id} category={cat} />
            ))}
          </div>
        </TabsContent>

        {/* Artistic tab */}
        <TabsContent value="artistico">
          <div className="space-y-4 pt-4">
            <p className="text-xs text-muted-foreground font-medium">
              {es.scoring.artisticSection(Math.round(artisticTotal))}
            </p>

            {/* CTA button for AI evaluation */}
            {!evaluating && (
              <Button
                onClick={handleEvaluate}
                disabled={evaluating}
                className="w-full"
              >
                {hasEvaluated
                  ? es.scoring.ctaButtonReevaluate
                  : es.scoring.ctaButton}
              </Button>
            )}

            {/* Loading state */}
            {evaluating && (
              <div className="space-y-3">
                <Button disabled className="w-full">
                  <RefreshCw className="size-4 animate-spin mr-2" />
                  {es.scoring.evaluatingState}
                </Button>
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>{error}</AlertTitle>
                <AlertDescription>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 h-auto text-destructive"
                    onClick={handleEvaluate}
                  >
                    {es.scoring.retryEvaluation}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Artistic score cards (after evaluation) */}
            {!evaluating &&
              artisticCategories.map((cat) => (
                <ArtisticScoreCard
                  key={cat.id}
                  category={cat}
                  personaScores={personaScores}
                  onOverride={hasEvaluated ? handleOverride : undefined}
                  overrideValue={overrides[cat.id]}
                />
              ))}
          </div>
        </TabsContent>

        {/* Bonus tab */}
        <TabsContent value="bonus">
          <div className="pt-4">
            <BonusPointsCard
              bonusPoints={bonusPoints}
              bonusCategory={bonusCategory}
              eligibleCategories={eligibleCategories}
            />
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Improvements section */}
      {improvements.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">
            {es.scoring.improvementHeading}
          </p>
          <ul className="space-y-1.5">
            {improvements.map((imp, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                {es.scoring.improvementFormat(imp.points, imp.text)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground">{es.scoring.disclaimer}</p>
    </div>
  )
}
