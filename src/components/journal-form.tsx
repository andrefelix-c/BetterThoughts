'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { faCalendar, faLightbulb } from '@fortawesome/free-regular-svg-icons'
import {
  faCheck,
  faSpinner,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import {
  createJournalEntry,
  saveEntryAnswers,
  type SaveEntryState,
  type SaveAnswersState,
} from '@/app/actions'
import { EMOTIONS } from '@/lib/emotions'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/lib/button-styles'
import DatePicker from './date-picker'
import FaIcon from './fa-icon'

function ReflectionAnswerSection({
  entryId,
  questions,
  onReset,
}: {
  entryId?: string
  questions: string[]
  onReset: () => void
}) {
  const [answersState, answersAction, isSaving] = useActionState<
    SaveAnswersState,
    FormData
  >(saveEntryAnswers, {})

  const [answers, setAnswers] = useState<string[]>(() =>
    questions.map(() => '')
  )

  const isSaved = answersState?.success

  return (
    <form action={answersAction} className="space-y-6 pt-1">
      <input type="hidden" name="entryId" value={entryId || ''} />

      {answersState?.error && (
        <div className="border-l-2 border-[#C98A74] pl-3.5 py-1 text-[#7A4432] text-xs">
          {answersState.error}
        </div>
      )}

      {isSaved && (
        <div className="border-l-2 border-[#7B907E] pl-3.5 py-1 text-[#3F5142] text-xs flex items-center gap-2">
          <FaIcon icon={faCheck} className="w-3.5 h-3.5 text-[#7B907E] shrink-0" />
          <span>
            Respostas salvas com sucesso. Elas serão incluídas na sua síntese clínica.
          </span>
        </div>
      )}

      <div className="space-y-5">
        <p className="text-xs font-medium text-[#2F3530]/60">
          Responda com calma ao que fizer sentido para você agora:
        </p>

        <div className="divide-y divide-[#E2DDD3]">
          {questions.map((q, idx) => (
            <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <span className="text-xs font-medium text-[#7B907E] shrink-0 mt-0.5">
                  {idx + 1}.
                </span>
                <p className="text-sm font-medium text-[#2F3530] leading-relaxed">
                  {q}
                </p>
              </div>

              <textarea
                name={`answer_${idx}`}
                rows={2}
                value={answers[idx] || ''}
                onChange={(e) => {
                  const next = [...answers]
                  next[idx] = e.target.value
                  setAnswers(next)
                }}
                placeholder="Escreva sua reflexão..."
                className="w-full p-3 rounded-xl border border-[#DDD6CA] bg-transparent text-[#2F3530] text-base sm:text-sm placeholder-[#2F3530]/40 focus:outline-none focus:ring-2 focus:ring-[#7B907E]/30 focus:border-[#7B907E] transition resize-none leading-relaxed"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#E2DDD3] pt-4 flex flex-col sm:flex-row sm:items-center gap-2.5">
        <button
          type="submit"
          disabled={isSaving || isSaved}
          className={BUTTON_PRIMARY}
        >
          {isSaving
            ? 'Salvando respostas...'
            : isSaved
            ? '✓ Respostas Salvas'
            : 'Salvar respostas'}
        </button>

        <button
          type="button"
          onClick={onReset}
          className={BUTTON_SECONDARY}
        >
          Novo relato
        </button>

        <Link
          href="/historico"
          className="sm:ml-auto text-xs font-medium text-[#7B907E] hover:text-[#5F7362] transition text-center py-2"
        >
          Ver todo o histórico →
        </Link>
      </div>
    </form>
  )
}

function formatLocalDateTime(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

export default function JournalForm({
  activeFocus,
}: {
  activeFocus?: string | null
}) {
  const [selectedEmotion, setSelectedEmotion] = useState<string>('Neutro')
  const [useCustomDate, setUseCustomDate] = useState(false)
  const [customDateTime, setCustomDateTime] = useState('')
  const [tzOffset, setTzOffset] = useState(180)

  const [state, formAction, isPending] = useActionState<SaveEntryState, FormData>(
    createJournalEntry,
    {}
  )

  const handleReset = () => {
    setSelectedEmotion('Neutro')
    window.location.reload()
  }

  // Estado de reflexão socrática gerada
  if (state?.success && state.reflection) {
    return (
      <div className="border-t border-[#E2DDD3] pt-5 space-y-6">
        <div className="border-l-2 border-[#7B907E] pl-3.5 py-0.5 space-y-0.5">
          <p className="text-sm font-medium text-[#2F3530] flex items-center gap-2">
            <FaIcon icon={faCheck} className="w-3.5 h-3.5 text-[#7B907E]" />
            Relato guardado no seu diário terapêutico
          </p>
          <p className="text-xs text-[#2F3530]/60">
            Abaixo estão algumas perguntas para aprofundar seu olhar sobre esse momento.
          </p>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-2 text-xs font-medium text-[#2F3530]/65">
            <FaIcon icon={faLightbulb} className="w-3.5 h-3.5 text-[#C98A74]" />
            <h2>Reflexão Socrática</h2>
          </div>

          {state.reflection.observation && (
            <p className="font-serif text-sm sm:text-[15px] italic text-[#2F3530]/85 leading-relaxed border-l-2 border-[#C98A74] pl-4 py-0.5">
              &ldquo;{state.reflection.observation}&rdquo;
            </p>
          )}

          <ReflectionAnswerSection
            entryId={state.savedEntryId}
            questions={state.reflection.questions}
            onReset={handleReset}
          />
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      {activeFocus && (
        <div className="border-l-2 border-[#C98A74] pl-3.5 py-0.5 text-xs leading-relaxed space-y-0.5">
          <span className="font-medium text-[#2F3530]/55 block">
            Foco terapêutico da semana
          </span>
          <p className="text-[#2F3530]/85 wrap-break-word">{activeFocus}</p>
        </div>
      )}

      {state?.error && (
        <div
          role="alert"
          className="p-3.5 rounded-2xl bg-[#C98A74]/18 border border-[#C98A74]/40 text-[#7A4432] text-xs flex items-center gap-2.5"
        >
          <FaIcon
            icon={faTriangleExclamation}
            className="w-4 h-4 shrink-0 text-[#C98A74]"
          />
          <span>{state.error}</span>
        </div>
      )}

      {/* Folha aberta de escrita */}
      <div className="border-t border-[#E2DDD3] pt-5 space-y-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="description"
              className="block text-xs font-medium text-[#2F3530]/60"
            >
              Como foi o seu dia ou o que aconteceu?
            </label>

            {!useCustomDate ? (
              <button
                type="button"
                onClick={() => {
                  const now = new Date()
                  setCustomDateTime(formatLocalDateTime(now))
                  setTzOffset(now.getTimezoneOffset())
                  setUseCustomDate(true)
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[#2F3530]/50 hover:text-[#2F3530] transition-colors cursor-pointer"
                title="Alterar data e hora do relato"
              >
                <FaIcon icon={faCalendar} className="w-3 h-3 text-[#7B907E]" />
                <span>Agora · Alterar data</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2.5">
                <input type="hidden" name="timezoneOffset" value={tzOffset} />
                <DatePicker
                  id="entry_date"
                  name="entry_date"
                  value={customDateTime}
                  onChange={setCustomDateTime}
                  includeTime
                  disableFuture
                  align="right"
                  variant="inline"
                  defaultOpen
                  label="Data e hora do relato"
                />
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomDate(false)
                    setCustomDateTime('')
                  }}
                  className="text-[11px] text-[#7B907E] hover:text-[#5F7362] hover:underline cursor-pointer"
                >
                  Usar agora
                </button>
              </div>
            )}
          </div>
          <textarea
            id="description"
            name="description"
            required
            rows={8}
            placeholder="Escreva no seu ritmo sobre seus pensamentos, acontecimentos ou algo que mexeu com você hoje..."
            className="w-full bg-transparent border-0 p-0 text-[#2F3530] text-base placeholder-[#2F3530]/35 focus:outline-none focus:ring-0 resize-none min-h-[190px] sm:min-h-[230px] leading-[1.75]"
          />
        </div>

        <div className="border-t border-[#E2DDD3] pt-4 space-y-4">
          <div className="space-y-2.5">
            <label className="block text-xs text-[#2F3530]/55">
              Como você se sente agora?
            </label>
            <input type="hidden" name="core_emotion" value={selectedEmotion} />
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {EMOTIONS.map((emotion) => {
                const isSelected = selectedEmotion === emotion.id
                return (
                  <button
                    key={emotion.id}
                    type="button"
                    onClick={() => setSelectedEmotion(emotion.id)}
                    className={`py-1.5 px-3 rounded-full text-xs font-medium border transition-all duration-150 flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95 ${
                      isSelected
                        ? emotion.selectedPillClass
                        : 'bg-transparent border-[#DDD6CA] text-[#2F3530]/70 hover:border-[#2F3530]/35 hover:text-[#2F3530]'
                    }`}
                  >
                    <FaIcon icon={emotion.icon} className="w-3.5 h-3.5" />
                    <span>{emotion.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <p className="hidden sm:block text-[11px] text-[#2F3530]/45">
              Seu relato fica guardado apenas no seu espaço.
            </p>
            <button
              type="submit"
              disabled={isPending}
              className={`${BUTTON_PRIMARY} w-full sm:w-auto`}
            >
              {isPending ? (
                <>
                  <FaIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin text-current" />
                  <span>Guardando relato...</span>
                </>
              ) : (
                <span>Guardar relato</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
