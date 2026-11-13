'use client'

import { useSyncExternalStore } from 'react'

function getFormattedToday() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

const emptySubscribe = () => () => {}

export default function TodayDate() {
  const today = useSyncExternalStore(
    emptySubscribe,
    getFormattedToday,
    () => ''
  )

  return (
    <time className="block text-[11px] uppercase tracking-[0.12em] font-medium text-[#2F3530]/45 min-h-4">
      {today}
    </time>
  )
}

