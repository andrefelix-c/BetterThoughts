import { Suspense } from 'react'
import { connection } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { faBookOpen } from '@fortawesome/free-solid-svg-icons'
import HistoryEntryCard from '@/components/history-entry-card'
import { BUTTON_PRIMARY } from '@/lib/button-styles'
import FaIcon from '@/components/fa-icon'

async function HistoryContent() {
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="border-t border-[#E2DDD3] py-10 text-center text-xs text-[#2F3530]/60">
        Faça login para visualizar seu histórico.
      </div>
    )
  }

  const entries = await prisma.entry.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
  })

  if (entries.length === 0) {
    return (
      <div className="border-t border-[#E2DDD3] py-12 text-center space-y-4">
        <div className="w-10 h-10 rounded-full border border-[#DDD6CA] text-[#7B907E] flex items-center justify-center mx-auto">
          <FaIcon icon={faBookOpen} className="w-4 h-4" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-medium text-sm text-[#2F3530]">
            Seu diário terapêutico ainda está em branco
          </h2>
          <p className="text-xs text-[#2F3530]/60 max-w-xs mx-auto leading-relaxed">
            Escreva seu primeiro relato para começar a construir seu histórico de reflexões.
          </p>
        </div>
        <Link
          href="/"
          className={BUTTON_PRIMARY}
        >
          Escrever primeiro relato
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-[#2F3530]/55">
        <span>
          {entries.length} {entries.length === 1 ? 'relato registrado' : 'relatos registrados'}
        </span>
        <span>Mais recentes primeiro</span>
      </div>

      <div className="border-t border-[#E2DDD3]">
        {entries.map((entry) => (
          <HistoryEntryCard
            key={entry.id}
            entry={{
              id: entry.id,
              description: entry.description,
              core_emotion: entry.core_emotion,
              ai_reflection: entry.ai_reflection as {
                observation?: string
                questions?: string[]
                answers?: string[]
              } | null,
              created_at: entry.created_at,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function HistoricoPage() {
  return (
    <div className="max-w-lg md:max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-9 space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-serif text-[26px] sm:text-3xl font-medium tracking-tight text-[#2F3530]">
          Histórico
        </h1>
        <p className="text-xs sm:text-sm text-[#2F3530]/60 leading-relaxed">
          Revisite seus relatos, responda aos questionamentos ou organize seus registros.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="border-t border-[#E2DDD3] py-12 text-center text-xs text-[#2F3530]/50 animate-pulse">
            Carregando histórico...
          </div>
        }
      >
        <HistoryContent />
      </Suspense>
    </div>
  )
}
