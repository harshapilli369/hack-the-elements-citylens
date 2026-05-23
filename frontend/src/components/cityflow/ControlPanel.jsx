import React from 'react'
import { DisasterTriggers } from './DisasterTriggers'
import { SimControls } from './SimControls'
import { CityDetailView } from './CityDetailView'
import { EventFeed } from './EventFeed'

export function ControlPanel() {
  return (
    <div className="w-[400px] h-full flex flex-col pl-6 overflow-y-auto overflow-x-hidden pb-8 z-20 gap-6">
      <DisasterTriggers />
      <SimControls />
      <CityDetailView />
      <EventFeed />
    </div>
  )
}
