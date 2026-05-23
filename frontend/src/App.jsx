import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Simulate from './pages/Simulate'
import CityFlowSimulator from './pages/CityFlowSimulator'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/cityflow" element={<CityFlowSimulator />} />
        <Route path="/simulate" element={<Simulate />} />
        {/* Redirect old /legacy route */}
        <Route path="/legacy" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
