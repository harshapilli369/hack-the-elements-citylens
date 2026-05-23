import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Simulate from './pages/Simulate'
import CityFlowSimulator from './pages/CityFlowSimulator'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CityFlowSimulator />} />
        <Route path="/legacy" element={<Landing />} />
        <Route path="/simulate" element={<Simulate />} />
      </Routes>
    </BrowserRouter>
  )
}
