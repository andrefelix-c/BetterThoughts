'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { faCalendar, faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { faCheck, faPenToSquare } from '@fortawesome/free-solid-svg-icons'
import { deleteTriggerAction, resolveTriggerAction } from '@/app/gatilhos/actions'
import FaIcon from './fa-icon'

export interface PendingTriggerItem {
  id: string
  title: string
  event_time: string
  hasPassed: boolean
}

export default function TriggerList({
  triggers,
}: {
  triggers: PendingTriggerItem[]
}) {
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  const visibleTriggers = triggers.filter((t) => !hiddenIds.includes(t.id))

  const handleResolve = (id: string) => {
    startTransition(async () => {
      const res = await resolveTriggerAction(id)
      if (res.success) {
        setHiddenIds((prev) => [...prev, id])
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteTriggerAction(id)
      if (res.success) {
        setHiddenIds((prev) => [...prev, id])
      }
    })
  }

  if (visibleTriggers.length === 0) {
    return (
      <div className="border-t border-[#E2DDD3] pt-6 text-center py-8 space-y-1.5">
        <p className="text-sm font-medium text-[#2F3530]">
          Nenhum evento pendente no radar
        </p>
        <p className="text-xs text-[#2F3530]/55">
          Cadastre acima compromissos ou situações importantes para lembrar de relatar depois.
        </p>
      </div>
    )
  }

  return (
    <div className="border-t border-[#E2DDD3] pt-5 space-y-3">
      <div className="flex items-center justify-between text-xs text-[#2F3530]/55">
        <span>Próximos eventos no radar ({visibleTriggers.length})</span>
      </div>

      <div className="divide-y divide-[#E2DDD3]">
        {visibleTriggers.map((trigger) => {
          const formattedDate = new Date(trigger.event_time).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })

          return (
            <div
              key={trigger.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      trigger.hasPassed ? 'bg-[#C98A74]' : 'bg-[#7B907E]'
                    }`}
                  />
                  <p className="text-sm font-medium text-[#2F3530] wrap-break-word">
                    {trigger.title}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 pl-4 text-xs text-[#2F3530]/55">
                  <span className="inline-flex items-center gap-1.5">
                    <FaIcon icon={faCalendar} className="w-3 h-3 text-[#7B907E]" />
                    {formattedDate}
                  </span>
                  <span>·</span>
                  <span className={trigger.hasPassed ? 'text-[#9A5B45] font-medium' : ''}>
                    {trigger.hasPassed ? 'Aguardando relato' : 'Agendado'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-4 sm:pl-0 shrink-0">
                {trigger.hasPassed && (
                  <Link
                    href={`/?triggerId=${trigger.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7B907E] hover:text-[#5F7362] px-2.5 py-1.5 rounded-full border border-[#D7CFC2] transition-colors"
                  >
                    <FaIcon icon={faPenToSquare} className="w-3 h-3" />
                    <span>Relatar</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => handleResolve(trigger.id)}
                  disabled={isPending}
                  title="Marcar como concluído sem relatar"
                  aria-label="Dispensar evento"
                  className="inline-flex items-center gap-1 text-xs text-[#2F3530]/60 hover:text-[#2F3530] px-2.5 py-1.5 rounded-full hover:bg-[#EAE5DC] transition-colors cursor-pointer disabled:opacity-40"
                >
                  <FaIcon icon={faCheck} className="w-3 h-3" />
                  <span>Dispensar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(trigger.id)}
                  disabled={isPending}
                  title="Excluir evento"
                  aria-label="Excluir evento"
                  className="p-2 text-[#2F3530]/40 hover:text-[#9E4B39] rounded-full transition-colors cursor-pointer disabled:opacity-40"
                >
                  <FaIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

