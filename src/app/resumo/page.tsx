import { Suspense } from 'react'
import SummaryView from '@/components/summary-view'

export default function ResumoPage() {
  return (
    <div className="max-w-lg md:max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-9 space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-serif text-[26px] sm:text-3xl font-medium tracking-tight text-[#2F3530]">
          Síntese Clínica
        </h1>
        <p className="text-xs sm:text-sm text-[#2F3530]/60 leading-relaxed">
          Organize os relatos de um período para levar à sessão de terapia.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="border-t border-[#E2DDD3] py-12 text-xs text-[#2F3530]/50 animate-pulse">
            Carregando síntese...
          </div>
        }
      >
        <SummaryView />
      </Suspense>
    </div>
  )
}
