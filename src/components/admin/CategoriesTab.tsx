import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Category } from '../../types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog'

// ── single category row ────────────────────────────────────────────────────────
function CategoryRow({
  category,
  questionCount,
  onEdit,
  onDelete,
}: {
  category: Category
  questionCount: number
  onEdit: (c: Category) => void
  onDelete: (c: Category) => void
}) {
  return (
    <div className="card-purple p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-on-surface font-medium text-sm">{category.name}</p>
        <p className="text-xs text-on-surface-variant mt-0.5">{questionCount} שאלות</p>
      </div>
      <button
        onClick={() => onEdit(category)}
        className="shrink-0 p-1.5 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
        aria-label="ערוך קטגוריה"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button
        onClick={() => onDelete(category)}
        disabled={questionCount > 0}
        title={questionCount > 0 ? 'לא ניתן למחוק קטגוריה עם שאלות' : 'מחק קטגוריה'}
        className="shrink-0 p-1.5 rounded-lg hover:bg-surface-container transition-colors text-error disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="מחק קטגוריה"
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

// ── add / edit dialog ──────────────────────────────────────────────────────────
function CategoryFormDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean
  initial: string
  onClose: () => void
  onSave: (name: string) => Promise<void>
}) {
  const [name, setName]     = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  // sync when reopened with new initial value
  useEffect(() => { setName(initial); setError('') }, [initial])

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      await onSave(name.trim())
    } catch {
      setError('שם הקטגוריה כבר קיים')
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? 'ערוך קטגוריה' : 'קטגוריה חדשה'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <label className="text-xs font-medium text-on-surface-variant">שם הקטגוריה</label>
          <input
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            placeholder="למשל: ספורט, טיולים..."
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          {error && <p className="text-xs text-error">{error}</p>}
        </div>
        <DialogFooter className="flex gap-2">
          <button onClick={onClose} className="btn-secondary-custom px-4 py-2 text-sm rounded-xl">ביטול</button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="btn-primary px-4 py-2 text-sm rounded-xl disabled:opacity-60"
          >
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── delete confirmation ────────────────────────────────────────────────────────
function DeleteDialog({
  category,
  onClose,
  onConfirm,
}: {
  category: Category | null
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
    <Dialog open={!!category} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>מחק קטגוריה</DialogTitle></DialogHeader>
        <p className="text-sm text-on-surface-variant py-2">
          האם למחוק את הקטגוריה <strong className="text-on-surface">"{category?.name}"</strong>?
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

// ── main tab ───────────────────────────────────────────────────────────────────
export default function CategoriesTab({
  categories,
  onCategoriesChanged,
}: {
  categories: Category[]
  onCategoriesChanged: () => void
}) {
  // question count per category_id — fetched once
  const [counts, setCounts]           = useState<Record<string, number>>({})
  const [formOpen, setFormOpen]       = useState(false)
  const [editTarget, setEditTarget]   = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  // fetch question counts grouped by category_id
  async function fetchCounts() {
    const { data } = await supabase
      .from('questions')
      .select('category_id')
    if (!data) return
    const map: Record<string, number> = {}
    data.forEach(r => {
      if (r.category_id) map[r.category_id] = (map[r.category_id] ?? 0) + 1
    })
    setCounts(map)
  }

  useEffect(() => { fetchCounts() }, [categories])

  function openAdd() {
    setEditTarget(null)
    setFormOpen(true)
  }

  function openEdit(c: Category) {
    setEditTarget(c)
    setFormOpen(true)
  }

  async function handleSave(name: string) {
    if (editTarget) {
      const { error } = await supabase
        .from('categories')
        .update({ name })
        .eq('id', editTarget.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('categories')
        .insert({ name })
      if (error) throw error
    }
    setFormOpen(false)
    onCategoriesChanged()
    fetchCounts()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await supabase.from('categories').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    onCategoriesChanged()
    fetchCounts()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">{categories.length} קטגוריות</p>
        <button onClick={openAdd} className="btn-primary px-4 py-2 text-sm rounded-xl">
          + הוסף קטגוריה
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {categories.map(c => (
          <CategoryRow
            key={c.id}
            category={c}
            questionCount={counts[c.id] ?? 0}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        ))}
      </div>

      <CategoryFormDialog
        open={formOpen}
        initial={editTarget?.name ?? ''}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
      <DeleteDialog
        category={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
