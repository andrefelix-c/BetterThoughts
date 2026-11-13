import { Suspense } from 'react'
import { connection } from 'next/server'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import type { Entry } from '@prisma/client'
import JournalForm, { type JournalTriggerPrompt } from '@/components/journal-form'
import TodayDate from '@/components/today-date'
import { getEmotionConfig } from '@/lib/emotions'

type HomeSearchParams = Promise<{
  triggerId?: string | string[]
}>

async function JournalContent({
  searchParams,
}: {
  searchParams: HomeSearchParams
}) {
  await connection()

  const params = await searchParams
  const requestedTriggerId =
    typeof params.triggerId === 'string' ? params.triggerId : null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let therapeuticFocus: string | null = null
  let recentEntries: Entry[] = []
  let pendingTriggers: JournalTriggerPrompt[] = []
  let initialSelectedTriggerId: string | null = null

  if (user) {
    try {
      const [profile, entries, triggers] = await Promise.all([
        prisma.profile.findUnique({
          where: { id: user.id },
          select: { therapeutic_focus: true },
        }),
        prisma.entry.findMany({
          where: { user_id: user.id },
          orderBy: { created_at: 'desc' },
          take: 3,
        }),
        prisma.trigger.findMany({
          where: {
            user_id: user.id,
            is_resolved: false,
            event_time: { lte: new Date() },
          },
          orderBy: { event_time: 'desc' },
          take: 5,
        }),
      ])

      therapeuticFocus = profile?.therapeutic_focus || null
      recentEntries = entries
      pendingTriggers = triggers.map((item) => ({
        id: item.id,
        title: item.title,
        event_time: item.event_time.toISOString(),
      }))

      if (requestedTriggerId) {
        const matched = triggers.find((item) => item.id === requestedTriggerId)
        if (matched) {
          initialSelectedTriggerId = matched.id
        } else {
          const explicitTrigger = await prisma.trigger.findFirst({
            where: {
              id: requestedTriggerId,
              user_id: user.id,
              is_resolved: false,
            },
          })
          if (explicitTrigger) {
            pendingTriggers = [
              {
                id: explicitTrigger.id,
                title: explicitTrigger.title,
                event_time: explicitTrigger.event_time.toISOString(),
              },
              ...pendingTriggers,
            ]
            initialSelectedTriggerId = explicitTrigger.id
          }
        }
      }
    } catch (err) {
      console.error('Erro ao consultar dados no Prisma:', err)
    }
  }

  return (
    <div
      className={
        recentEntries.length > 0
          ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start'
          : 'max-w-2xl mx-auto'
      }
    >
      {/* Folha principal de escrita */}
      <div className={recentEntries.length > 0 ? 'lg:col-span-7 min-w-0 space-y-5' : 'min-w-0 space-y-5'}>
        <header className="space-y-1.5">
          <TodayDate />
          <h1 className="font-serif text-[26px] sm:text-3xl font-medium tracking-tight text-[#2F3530]">
            Diário Terapêutico
          </h1>
          <p className="text-xs sm:text-sm text-[#2F3530]/60 leading-relaxed">
            Um espaço tranquilo para registrar o seu dia e refletir com clareza.
          </p>
        </header>

        <JournalForm
          activeFocus={therapeuticFocus}
          pendingTriggers={pendingTriggers}
          initialSelectedTriggerId={initialSelectedTriggerId}
        />
      </div>

      {/* Registros recentes */}
      {recentEntries.length > 0 && (
        <aside className="lg:col-span-5 min-w-0 lg:border-l lg:border-[#E2DDD3] lg:pl-8 pt-2 lg:pt-1 space-y-4 lg:sticky lg:top-20">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium text-[#2F3530]/60">
              Registros recentes
            </h2>
            <Link
              href="/historico"
              className="text-xs font-medium text-[#7B907E] hover:text-[#5F7362] transition"
            >
              Ver histórico →
            </Link>
          </div>

          <div className="space-y-3">
            {recentEntries.map((entry) => {
              const emotion = getEmotionConfig(entry.core_emotion)
              const aiData = entry.ai_reflection as {
                questions?: string[]
                answers?: string[]
              } | null
              const totalQuestions = aiData?.questions?.length || 0
              const answeredCount =
                aiData?.answers?.filter((a) => a && a.trim().length > 0).length || 0

              return (
                <Link
                  key={entry.id}
                  href="/historico"
                  className="block bg-[#EAE5DC]/75 hover:bg-[#EAE5DC] rounded-2xl p-4 border border-[#DED8CD]/80 transition space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-[#2F3530] flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${emotion.dotClass}`} />
                      {emotion.label}
                    </span>
                    <span className="text-[11px] text-[#2F3530]/50">
                      {entry.created_at
                        ? new Date(entry.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>

                  <p className="text-[13px] text-[#2F3530]/80 line-clamp-3 leading-relaxed wrap-break-word">
                    {entry.description}
                  </p>

                  {totalQuestions > 0 && (
                    <p className="text-[11px] text-[#5B705E] font-medium pt-0.5">
                      {answeredCount > 0
                        ? `${answeredCount} de ${totalQuestions} perguntas respondidas`
                        : `${totalQuestions} ${
                            totalQuestions === 1
                              ? 'pergunta reflexiva'
                              : 'perguntas reflexivas'
                          }`}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        </aside>
      )}
    </div>
  )
}

export default function HomePage(props: {
  searchParams: HomeSearchParams
}) {
  return (
    <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-9">
      <Suspense
        fallback={
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="space-y-1.5">
              <TodayDate />
              <h1 className="font-serif text-[26px] sm:text-3xl font-medium tracking-tight text-[#2F3530]">
                Diário Terapêutico
              </h1>
            </div>
            <div className="py-12 text-xs text-[#2F3530]/50 animate-pulse border-t border-[#E2DDD3]">
              Preparando seu diário terapêutico...
            </div>
          </div>
        }
      >
        <JournalContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  )
}
