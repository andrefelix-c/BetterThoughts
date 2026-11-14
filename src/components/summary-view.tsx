'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { faCopy, faFilePdf } from '@fortawesome/free-regular-svg-icons'
import {
  faCheck,
  faChevronDown,
  faDownload,
  faSpinner,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { generateSummaryAction, type SummaryActionState } from '@/app/resumo/actions'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/lib/button-styles'
import { downloadSummaryPdf } from '@/lib/summary-pdf'
import DatePicker from './date-picker'
import FaIcon from './fa-icon'

function formatLocalDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function SummaryView() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return formatLocalDate(d)
  })
  const [endDate, setEndDate] = useState(() => {
    return formatLocalDate(new Date())
  })
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const [state, formAction, isPending] = useActionState<SummaryActionState, FormData>(
    generateSummaryAction,
    {}
  )

  useEffect(() => {
    if (!menuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  const handleCopyFullSummary = async () => {
    if (!state.report) return

    const lines: string[] = []

    lines.push(`📊 *SÍNTESE TERAPÊUTICA (${state.startDate} a ${state.endDate})*`)
    if (state.totalEntries) {
      lines.push(`Total de relatos analisados: ${state.totalEntries}`)
    }
    lines.push('')

    if (state.report.periodSummary) {
      lines.push('📋 *RESUMO DO PERÍODO*')
      lines.push(state.report.periodSummary)
      lines.push('')
    }

    if (state.report.emotionalVariations && state.report.emotionalVariations.length > 0) {
      lines.push('📈 *VARIAÇÃO EMOCIONAL & PICOS*')
      state.report.emotionalVariations.forEach((item) => {
        lines.push(`• *${item.title}*: ${item.description}`)
      })
      lines.push('')
    }

    if (state.report.repetitivePatterns && state.report.repetitivePatterns.length > 0) {
      lines.push('🔁 *PADRÕES REPETITIVOS IDENTIFICADOS*')
      state.report.repetitivePatterns.forEach((pattern) => {
        lines.push(`• ${pattern}`)
      })
      lines.push('')
    }

    if (state.report.therapyTalkingPoints && state.report.therapyTalkingPoints.length > 0) {
      lines.push('🎯 *PONTOS DE ATENÇÃO PARA A SESSÃO*')
      state.report.therapyTalkingPoints.forEach((point, idx) => {
        lines.push(`${idx + 1}. ${point}`)
      })
      lines.push('')
    }

    if (state.report.generalInsight) {
      lines.push('💡 *INSIGHT INTEGRADOR*')
      lines.push(state.report.generalInsight)
    }

    const fullText = lines.join('\n')

    try {
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setMenuOpen(false)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = fullText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setMenuOpen(false)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleDownloadPdf = () => {
    if (!state.report) return
    downloadSummaryPdf({
      report: state.report,
      entries: state.entries,
      startDate: state.startDate,
      endDate: state.endDate,
      totalEntries: state.totalEntries,
    })
    setMenuOpen(false)
  }

  return (
    <div className="space-y-8">
      {/* Seleção de Período */}
      <form
        action={formAction}
        className="border-t border-[#E2DDD3] pt-5 flex flex-col sm:flex-row sm:items-end justify-between gap-5"
      >
        <input
          type="hidden"
          name="timezoneOffset"
          value={typeof window !== 'undefined' ? new Date().getTimezoneOffset() : 180}
        />

        <div className="grid grid-cols-2 gap-4 sm:gap-5 flex-1 min-w-0">
          <div className="min-w-0 space-y-1">
            <label
              htmlFor="startDate"
              className="block text-xs text-[#2F3530]/55"
            >
              De
            </label>
            <DatePicker
              id="startDate"
              name="startDate"
              value={startDate}
              onChange={setStartDate}
              disableFuture
              maxIso={endDate}
              align="left"
              label="Data inicial"
            />
          </div>

          <div className="min-w-0 space-y-1">
            <label
              htmlFor="endDate"
              className="block text-xs text-[#2F3530]/55"
            >
              Até
            </label>
            <DatePicker
              id="endDate"
              name="endDate"
              value={endDate}
              onChange={setEndDate}
              disableFuture
              minIso={startDate}
              align="right"
              label="Data final"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={`${BUTTON_PRIMARY} w-full sm:w-auto shrink-0`}
        >
          {isPending ? (
            <>
              <FaIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin text-current" />
              <span>Analisando...</span>
            </>
          ) : (
            <span>Gerar síntese</span>
          )}
        </button>
      </form>

      {/* Alerta */}
      {state?.error && (
        <div
          role="alert"
          className="border-l-2 border-[#C98A74] pl-3.5 py-1 text-[#7A4432] text-xs sm:text-sm flex items-start gap-2.5"
        >
          <FaIcon
            icon={faTriangleExclamation}
            className="w-4 h-4 shrink-0 mt-0.5 text-[#C98A74]"
          />
          <span className="leading-relaxed">{state.error}</span>
        </div>
      )}

      {/* Relatório Estruturado */}
      {state?.report && (
        <div className="border-t border-[#E2DDD3] pt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#2F3530]/55">
              {state.startDate} a {state.endDate} · {state.totalEntries}{' '}
              {state.totalEntries === 1 ? 'relato' : 'relatos'}
            </span>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Opções para exportar síntese"
                title="Copiar ou baixar PDF"
                className={`${BUTTON_SECONDARY} px-3.5 py-2 ${
                  copied ? 'border-[#7B907E] text-[#445646]' : ''
                }`}
              >
                <FaIcon icon={copied ? faCheck : faDownload} className="w-3.5 h-3.5" />
                {copied && <span className="text-xs">Copiado</span>}
                <FaIcon
                  icon={faChevronDown}
                  className={`w-2.5 h-2.5 opacity-60 transition-transform ${
                    menuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  aria-label="Exportar síntese"
                  className="absolute right-0 mt-2 w-44 rounded-2xl bg-[#F7F5F0] border border-[#DDD6CA] shadow-lg py-1.5 z-20"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleCopyFullSummary}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#2F3530] hover:bg-[#EAE5DC]/65 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <FaIcon icon={faCopy} className="w-3.5 h-3.5 text-[#7B907E]" />
                    <span>Copiar texto</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleDownloadPdf}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#2F3530] hover:bg-[#EAE5DC]/65 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <FaIcon icon={faFilePdf} className="w-3.5 h-3.5 text-[#C98A74]" />
                    <span>Baixar PDF</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <section className="space-y-2">
            <h2 className="text-xs font-medium text-[#2F3530]/55">
              Resumo do período
            </h2>
            <p className="text-sm sm:text-[15px] text-[#2F3530]/90 leading-[1.75] whitespace-pre-line wrap-break-word">
              {state.report.periodSummary}
            </p>
          </section>

          {state.report.emotionalVariations.length > 0 && (
            <section className="pt-5 border-t border-[#E2DDD3] space-y-3">
              <h2 className="text-xs font-medium text-[#2F3530]/55">
                Variação emocional
              </h2>
              <div className="space-y-3">
                {state.report.emotionalVariations.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <p className="text-sm font-medium text-[#2F3530] wrap-break-word">{item.title}</p>
                    <p className="text-xs sm:text-sm text-[#2F3530]/70 leading-relaxed wrap-break-word">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {state.report.repetitivePatterns.length > 0 && (
            <section className="pt-5 border-t border-[#E2DDD3] space-y-3">
              <h2 className="text-xs font-medium text-[#2F3530]/55">
                Padrões identificados
              </h2>
              <ul className="space-y-2 text-sm text-[#2F3530]/85">
                {state.report.repetitivePatterns.map((pattern, idx) => (
                  <li key={idx} className="leading-relaxed flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C98A74] mt-2 shrink-0" />
                    <span className="min-w-0 wrap-break-word">{pattern}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {state.report.therapyTalkingPoints.length > 0 && (
            <section className="pt-5 border-t border-[#E2DDD3] space-y-3">
              <h2 className="text-xs font-medium text-[#2F3530]/55">
                Pontos para a sessão
              </h2>
              <ol className="space-y-2.5 text-sm text-[#2F3530]/90">
                {state.report.therapyTalkingPoints.map((point, idx) => (
                  <li key={idx} className="leading-relaxed flex items-start gap-2.5">
                    <span className="text-xs font-medium text-[#7B907E] mt-0.5 shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="min-w-0 wrap-break-word">{point}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {state.report.generalInsight && (
            <section className="pt-5 border-t border-[#E2DDD3]">
              <div className="border-l-2 border-[#7B907E] pl-4 py-0.5 space-y-1">
                <span className="text-xs font-medium text-[#2F3530]/55 block">
                  Insight
                </span>
                <p className="font-serif italic text-[15px] text-[#2F3530]/85 leading-relaxed wrap-break-word">
                  {state.report.generalInsight}
                </p>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
