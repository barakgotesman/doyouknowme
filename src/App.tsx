import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppHeader from './layouts/AppHeader'
import AppFooter from './layouts/AppFooter'
import Lobby from './components/Lobby'
import Setup from './components/Setup'
import GameRound from './components/GameRound'
import Results from './components/Results'

export default function App() {
  return (
    <BrowserRouter>
      <div className="lobby-bg min-h-screen flex flex-col" dir="rtl">
        <AppHeader />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Lobby />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/game" element={<GameRound />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </main>
        <AppFooter />
      </div>
    </BrowserRouter>
  )
}
