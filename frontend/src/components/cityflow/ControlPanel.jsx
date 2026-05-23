import React, { useState } from 'react'
import { DisasterTriggers } from './DisasterTriggers'
import { SimControls } from './SimControls'
import { CityDetailView } from './CityDetailView'
import { EventFeed } from './EventFeed'
import { useCityFlowStore } from '../../store/cityflowStore'

const TABS = [
  { id: 'disasters', label: 'Disasters' },
  { id: 'controls',  label: 'Controls'  },
  { id: 'city',      label: 'City'      },
  { id: 'events',    label: 'Events'    },
]

export function ControlPanel({ width = 320 }) {
  const [activeTab, setActiveTab] = useState('disasters')
  const events         = useCityFlowStore(state => state.events)
  const selectedCityId = useCityFlowStore(state => state.sim.selectedCity)

  const prevSelectedCity = React.useRef(selectedCityId)
  React.useEffect(() => {
    if (selectedCityId && selectedCityId !== prevSelectedCity.current) {
      setActiveTab('city')
    }
    prevSelectedCity.current = selectedCityId
  }, [selectedCityId])

  const criticalCount = events.filter(e => e.severity === 'critical').length

  return (
    <div style={{ width, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 12, transition: 'width 0.05s' }}>

      {/* Segmented tab control */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 4, display: 'flex', gap: 2 }}>
        {TABS.map(tab => {
          const active  = activeTab === tab.id
          const hasBadge = tab.id === 'events' && criticalCount > 0
          const dimmed   = tab.id === 'city' && !selectedCityId
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '7px 4px',
                borderRadius: 9,
                fontSize: 12,
                fontWeight: active ? 600 : 500,
                color: active ? '#F5F5F7' : dimmed ? 'rgba(245,245,247,0.18)' : 'rgba(245,245,247,0.40)',
                background: active ? 'rgba(255,255,255,0.10)' : 'transparent',
                border: active ? '1px solid rgba(255,255,255,0.10)' : '1px solid transparent',
                cursor: dimmed ? 'default' : 'pointer',
                transition: 'all 0.16s ease',
                position: 'relative',
                letterSpacing: '-0.1px',
              }}
            >
              {tab.label}
              {hasBadge && (
                <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: '#FF375F' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {activeTab === 'disasters' && <DisasterTriggers />}
        {activeTab === 'controls'  && <SimControls />}
        {activeTab === 'city'      && <CityDetailView />}
        {activeTab === 'events'    && <EventFeed />}
      </div>
    </div>
  )
}
