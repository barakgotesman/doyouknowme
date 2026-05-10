import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RefreshIcon } from '../ui/Icons'
import type { Category, RoomOptions } from '../../types'

/** Available timer duration options (seconds) */
const TIMER_SECOND_OPTIONS = [10, 15, 20, 30]

const DEFAULT_OPTIONS: RoomOptions = {
  timer_enabled:   true,
  timer_seconds:   20,
  category_ids:    null,
  questions_count: 10,
}

interface Props {
  open: boolean
  onClose: () => void
  /** Called when the user clicks "שמור" — parent updates its roomOptions state */
  onSave: (options: RoomOptions) => void
  /** Current options — pre-fills the modal on open */
  initialOptions: RoomOptions
}

/**
 * Modal dialog for advanced room configuration.
 * Lets the host set timer on/off, timer duration, category filter, and question count.
 * Fetches categories + per-category question counts from Supabase on first open.
 * Shows a warning when the selected category pool has fewer questions than requested.
 */
export default function AdvancedSettingsModal({ open, onClose, onSave, initialOptions }: Props) {
  const [timerEnabled,    setTimerEnabled]    = useState(initialOptions.timer_enabled)
  const [timerSeconds,    setTimerSeconds]    = useState(initialOptions.timer_seconds)
  const [selectedCatIds,  setSelectedCatIds]  = useState<string[] | null>(initialOptions.category_ids)
  const [questionsCount,  setQuestionsCount]  = useState(initialOptions.questions_count)
  const [categories,      setCategories]      = useState<Category[]>([])
  const [catsLoading,     setCatsLoading]     = useState(false)
  /** Map of category_id → number of questions in that category */
  const [catQuestionCounts, setCatQuestionCounts] = useState<Record<string, number>>({})
  /** Total questions available across the entire pool (no filter) */
  const [totalQuestions, setTotalQuestions] = useState(0)

  // Sync local state when modal reopens
  useEffect(() => {
    setTimerEnabled(initialOptions.timer_enabled)
    setTimerSeconds(initialOptions.timer_seconds)
    setSelectedCatIds(initialOptions.category_ids)
    setQuestionsCount(initialOptions.questions_count)
  }, [open])

  // Fetch categories + question counts on first open
  useEffect(() => {
    if (!open || categories.length > 0) return
    setCatsLoading(true)
    Promise.all([
      supabase.from('categories').select('*').order('name'),
      // Fetch only id + category_id so we can count cheaply without pulling full question text
      supabase.from('questions').select('id, category_id'),
    ]).then(([catsRes, questionsRes]) => {
      const cats = catsRes.data ?? []
      const questions = questionsRes.data ?? []

      // Build per-category count map
      const counts: Record<string, number> = {}
      for (const q of questions) {
        const key = q.category_id ?? '__none__'
        counts[key] = (counts[key] ?? 0) + 1
      }

      setCategories(cats)
      setCatQuestionCounts(counts)
      setTotalQuestions(questions.length)
      setCatsLoading(false)
    })
  }, [open])

  /** How many questions are available given the current category selection */
  const availableCount = selectedCatIds === null
    ? totalQuestions
    : selectedCatIds.reduce((sum, id) => sum + (catQuestionCounts[id] ?? 0), 0)

  /** True when the pool is too small (or empty) for the requested question count */
  const poolTooSmall = availableCount < questionsCount

  /** True when any setting differs from the default */
  const isModified =
    !timerEnabled ||
    timerSeconds   !== DEFAULT_OPTIONS.timer_seconds ||
    selectedCatIds !== null ||
    questionsCount !== DEFAULT_OPTIONS.questions_count

  /** Resets all settings back to defaults without closing the modal */
  function handleReset() {
    setTimerEnabled(DEFAULT_OPTIONS.timer_enabled)
    setTimerSeconds(DEFAULT_OPTIONS.timer_seconds)
    setSelectedCatIds(DEFAULT_OPTIONS.category_ids)
    setQuestionsCount(DEFAULT_OPTIONS.questions_count)
  }

  /** Toggle a category in the selected set; null means "all categories" */
  function toggleCategory(id: string) {
    if (selectedCatIds === null) {
      // First exclusion: switch from "all" to "all except this one"
      setSelectedCatIds(categories.filter(c => c.id !== id).map(c => c.id))
    } else if (selectedCatIds.includes(id)) {
      const next = selectedCatIds.filter(c => c !== id)
      // If nothing would be selected, fall back to "all"
      setSelectedCatIds(next.length === 0 ? null : next)
    } else {
      const next = [...selectedCatIds, id]
      // If everything is now selected, switch back to null (all)
      setSelectedCatIds(next.length === categories.length ? null : next)
    }
  }

  /** True when this category id is included in the current selection */
  function isCatSelected(id: string) {
    return selectedCatIds === null || selectedCatIds.includes(id)
  }

  function handleSave() {
    onSave({
      timer_enabled:   timerEnabled,
      timer_seconds:   timerSeconds,
      category_ids:    selectedCatIds,
      questions_count: questionsCount,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm w-full rounded-3xl p-6 flex flex-col gap-5" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between" dir="rtl">
            <DialogTitle className="text-base font-extrabold">⚙ הגדרות מתקדמות</DialogTitle>
            {/* Reset link — only visible when settings differ from defaults */}
            {isModified && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <RefreshIcon className="w-3 h-3" />
                איפוס
              </button>
            )}
          </div>
        </DialogHeader>

        {/* ── Timer — purple (primary) ── */}
        <div className="flex flex-col gap-3 p-3 rounded-2xl bg-[var(--color-primary-fixed)]">
          <p className="text-sm font-bold text-[var(--color-on-primary-fixed)]">⏱ טיימר</p>
          <div className="flex gap-2">
            <button
              onClick={() => setTimerEnabled(true)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${
                timerEnabled
                  ? 'bg-primary text-white border-primary shadow-lvl2'
                  : 'bg-white/60 text-muted-foreground border-border'
              }`}
            >
              פעיל
            </button>
            <button
              onClick={() => setTimerEnabled(false)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${
                !timerEnabled
                  ? 'bg-primary text-white border-primary shadow-lvl2'
                  : 'bg-white/60 text-muted-foreground border-border'
              }`}
            >
              כבוי
            </button>
          </div>

          {/* Seconds selector — hidden when timer is off */}
          <div className={`flex flex-col gap-1 transition-opacity ${timerEnabled ? 'opacity-100' : 'hidden'}`}>
            <p className="text-xs text-[var(--color-on-primary-fixed)] opacity-70">שניות לתור</p>
            <div className="flex gap-2">
              {TIMER_SECOND_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setTimerSeconds(s)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${
                    timerSeconds === s
                      ? 'bg-primary text-white border-primary shadow-lvl2'
                      : 'bg-white/60 text-muted-foreground border-border'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Number of questions — yellow (secondary) ── */}
        <div className="flex flex-col gap-2 p-3 rounded-2xl bg-[var(--color-secondary-fixed)]">
          <p className="text-sm font-bold text-[var(--color-on-secondary-fixed)]">❓ מספר שאלות לשחקן</p>
          <div className="flex gap-2">
            {[5, 10].map(n => (
              <button
                key={n}
                onClick={() => setQuestionsCount(n)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${
                  questionsCount === n
                    ? 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] border-[var(--color-secondary-container)] shadow-lvl2'
                    : 'bg-white/60 text-muted-foreground border-border'
                }`}
              >
                {n} שאלות ({n * 2} סיבובים)
              </button>
            ))}
          </div>
        </div>

        {/* ── Categories — pink (tertiary) ── */}
        {(categories.length > 0 || catsLoading) && (
          <div className="flex flex-col gap-2 p-3 rounded-2xl bg-[var(--color-tertiary-fixed)]">
            <p className="text-sm font-bold text-[var(--color-on-tertiary-fixed)]">🏷 קטגוריות</p>
            <p className="text-xs text-[var(--color-on-tertiary-fixed)] opacity-70">בחר את הקטגוריות שיופיעו במשחק</p>
            <div className="flex flex-wrap gap-2">
              {catsLoading ? (
                <p className="text-xs text-muted-foreground">טוען...</p>
              ) : (
                categories.map(cat => {
                  const count = catQuestionCounts[cat.id] ?? 0
                  const selected = isCatSelected(cat.id)
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-1 ${
                        selected
                          ? 'bg-[var(--color-tertiary-container)] text-white border-[var(--color-tertiary-container)] shadow-lvl2'
                          : 'bg-white/60 text-muted-foreground border-border'
                      }`}
                    >
                      {cat.name}
                      {/* Question count badge on each chip */}
                      <span className={`text-[10px] font-normal opacity-80`}>
                        ({count})
                      </span>
                    </button>
                  )
                })
              )}
            </div>

            {/* Warning when selected pool is smaller than requested question count */}
            {poolTooSmall && (
              <div className="flex items-start gap-1.5 mt-1 p-2 rounded-xl bg-[var(--color-error-container)] text-[var(--color-on-error-container)]">
                <span className="text-sm leading-none mt-0.5">⚠️</span>
                <p className="text-xs font-semibold leading-snug">
                  {availableCount === 0
                    ? 'אין שאלות בקטגוריות שנבחרו — בחר לפחות קטגוריה אחת עם שאלות.'
                    : `יש רק ${availableCount} שאלות בקטגוריות שנבחרו — המשחק יתנהל עם ${availableCount} שאלות (${availableCount * 2} סיבובים) במקום ${questionsCount} (${questionsCount * 2} סיבובים).`
                  }
                </p>
              </div>
            )}
          </div>
        )}

        <Button variant="brand" size="game" onClick={handleSave} className="mt-1">
          שמור
        </Button>
      </DialogContent>
    </Dialog>
  )
}
