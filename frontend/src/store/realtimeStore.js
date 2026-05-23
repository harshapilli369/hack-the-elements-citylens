import { useQuery } from '@tanstack/react-query'
import { fetchRealtime } from '../utils/api'

// Poll every 5 minutes
export function useRealtimeData() {
  return useQuery({
    queryKey:        ['realtime'],
    queryFn:         fetchRealtime,
    refetchInterval: 5 * 60 * 1000,
    staleTime:       4 * 60 * 1000,
    retry:           2,
  })
}

// City ID → province name map (mirrors backend CITIES)
export const CITY_TO_PROVINCE = {
  'moncton':       'New Brunswick',
  'halifax':       'Nova Scotia',
  'charlottetown': 'Prince Edward Island',
  'st-johns':      'Newfoundland',
}

// AQI band label + color
export function aqiBand(aqi) {
  if (aqi == null)   return { label: '—',          color: 'rgba(245,245,247,0.28)' }
  if (aqi <= 20)     return { label: 'Good',        color: '#30D158' }
  if (aqi <= 40)     return { label: 'Fair',        color: '#30D158' }
  if (aqi <= 60)     return { label: 'Moderate',    color: '#FFD60A' }
  if (aqi <= 80)     return { label: 'Poor',        color: '#FF9F0A' }
  if (aqi <= 100)    return { label: 'Very Poor',   color: '#FF375F' }
  return               { label: 'Hazardous',        color: '#FF375F' }
}

// Weather code → short description
export function weatherDesc(code) {
  if (code == null) return ''
  if (code === 0)   return 'Clear sky'
  if (code <= 3)    return 'Partly cloudy'
  if (code <= 49)   return 'Foggy'
  if (code <= 67)   return 'Rain'
  if (code <= 77)   return 'Snow'
  if (code <= 82)   return 'Rain showers'
  if (code <= 99)   return 'Thunderstorm'
  return ''
}
