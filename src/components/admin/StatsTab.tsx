import { useEffect, useRef, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
} from 'recharts'
import { supabase } from '../../lib/supabase'

// ── design system colors ───────────────────────────────────────────────────────
const C_PRIMARY   = '#630ed4'
const C_SECONDARY = '#fed01b'
const C_TERTIARY  = '#8f1e62'
const C_SURFACE   = '#e6eeff'

// ── helper: format ISO date string as dd/MM ───────────────────────────────────
function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card-purple p-4 flex flex-col gap-1">
      <span className="text-xs text-on-surface-variant">{label}</span>
      <span className="text-2xl font-bold text-primary leading-none">{value}</span>
      {sub && <span className="text-xs text-on-surface-variant">{sub}</span>}
    </div>
  )
}

// ── live pulse dot ─────────────────────────────────────────────────────────────
function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0 mt-0.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
    </span>
  )
}

// ── chart section wrapper ──────────────────────────────────────────────────────
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-purple p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-on-surface">{title}</h3>
      {children}
    </div>
  )
}

// ── realtime live stats ────────────────────────────────────────────────────────
interface LiveStats {
  playing: number
  setup: number
  waiting: number
  todayTotal: number
}

function useLiveStats() {
  const [stats, setStats] = useState<LiveStats>({ playing: 0, setup: 0, waiting: 0, todayTotal: 0 })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /** Fetch current room counts from Supabase */
  async function fetchLive() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [playingRes, setupRes, waitingRes, todayRes] = await Promise.all([
      supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('status', 'playing'),
      supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('status', 'setup'),
      supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('status', 'waiting'),
      supabase.from('rooms').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    ])

    setStats({
      playing:    playingRes.count  ?? 0,
      setup:      setupRes.count    ?? 0,
      waiting:    waitingRes.count  ?? 0,
      todayTotal: todayRes.count    ?? 0,
    })
  }

  useEffect(() => {
    fetchLive()
    // poll every 10 seconds
    intervalRef.current = setInterval(fetchLive, 10_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  return stats
}

// ── historical stats ───────────────────────────────────────────────────────────
interface HistoricalStats {
  totalRooms: number
  finishedRooms: number
  totalPlayers: number
  avgScore: number
}

// ── chart data types ───────────────────────────────────────────────────────────
interface DayPoint   { date: string; count: number }
interface HourPoint  { hour: string; count: number }
interface ScorePoint { score: string; count: number }
interface DiffPoint  { text: string; pct: number }
interface TimePoint  { date: string; avgMin: number }

export default function StatsTab() {
  const live = useLiveStats()

  const [hist,       setHist]       = useState<HistoricalStats>({ totalRooms: 0, finishedRooms: 0, totalPlayers: 0, avgScore: 0 })
  const [gamesDay,   setGamesDay]   = useState<DayPoint[]>([])
  const [hoursData,  setHoursData]  = useState<HourPoint[]>([])
  const [scoresDist, setScoresDist] = useState<ScorePoint[]>([])
  const [diffData,   setDiffData]   = useState<DiffPoint[]>([])
  const [avgTimeDay, setAvgTimeDay] = useState<TimePoint[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => { fetchAll() }, [])

  /** Fetch all historical analytics data */
  async function fetchAll() {
    await Promise.all([
      fetchHistorical(),
      fetchGamesPerDay(),
      fetchActiveHours(),
      fetchScoreDistribution(),
      fetchQuestionDifficulty(),
      fetchAvgGameTime(),
    ])
    setLoading(false)
  }

  // ── summary cards ────────────────────────────────────────────────────────
  async function fetchHistorical() {
    const [roomsRes, playersRes, roundsRes] = await Promise.all([
      supabase.from('rooms').select('id, status', { count: 'exact' }),
      supabase.from('players').select('id', { count: 'exact', head: true }),
      supabase.from('game_rounds').select('is_correct').eq('is_correct', true),
    ])

    const total    = roomsRes.count ?? 0
    const finished = roomsRes.data?.filter(r => r.status === 'finished').length ?? 0
    const players  = playersRes.count ?? 0

    // average combined score per finished room (each room has 20 rounds)
    const correctRounds = roundsRes.data?.length ?? 0
    const avgScore = finished > 0 ? Math.round((correctRounds / finished) * 10) / 10 : 0

    setHist({ totalRooms: total, finishedRooms: finished, totalPlayers: players, avgScore })
  }

  // ── games per day (last 30 days) ─────────────────────────────────────────
  async function fetchGamesPerDay() {
    const since = new Date()
    since.setDate(since.getDate() - 29)

    const { data } = await supabase
      .from('rooms')
      .select('created_at')
      .gte('created_at', since.toISOString())
      .order('created_at')

    if (!data) return

    // aggregate by date string
    const map: Record<string, number> = {}
    data.forEach(r => {
      const d = new Date(r.created_at).toISOString().slice(0, 10)
      map[d] = (map[d] ?? 0) + 1
    })

    // fill all 30 days so gaps show as 0
    const result: DayPoint[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      result.push({ date: fmtDate(key), count: map[key] ?? 0 })
    }
    setGamesDay(result)
  }

  // ── active hours (0-23) ───────────────────────────────────────────────────
  async function fetchActiveHours() {
    const { data } = await supabase
      .from('game_rounds')
      .select('started_at')
      .not('started_at', 'is', null)

    if (!data) return

    const counts = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, count: 0 }))
    data.forEach(r => {
      if (!r.started_at) return
      const h = new Date(r.started_at).getHours()
      counts[h].count++
    })
    setHoursData(counts)
  }

  // ── score distribution per finished room ─────────────────────────────────
  async function fetchScoreDistribution() {
    const { data } = await supabase
      .from('game_rounds')
      .select('room_id, is_correct')
      .not('is_correct', 'is', null)

    if (!data) return

    // sum correct per room
    const roomScores: Record<string, number> = {}
    data.forEach(r => {
      roomScores[r.room_id] = (roomScores[r.room_id] ?? 0) + (r.is_correct ? 1 : 0)
    })

    // bucket into bins of 2 (0-1, 2-3, … 20)
    const bins: Record<string, number> = {}
    Object.values(roomScores).forEach(score => {
      const bin = `${Math.floor(score / 2) * 2}-${Math.floor(score / 2) * 2 + 1}`
      bins[bin] = (bins[bin] ?? 0) + 1
    })

    const result: ScorePoint[] = Array.from({ length: 11 }, (_, i) => {
      const lo = i * 2, hi = lo === 20 ? 20 : lo + 1
      const label = lo === 20 ? '20' : `${lo}-${hi}`
      return { score: label, count: bins[label] ?? 0 }
    })
    setScoresDist(result)
  }

  // ── question difficulty (% correct per question) ─────────────────────────
  async function fetchQuestionDifficulty() {
    const { data: rounds } = await supabase
      .from('game_rounds')
      .select('question_id, is_correct')
      .not('is_correct', 'is', null)

    const { data: questions } = await supabase.from('questions').select('id, text')

    if (!rounds || !questions) return

    const map: Record<string, { correct: number; total: number }> = {}
    rounds.forEach(r => {
      if (!map[r.question_id]) map[r.question_id] = { correct: 0, total: 0 }
      map[r.question_id].total++
      if (r.is_correct) map[r.question_id].correct++
    })

    const textById: Record<string, string> = {}
    questions.forEach(q => { textById[q.id] = q.text })

    const result: DiffPoint[] = Object.entries(map)
      .filter(([id]) => textById[id])
      .map(([id, v]) => ({
        text: textById[id].length > 22 ? textById[id].slice(0, 22) + '…' : textById[id],
        pct: Math.round((v.correct / v.total) * 100),
      }))
      .sort((a, b) => a.pct - b.pct) // easiest last, hardest first
      .slice(0, 10)

    setDiffData(result)
  }

  // ── avg game time per day (finished rooms, last 30 days) ─────────────────
  async function fetchAvgGameTime() {
    const since = new Date()
    since.setDate(since.getDate() - 29)

    const { data } = await supabase
      .from('rooms')
      .select('created_at, updated_at')
      .eq('status', 'finished')
      .gte('created_at', since.toISOString())

    if (!data) return

    const dayMap: Record<string, number[]> = {}
    data.forEach(r => {
      if (!r.updated_at) return
      const ms  = new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()
      const min = ms / 60_000
      if (min < 1 || min > 120) return // filter noise
      const key = new Date(r.created_at).toISOString().slice(0, 10)
      if (!dayMap[key]) dayMap[key] = []
      dayMap[key].push(min)
    })

    const result: TimePoint[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const vals = dayMap[key]
      const avg  = vals?.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : 0
      if (avg > 0) result.push({ date: fmtDate(key), avgMin: avg })
    }
    setAvgTimeDay(result)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-surface-container animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── live section ─────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <LiveDot />
          <h2 className="text-sm font-semibold text-on-surface">בזמן אמת</h2>
          <span className="text-xs text-on-surface-variant">(מתעדכן כל 10 שניות)</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="משחקים פעילים עכשיו"  value={live.playing}    sub="status: playing"  />
          <StatCard label="בשלב ההגדרות עכשיו"   value={live.setup}     sub="status: setup"    />
          <StatCard label="מחכים לשחקן שני"       value={live.waiting}   sub="status: waiting"  />
          <StatCard label="משחקים היום"           value={live.todayTotal} sub="נוצרו מהיום"     />
        </div>
      </section>

      {/* ── summary cards ────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-on-surface mb-3">סיכום כללי</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="סה״כ משחקים"          value={hist.totalRooms}    />
          <StatCard label="משחקים שהסתיימו"       value={hist.finishedRooms} />
          <StatCard label="שחקנים ייחודיים"       value={hist.totalPlayers}  />
          <StatCard label="ציון ממוצע"            value={hist.avgScore}      sub="מתוך 20" />
        </div>
      </section>

      {/* ── charts ───────────────────────────────────────────────────────── */}
      <ChartCard title="משחקים פר יום (30 ימים אחרונים)">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={gamesDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C_SURFACE} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="משחקים" fill={C_PRIMARY} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="שעות פעילות (לפי שעה ביום)">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={hoursData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C_SURFACE} />
            <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="סיבובים" radius={[4, 4, 0, 0]}>
              {hoursData.map((_, i) => (
                <Cell key={i} fill={i >= 18 || i <= 2 ? C_TERTIARY : C_PRIMARY} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="התפלגות ציונים">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={scoresDist} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C_SURFACE} />
            <XAxis dataKey="score" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="משחקים" fill={C_SECONDARY} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="קושי שאלות (% תשובות נכונות — מהקשה לקלה)">
        <ResponsiveContainer width="100%" height={diffData.length * 30 + 20}>
          <BarChart
            data={diffData}
            layout="vertical"
            margin={{ top: 4, right: 30, left: 4, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={C_SURFACE} horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
            <YAxis type="category" dataKey="text" tick={{ fontSize: 10 }} width={120} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Bar dataKey="pct" name="% נכון" fill={C_TERTIARY} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="זמן משחק ממוצע לפי יום (דקות)">
        {avgTimeDay.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-6">אין נתונים עדיין</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={avgTimeDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C_SURFACE} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="m" />
              <Tooltip formatter={(v) => `${v} דק׳`} />
              <Line
                type="monotone"
                dataKey="avgMin"
                name="זמן ממוצע"
                stroke={C_PRIMARY}
                strokeWidth={2}
                dot={{ r: 3, fill: C_PRIMARY }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

    </div>
  )
}
