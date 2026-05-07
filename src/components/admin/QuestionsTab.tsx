import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Question, Category } from '../../types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog'

// ── form state for add / edit ─────────────────────────────────────────────────
interface QuestionForm {
  text: string
  category_id: string
  options: string[]
}

const EMPTY_FORM: QuestionForm = { text: '', category_id: '', options: ['', '', '', ''] }

// ── question row with joined category name ────────────────────────────────────
interface QuestionWithCategory extends Question {
  categories: Category | null
}

// ── single question row ───────────────────────────────────────────────────────
function QuestionRow({
  question,
  onEdit,
  onDelete,
}: {
  question: QuestionWithCategory
  onEdit: (q: QuestionWithCategory) => void
  onDelete: (q: QuestionWithCategory) => void
}) {
  return (
    <div className="card-purple p-4 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-on-surface font-medium text-sm leading-snug">{question.text}</p>
        <div className="flex gap-3 mt-1 text-xs text-on-surface-variant">
          <span className="bg-surface-container-high px-2 py-0.5 rounded-full">
            {question.categories?.name ?? '—'}
          </span>
          <span>{question.options.length} אפשרויות</span>
        </div>
      </div>
      <button
        onClick={() => onEdit(question)}
        className="shrink-0 p-1.5 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
        aria-label="ערוך שאלה"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button
        onClick={() => onDelete(question)}
        className="shrink-0 p-1.5 rounded-lg hover:bg-surface-container transition-colors text-error"
        aria-label="מחק שאלה"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>
    </div>
  )
}

// ── question form dialog (add / edit) ─────────────────────────────────────────
function QuestionFormDialog({
  open,
  initial,
  categories,
  onClose,
  onSave,
}: {
  open: boolean
  initial: QuestionForm
  categories: Category[]
  onClose: () => void
  onSave: (form: QuestionForm) => Promise<void>
}) {
  const [form, setSaving] = useState<QuestionForm>(initial)
  const [saving, setIsSaving] = useState(false)

  useEffect(() => { setSaving(initial) }, [initial])

  function setOption(index: number, value: string) {
    const next = [...form.options]
    next[index] = value
    setSaving(f => ({ ...f, options: next }))
  }

  function addOption() {
    if (form.options.length >= 6) return
    setSaving(f => ({ ...f, options: [...f.options, ''] }))
  }

  function removeOption(index: number) {
    if (form.options.length <= 2) return
    setSaving(f => ({ ...f, options: f.options.filter((_, i) => i !== index) }))
  }

  async function handleSave() {
    if (!form.text.trim() || !form.category_id) return
    const validOptions = form.options.filter(o => o.trim())
    if (validOptions.length < 2) return
    setIsSaving(true)
    await onSave({ ...form, options: validOptions })
    setIsSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial.text ? 'ערוך שאלה' : 'שאלה חדשה'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {/* question text */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">טקסט השאלה</label>
            <textarea
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
              value={form.text}
              onChange={e => setSaving(f => ({ ...f, text: e.target.value }))}
              placeholder="מה השאלה?"
            />
          </div>

          {/* category dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">קטגוריה</label>
            <select
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.category_id}
              onChange={e => setSaving(f => ({ ...f, category_id: e.target.value }))}
            >
              <option value="">בחר קטגוריה...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* options */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">אפשרויות תשובה</label>
            {form.options.map((opt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  className="flex-1 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  value={opt}
                  onChange={e => setOption(i, e.target.value)}
                  placeholder={`אפשרות ${i + 1}`}
                />
                <button
                  onClick={() => removeOption(i)}
                  disabled={form.options.length <= 2}
                  className="p-1.5 rounded-lg text-error disabled:text-on-surface-variant disabled:opacity-40 hover:bg-surface-container transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            ))}
            {form.options.length < 6 && (
              <button onClick={addOption} className="text-xs text-primary font-medium mt-1 self-start hover:underline">
                + הוסף אפשרות
              </button>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <button onClick={onClose} className="btn-secondary-custom px-4 py-2 text-sm rounded-xl">ביטול</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-4 py-2 text-sm rounded-xl disabled:opacity-60"
          >
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── delete confirmation dialog ─────────────────────────────────────────────────
function DeleteDialog({
  question,
  onClose,
  onConfirm,
}: {
  question: QuestionWithCategory | null
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleConfirm() {
    setDeleting(true)
    await onConfirm()
    setDeleting(false)
  }

  return (
    <Dialog open={!!question} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>מחק שאלה</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-on-surface-variant py-2">
          האם אתה בטוח שברצונך למחוק את השאלה{' '}
          <strong className="text-on-surface">"{question?.text}"</strong>?
          <br />פעולה זו אינה הפיכה.
        </p>
        <DialogFooter className="flex gap-2">
          <button onClick={onClose} className="btn-secondary-custom px-4 py-2 text-sm rounded-xl">ביטול</button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="btn-destructive px-4 py-2 text-sm rounded-xl disabled:opacity-60"
          >
            {deleting ? 'מוחק...' : 'מחק'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── main tab component ────────────────────────────────────────────────────────
export default function QuestionsTab({ categories }: { categories: Category[] }) {
  const [questions, setQuestions] = useState<QuestionWithCategory[]>([])
  const [loading, setLoading]     = useState(true)

  const [formOpen,    setFormOpen]    = useState(false)
  const [editTarget,  setEditTarget]  = useState<QuestionWithCategory | null>(null)
  const [formInitial, setFormInitial] = useState<QuestionForm>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<QuestionWithCategory | null>(null)

  /** Fetch questions joined with their category name */
  async function fetchQuestions() {
    const { data } = await supabase
      .from('questions')
      .select('*, categories(id, name)')
      .order('created_at', { ascending: false })
    if (data) setQuestions(data as QuestionWithCategory[])
    setLoading(false)
  }

  useEffect(() => { fetchQuestions() }, [])

  function openAdd() {
    setEditTarget(null)
    setFormInitial(EMPTY_FORM)
    setFormOpen(true)
  }

  function openEdit(q: QuestionWithCategory) {
    setEditTarget(q)
    setFormInitial({ text: q.text, category_id: q.category_id ?? '', options: [...q.options] })
    setFormOpen(true)
  }

  async function handleSave(form: QuestionForm) {
    if (editTarget) {
      await supabase
        .from('questions')
        .update({ text: form.text, category_id: form.category_id, options: form.options })
        .eq('id', editTarget.id)
    } else {
      await supabase
        .from('questions')
        .insert({ text: form.text, category_id: form.category_id, options: form.options })
    }
    setFormOpen(false)
    fetchQuestions()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await supabase.from('questions').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    fetchQuestions()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">
          {loading ? '...' : `${questions.length} שאלות בסה"כ`}
        </p>
        <button onClick={openAdd} className="btn-primary px-4 py-2 text-sm rounded-xl">
          + הוסף שאלה
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-surface-container animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {questions.map(q => (
            <QuestionRow key={q.id} question={q} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      <QuestionFormDialog
        open={formOpen}
        initial={formInitial}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
      <DeleteDialog
        question={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
