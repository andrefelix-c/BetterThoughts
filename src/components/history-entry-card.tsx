'use client'

import { useEffect, useState, useTransition } from 'react'
import { faLightbulb, faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { faChevronRight, faXmark } from '@fortawesome/free-solid-svg-icons'
import { deleteJournalEntry, saveEntryAnswers } from '@/app/actions'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/lib/button-styles'
import { getEmotionConfig } from '@/lib/emotions'
import FaIcon from './fa-icon'

interface AIReflectionData {
  observation?: string
  questions?: string[]
  answers?: string[]
}

export interface HistoryEntryProps {
  id: string
  description: string
  core_emotion: string | null
  ai_reflection: AIReflectionData | null
  created_at: Date | string | null
}

export default function HistoryEntryCard({ entry }: { entry: HistoryEntryProps }) {
  const [isPendingDelete, startDeleteTransition] = useTransition()
  const [isPendingSave, startSaveTransition] = useTransition()

  const [isOpen, setIsOpen] = useState(false)
  const [aiData, setAiData] = useState<AIReflectionData | null>(entry.ai_reflection)
  const [isEditingAnswers, setIsEditingAnswers] = useState(false)
  const [answers, setAnswers] = useState<string[]>(() => {
    const questions = entry.ai_reflection?.questions || []
    const existing = entry.ai_reflection?.answers || []
    return questions.map((_, idx) => existing[idx] || '')
  })
  const [isDeleted, setIsDeleted] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  const handleClose = () => {
    setIsOpen(false)
    setIsEditingAnswers(false)
  }

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const emotion = getEmotionConfig(entry.core_emotion)

  const formattedDate = entry.created_at
    ? new Date(entry.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Data não informada'

  const handleDelete = () => {
    const confirmed = window.confirm(
      'Deseja realmente excluir este relato do diário terapêutico? Esta ação não pode ser desfeita.'
    )
    if (!confirmed) return

    startDeleteTransition(async () => {
      const res = await deleteJournalEntry(entry.id)
      if (res.success) {
        setIsOpen(false)
        setIsDeleted(true)
      } else {
        alert(res.error || 'Falha ao excluir o relato.')
      }
    })
  }

  const handleSaveAnswers = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFeedbackMsg(null)

    const formData = new FormData(e.currentTarget)
    formData.set('entryId', entry.id)

    startSaveTransition(async () => {
      const res = await saveEntryAnswers({}, formData)
      if (res.success) {
        setAiData((prev) => ({
          ...prev,
          questions: prev?.questions || [],
          answers: res.answers,
        }))
        setIsEditingAnswers(false)
        setFeedbackMsg('Respostas atualizadas com sucesso.')
        setTimeout(() => setFeedbackMsg(null), 3000)
      } else {
        setFeedbackMsg(res.error || 'Erro ao salvar respostas.')
      }
    })
  }

  if (isDeleted) {
    return null
  }

  const questions = aiData?.questions || []
  const hasQuestions = questions.length > 0
  const savedAnswers = aiData?.answers || []
  const answeredCount = questions.filter((_, idx) => savedAnswers[idx]?.trim()).length
  const hasExistingAnswers = answeredCount > 0

  return (
    <>
      <div className="border-b border-[#E2DDD3] py-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full text-left rounded-2xl px-3 py-3.5 sm:py-4 hover:bg-[#EAE5DC]/45 transition-colors cursor-pointer space-y-2.5 group"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium text-[#2F3530] flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${emotion.dotClass}`} />
              {emotion.label}
            </span>
            <time className="text-[11px] text-[#2F3530]/50 font-normal">{formattedDate}</time>
          </div>

          <p className="text-sm sm:text-[15px] text-[#2F3530]/85 leading-relaxed line-clamp-2">
            {entry.description}
          </p>

          <div className="flex items-center justify-between gap-3 pt-0.5 text-xs">
            <span className="inline-flex items-center gap-1.5 text-[#5B705E]">
              {hasQuestions ? (
                <>
                  <FaIcon icon={faLightbulb} className="w-3 h-3 text-[#7B907E]" />
                  {hasExistingAnswers
                    ? `${answeredCount} de ${questions.length} ${questions.length === 1 ? 'pergunta respondida' : 'perguntas respondidas'}`
                    : `${questions.length} ${questions.length === 1 ? 'pergunta reflexiva' : 'perguntas reflexivas'}`}
                </>
              ) : aiData?.observation ? (
                <>
                  <FaIcon icon={faLightbulb} className="w-3 h-3 text-[#7B907E]" />
                  Com reflexão terapêutica
                </>
              ) : (
                <span className="text-[#2F3530]/45">Registro simples</span>
              )}
            </span>

            <span className="inline-flex items-center gap-1 font-medium text-[#7B907E] group-hover:text-[#5F7362] transition-colors shrink-0">
              Ver detalhes
              <FaIcon
                icon={faChevronRight}
                className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform"
              />
            </span>
          </div>
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#2F3530]/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Detalhes do relato no diário terapêutico"
            className="w-full sm:max-w-2xl max-h-[90dvh] sm:max-h-[85dvh] bg-[#F7F5F0] rounded-t-3xl sm:rounded-3xl border border-[#E2DDD3] shadow-xl flex flex-col overflow-hidden"
          >
            <div className="border-b border-[#E2DDD3] px-5 sm:px-6 py-4 flex items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2.5 min-w-0 text-xs">
                <span className="font-medium text-[#2F3530] flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${emotion.dotClass}`} />
                  {emotion.label}
                </span>
                <span className="text-[#2F3530]/25">·</span>
                <time className="text-[#2F3530]/55 font-normal">{formattedDate}</time>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPendingDelete}
                  title="Excluir relato"
                  aria-label="Excluir relato"
                  className="text-[#2F3530]/45 hover:text-[#9E4B39] p-2 rounded-full transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <FaIcon icon={faTrashCan} className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  title="Fechar"
                  aria-label="Fechar detalhes"
                  className="text-[#2F3530]/55 hover:text-[#2F3530] p-2 rounded-full transition-colors cursor-pointer"
                >
                  <FaIcon icon={faXmark} className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-5 sm:px-6 py-5 space-y-6">
              <div className="text-[#2F3530] text-[15px] leading-[1.75] whitespace-pre-wrap">
                {entry.description}
              </div>

              {feedbackMsg && (
                <div className="border-l-2 border-[#7B907E] pl-3.5 py-0.5 text-xs font-medium text-[#5A6D5D]">
                  {feedbackMsg}
                </div>
              )}

              {aiData && (aiData.observation || hasQuestions) && (
                <div className="border-t border-[#E2DDD3] pt-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5F7362]">
                      <FaIcon icon={faLightbulb} className="w-3.5 h-3.5 text-[#C98A74]" />
                      Reflexão Terapêutica
                    </span>

                    {hasQuestions && !isEditingAnswers && (
                      <button
                        type="button"
                        onClick={() => setIsEditingAnswers(true)}
                        className="text-xs font-medium text-[#7B907E] hover:text-[#5F7362] hover:underline cursor-pointer"
                      >
                        {hasExistingAnswers ? 'Editar respostas' : 'Responder'}
                      </button>
                    )}
                  </div>

                  {aiData.observation && (
                    <p className="font-serif italic text-sm text-[#2F3530]/85 border-l-2 border-[#C98A74] pl-3.5 py-0.5 leading-relaxed">
                      &ldquo;{aiData.observation}&rdquo;
                    </p>
                  )}

                  {hasQuestions && !isEditingAnswers && (
                    <div className="divide-y divide-[#E2DDD3]/75 pt-1">
                      {questions.map((question, idx) => {
                        const answer = savedAnswers[idx]
                        return (
                          <div key={idx} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                            <p className="text-xs font-medium text-[#2F3530]/80 leading-relaxed">
                              {idx + 1}. {question}
                            </p>
                            {answer && answer.trim() ? (
                              <p className="text-sm text-[#2F3530] border-l-2 border-[#7B907E]/45 pl-3 py-0.5 whitespace-pre-wrap leading-relaxed">
                                {answer}
                              </p>
                            ) : (
                              <p className="text-xs italic text-[#2F3530]/40 pl-3">
                                Ainda não respondida
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {hasQuestions && isEditingAnswers && (
                    <form onSubmit={handleSaveAnswers} className="space-y-4 pt-1">
                      {questions.map((question, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <label
                            htmlFor={`modal-answer-${entry.id}-${idx}`}
                            className="block text-xs font-medium text-[#2F3530]/85 leading-relaxed"
                          >
                            {idx + 1}. {question}
                          </label>
                          <textarea
                            id={`modal-answer-${entry.id}-${idx}`}
                            name={`answer-${idx}`}
                            rows={2}
                            value={answers[idx] || ''}
                            onChange={(e) => {
                              const next = [...answers]
                              next[idx] = e.target.value
                              setAnswers(next)
                            }}
                            placeholder="Escreva sua reflexão aqui..."
                            className="w-full rounded-xl bg-transparent border border-[#DDD6CA] px-3.5 py-2 text-sm text-[#2F3530] placeholder:text-[#2F3530]/35 focus:outline-none focus:ring-2 focus:ring-[#7B907E]/30 focus:border-[#7B907E] resize-y"
                          />
                        </div>
                      ))}

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={isPendingSave}
                          className={BUTTON_PRIMARY}
                        >
                          {isPendingSave ? 'Salvando...' : 'Salvar respostas'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingAnswers(false)
                            setAnswers(questions.map((_, idx) => savedAnswers[idx] || ''))
                          }}
                          disabled={isPendingSave}
                          className={BUTTON_SECONDARY}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
