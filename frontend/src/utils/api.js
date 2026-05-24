import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 15000 })

export async function runSimulation(payload) {
  const { data } = await api.post('/simulate', payload)
  return data
}

export async function fetchProvinces() {
  const { data } = await api.get('/provinces')
  return data
}

export async function fetchMigrationReasons() {
  const { data } = await api.get('/migration-reasons')
  return data
}

export async function fetchRealtime() {
  const { data } = await api.get('/realtime')
  return data
}

export async function runChainSimulation(payload) {
  const { data } = await api.post('/simulate/chain', payload)
  return data
}

export default api
