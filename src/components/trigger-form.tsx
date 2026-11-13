'use client'

import { useActionState, useState } from 'react'
import { faCheck, faSpinner, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { createTriggerAction, type TriggerActionState } from '@/app/gatilhos/actions'
import { BUTTON_PRIMARY } from '@/lib/button-styles'
import DatePicker from './date-picker'
import FaIcon from './fa-icon'

export default function TriggerForm() {
  const [title, setTitle] = useState('')
  const [eventDateTime, setEventDateTime] = useState('')
  const [tzOffset] = useState(() =>
    typeof window !== 'undefined' ? new Date().getTimezoneOffset() : 180
  )

  const [state, formAction, isPending] = useActionState<
    TriggerActionState,
    FormData
  >(async (prev, formData) => {
    const result = await createTriggerAction(prev, formData)
    if (result.success) {
      setTitle('')
    }
    return result
  }, {})

  return (
    <form action={formAction} className="border-t border-[#E2DDD3] pt-5 space-y-5">
      <input type="hidden" name="timezoneOffset" value={tzOffset} />

      {state?.error && (
        <div
          role="alert"
          className="border-l-2 border-[#C98A74] pl-3.5 py-1 text-[#7A4432] text-xs flex items-center gap-2"
        >
          <FaIcon icon={faTriangleExclamation} className="w-3.5 h-3.5 text-[#C98A74] shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && state.message && (
        <div
          role="status"
          className="border-l-2 border-[#7B907E] pl-3.5 py-1 text-[#3F5142] text-xs flex items-center gap-2"
        >
          <FaIcon icon={faCheck} className="w-3.5 h-3.5 text-[#7B907E] shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-end">
        <div className="sm:col-span-7 min-w-0 space-y-1.5">
          <label
            htmlFor="trigger-title"
            className="block text-xs font-medium text-[#2F3530]/60"
          >
            O que vai acontecer?
          </label>
          <input
            id="trigger-title"
            name="title"
            type="text"
            required
            maxLength={140}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Trabalho presencial, Muay Thai, Consulta..."
            className="w-full rounded-none bg-transparent border-0 border-b border-[#D7CFC2] px-0 py-1.5 text-base sm:text-sm text-[#2F3530] placeholder-[#2F3530]/35 focus:outline-none focus:border-[#2F3530] transition"
          />
        </div>

        <div className="sm:col-span-5 min-w-0 space-y-1.5">
          <label
            htmlFor="trigger-event-time"
            className="block text-xs font-medium text-[#2F3530]/60"
          >
            Quando?
          </label>
          <DatePicker
            id="trigger-event-time"
            name="event_time"
            value={eventDateTime}
            onChange={setEventDateTime}
            includeTime
            disablePast
            align="right"
            label="Data e hora do evento"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <p className="text-[11px] text-[#2F3530]/50">
          O lembrete é enviado cerca de 2h após o horário marcado.
        </p>

        <button
          type="submit"
          disabled={isPending}
          className={`${BUTTON_PRIMARY} w-full sm:w-auto shrink-0`}
        >
          {isPending ? (
            <>
              <FaIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin text-current" />
              <span>Adicionando...</span>
            </>
          ) : (
            <span>Adicionar ao radar</span>
          )}
        </button>
      </div>
    </form>
  )
}
