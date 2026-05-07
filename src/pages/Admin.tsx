import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Category } from '../types'
import QuestionsTab from '../components/admin/QuestionsTab'
import StatsTab from '../components/admin/StatsTab'
import CategoriesTab from '../components/admin/CategoriesTab'

type Tab = 'questions' | 'categories' | 'stats'

/** Admin panel — questions CRUD, category management, and analytics. */
export default function Admin() {
  const [activeTab,  setActiveTab]  = useState<Tab>('questions')
  const [categories, setCategories] = useState<Category[]>([])

  /** Fetch all categories ordered by name — shared across Questions and Categories tabs */
  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    if (data) setCategories(data as Category[])
  }

  useEffect(() => { fetchCategories() }, [])

  return (
    <div className="flex flex-col gap-6 px-4 py-6 max-w-3xl mx-auto w-full">

      {/* page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-on-surface">ניהול</h1>
        <p className="text-sm text-on-surface-variant">ממשק ניהול המשחק — שאלות, קטגוריות ונתונים</p>
      </div>

      {/* tab strip */}
      <div className="flex gap-2 border-b border-outline-variant">
        <TabButton active={activeTab === 'questions'}  onClick={() => setActiveTab('questions')}>שאלות</TabButton>
        <TabButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')}>קטגוריות</TabButton>
        <TabButton active={activeTab === 'stats'}      onClick={() => setActiveTab('stats')}>סטטיסטיקה</TabButton>
      </div>

      {/* active tab */}
      <div>
        {activeTab === 'questions'  && <QuestionsTab  categories={categories} />}
        {activeTab === 'categories' && <CategoriesTab categories={categories} onCategoriesChanged={fetchCategories} />}
        {activeTab === 'stats'      && <StatsTab />}
      </div>

    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-on-surface-variant hover:text-on-surface',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
