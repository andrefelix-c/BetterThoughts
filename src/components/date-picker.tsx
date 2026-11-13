'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { faCalendar, faClock } from '@fortawesome/free-regular-svg-icons'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import FaIcon from './fa-icon'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const MONTHS_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const emptySubscribe = () => () => {}

function getClientTodayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseIsoParts(value: string) {
  const datePart = value.slice(0, 10)
  const [yStr, mStr, dStr] = datePart.split('-')
  const year = Number(yStr) || 2026
  const month = (Number(mStr) || 1) - 1 // 0-indexed
  const day = Number(dStr) || 1

  const timePart = value.length >= 16 ? value.slice(11, 16) : '12:00'
  const [hStr = '12', minStr = '00'] = timePart.split(':')

  return {
    datePart,
    year,
    month,
    day,
    hour: hStr.padStart(2, '0'),
    minute: minStr.padStart(2, '0'),
  }
}

function formatDisplayValue(value: string, includeTime?: boolean): string {
  if (!value) return 'Selecionar data'
  const [datePart, timePart] = value.split('T')
  const parts = datePart.split('-')
  if (parts.length !== 3) return value
  const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`
  if (includeTime && timePart) {
    return `${formattedDate} · ${timePart.slice(0, 5)}`
  }
  return formattedDate
}

function toIsoDate(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function DatePicker({
  id,
  name,
  value,
  onChange,
  includeTime = false,
  disableFuture = false,
  maxIso,
  minIso,
  label,
  align = 'left',
  variant = 'underline',
  defaultOpen = false,
}: {
  id?: string
  name: string
  value: string
  onChange: (nextValue: string) => void
  includeTime?: boolean
  disableFuture?: boolean
  maxIso?: string
  minIso?: string
  label?: string
  align?: 'left' | 'right'
  variant?: 'underline' | 'inline'
  defaultOpen?: boolean
}) {
  const parsed = parseIsoParts(value)
  const todayIso = useSyncExternalStore(emptySubscribe, getClientTodayIso, () => '')

  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [viewYear, setViewYear] = useState(parsed.year)
  const [viewMonth, setViewMonth] = useState(parsed.month)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const toggleOpen = () => {
    if (!isOpen) {
      setViewYear(parsed.year)
      setViewMonth(parsed.month)
    }
    setIsOpen((prev) => !prev)
  }

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()

  const handleSelectDay = (day: number) => {
    const nextDate = toIsoDate(viewYear, viewMonth, day)
    if (includeTime) {
      onChange(`${nextDate}T${parsed.hour}:${parsed.minute}`)
    } else {
      onChange(nextDate)
      setIsOpen(false)
    }
  }

  const handleTimeChange = (nextHour: string, nextMinute: string) => {
    onChange(`${parsed.datePart}T${nextHour}:${nextMinute}`)
  }

  const effectiveMaxIso =
    disableFuture && todayIso
      ? maxIso && maxIso < todayIso
        ? maxIso
        : todayIso
      : maxIso

  return (
    <div className="relative min-w-0" ref={containerRef}>
      <input type="hidden" name={name} value={value} />

      <button
        id={id}
        type="button"
        onClick={toggleOpen}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={label || 'Selecionar data'}
        className={
          variant === 'underline'
            ? 'w-full min-w-0 border-0 border-b border-[#D7CFC2] hover:border-[#2F3530]/60 focus:border-[#2F3530] bg-transparent px-0 py-1.5 text-sm text-[#2F3530] focus:outline-none transition flex items-center justify-between gap-2 cursor-pointer text-left'
            : 'border-0 border-b border-[#D7CFC2] hover:border-[#2F3530]/60 focus:border-[#2F3530] bg-transparent px-0 py-0.5 text-xs text-[#2F3530] focus:outline-none transition inline-flex items-center gap-1.5 cursor-pointer'
        }
      >
        <span className="truncate">{formatDisplayValue(value, includeTime)}</span>
        <FaIcon icon={faCalendar} className="w-3.5 h-3.5 text-[#7B907E] shrink-0" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false)
          }}
          className={`fixed inset-0 z-50 bg-[#2F3530]/35 backdrop-blur-[1px] flex items-center justify-center p-4 sm:backdrop-blur-none sm:bg-transparent sm:p-0 sm:inset-auto sm:top-full sm:block sm:absolute sm:mt-2 sm:z-40 ${
            align === 'right' ? 'sm:right-0' : 'sm:left-0'
          }`}
        >
          <div
            role="dialog"
            aria-label={label || 'Calendário'}
            className="w-full max-w-[300px] sm:w-[276px] rounded-3xl sm:rounded-2xl bg-[#F7F5F0] border border-[#DDD6CA] shadow-xl sm:shadow-lg p-5 sm:p-4 space-y-3.5 sm:space-y-3"
          >
          {/* Cabeçalho Mês/Ano */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="Mês anterior"
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#2F3530]/65 hover:text-[#2F3530] hover:bg-[#EAE5DC] transition-colors cursor-pointer"
            >
              <FaIcon icon={faChevronLeft} className="w-3 h-3" />
            </button>

            <span className="text-xs sm:text-sm font-medium text-[#2F3530] capitalize">
              {MONTHS_PT[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={goNextMonth}
              aria-label="Próximo mês"
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#2F3530]/65 hover:text-[#2F3530] hover:bg-[#EAE5DC] transition-colors cursor-pointer"
            >
              <FaIcon icon={faChevronRight} className="w-3 h-3" />
            </button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((wd, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium text-[#2F3530]/40 py-1"
              >
                {wd}
              </span>
            ))}

            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <span key={`empty-${idx}`} />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const iso = toIsoDate(viewYear, viewMonth, day)
              const isSelected = iso === parsed.datePart
              const isToday = iso === todayIso
              const isDisabled =
                (effectiveMaxIso && iso > effectiveMaxIso) ||
                (minIso && iso < minIso)

              return (
                <button
                  key={day}
                  type="button"
                  disabled={Boolean(isDisabled)}
                  onClick={() => handleSelectDay(day)}
                  className={`w-8 h-8 mx-auto rounded-full text-xs flex items-center justify-center transition-colors ${
                    isDisabled
                      ? 'text-[#2F3530]/20 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#2F3530] text-[#F7F5F0] font-medium cursor-pointer'
                      : isToday
                      ? 'border border-[#7B907E] text-[#445646] font-medium hover:bg-[#EAE5DC] cursor-pointer'
                      : 'text-[#2F3530]/85 hover:bg-[#EAE5DC] cursor-pointer'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Seletor de horário (opcional) */}
          {includeTime && (
            <div className="border-t border-[#E2DDD3] pt-3 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-[#2F3530]/60">
                <FaIcon icon={faClock} className="w-3 h-3 text-[#7B907E]" />
                Horário
              </span>

              <div className="flex items-center gap-1">
                <select
                  aria-label="Hora"
                  value={parsed.hour}
                  onChange={(e) => handleTimeChange(e.target.value, parsed.minute)}
                  className="bg-transparent border-b border-[#D7CFC2] focus:border-[#2F3530] text-base sm:text-xs font-medium text-[#2F3530] py-0.5 px-1 focus:outline-none cursor-pointer"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h} className="bg-[#F7F5F0]">
                      {h}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-[#2F3530]/50">:</span>
                <select
                  aria-label="Minutos"
                  value={parsed.minute}
                  onChange={(e) => handleTimeChange(parsed.hour, e.target.value)}
                  className="bg-transparent border-b border-[#D7CFC2] focus:border-[#2F3530] text-base sm:text-xs font-medium text-[#2F3530] py-0.5 px-1 focus:outline-none cursor-pointer"
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m} className="bg-[#F7F5F0]">
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-medium text-[#7B907E] hover:text-[#5F7362] cursor-pointer pl-1"
              >
                OK
              </button>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  )
}

