export function formatLocalDateTime(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

export function parseLocalDateTimeWithOffset(
  raw: string,
  timezoneOffsetRaw: string | null
): Date | null {
  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
  )
  if (!match) return null

  const [, yStr, mStr, dStr, hStr, minStr, secStr] = match
  const offsetMinutes =
    timezoneOffsetRaw !== null && !isNaN(Number(timezoneOffsetRaw))
      ? Number(timezoneOffsetRaw)
      : 180

  const localAsUtcMs = Date.UTC(
    Number(yStr),
    Number(mStr) - 1,
    Number(dStr),
    Number(hStr),
    Number(minStr),
    secStr ? Number(secStr) : 0,
    0
  )

  const parsedDate = new Date(localAsUtcMs + offsetMinutes * 60 * 1000)
  return isNaN(parsedDate.getTime()) ? null : parsedDate
}

