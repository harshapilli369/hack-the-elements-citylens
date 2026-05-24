import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Simulate from './pages/Simulate'
import CityFlowSimulator from './pages/CityFlowSimulator'
import ChainAnalysis from './pages/ChainAnalysis'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/cityflow" element={<CityFlowSimulator />} />
        <Route path="/simulate" element={<Simulate />} />
        <Route path="/chain-analysis" element={<ChainAnalysis />} />
      </Routes>
    </BrowserRouter>
  )
}
