import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Lobby from './components/Lobby'
import Setup from './components/Setup'
import GameRound from './components/GameRound'
import Results from './components/Results'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/game" element={<GameRound />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </BrowserRouter>
  )
}
