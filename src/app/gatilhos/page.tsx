import { Suspense } from 'react'
import { connection } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import NotificationSettingsCard from '@/components/notification-settings-card'
import TriggerForm from '@/components/trigger-form'
import TriggerList from '@/components/trigger-list'

async function GatilhosContent() {
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="border-t border-[#E2DDD3] py-10 text-center text-xs text-[#2F3530]/60">
        Faça login para acessar o radar de eventos.
      </div>
    )
  }

  const [profile, pendingTriggers] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        checkin_enabled: true,
        active_start_hour: true,
        active_end_hour: true,
        timezone: true,
      },
    }),
    prisma.trigger.findMany({
      where: {
        user_id: user.id,
        is_resolved: false,
      },
      orderBy: { event_time: 'asc' },
    }),
  ])

  const now = new Date()

  const serializedTriggers = pendingTriggers.map((item) => ({
    id: item.id,
    title: item.title,
    event_time: item.event_time.toISOString(),
    hasPassed: item.event_time.getTime() <= now.getTime(),
  }))

  return (
    <div className="space-y-6">
      <NotificationSettingsCard
        initialCheckinEnabled={profile?.checkin_enabled ?? true}
        initialStartHour={profile?.active_start_hour ?? 8}
        initialEndHour={profile?.active_end_hour ?? 22}
        initialTimezone={profile?.timezone ?? 'America/Sao_Paulo'}
      />

      <TriggerForm />

      <TriggerList
        triggers={serializedTriggers}
        timeZone={profile?.timezone ?? 'America/Sao_Paulo'}
      />
    </div>
  )
}

export default function GatilhosPage() {
  return (
    <div className="max-w-lg md:max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-9 space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-serif text-[26px] sm:text-3xl font-medium tracking-tight text-[#2F3530]">
          Radar de Eventos
        </h1>
        <p className="text-xs sm:text-sm text-[#2F3530]/60 leading-relaxed">
          Avise sobre compromissos ou momentos marcantes para receber um lembrete depois e relatar como foi.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="border-t border-[#E2DDD3] py-12 text-xs text-[#2F3530]/50 animate-pulse">
            Carregando radar de eventos...
          </div>
        }
      >
        <GatilhosContent />
      </Suspense>
    </div>
  )
}
