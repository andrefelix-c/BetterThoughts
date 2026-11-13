import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { generateTriggerNotification } from '@/services/ai'
import { CHECKIN_MESSAGES, sendWebPush } from '@/lib/web-push'

function getLocalHour(timeZone: string, date: Date): number {
  try {
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    }).format(date)
    const hour = Number(formatted)
    return Number.isFinite(hour) ? hour % 24 : date.getUTCHours()
  } catch {
    return (date.getUTCHours() + 21) % 24
  }
}

function isWithinActiveHours(hour: number, start: number, end: number): boolean {
  if (start === end) return true
  if (start < end) {
    return hour >= start && hour < end
  }
  return hour >= start || hour < end
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const ninetyMinutesAgo = new Date(now.getTime() - 90 * 60 * 1000)

  let eventNotificationsSent = 0
  let checkinNotificationsSent = 0
  let subscriptionsCleaned = 0
  const errors: string[] = []
  const eventNotifiedUsers = new Set<string>()

  // 1. Notificações de Gatilhos (2h a 24h após o event_time, geradas por IA)
  const pendingTriggers = await prisma.trigger.findMany({
    where: {
      is_resolved: false,
      reminder_sent_at: null,
      event_time: {
        lte: twoHoursAgo,
        gte: twentyFourHoursAgo,
      },
      users: {
        push_subscriptions: {
          some: {},
        },
      },
    },
    include: {
      users: {
        select: {
          profiles: {
            select: { therapeutic_focus: true },
          },
          push_subscriptions: true,
        },
      },
    },
    orderBy: { event_time: 'asc' },
    take: 50,
  })

  for (const trigger of pendingTriggers) {
    const subs = trigger.users.push_subscriptions
    if (subs.length === 0) continue

    const message = await generateTriggerNotification({
      title: trigger.title,
      therapeuticFocus: trigger.users.profiles?.therapeutic_focus,
    })

    let deliveredToAny = false
    for (const sub of subs) {
      const res = await sendWebPush(sub, {
        title: message.title,
        body: message.body,
        url: `/?triggerId=${trigger.id}`,
        tag: `trigger-${trigger.id}`,
      })

      if (res.ok) {
        deliveredToAny = true
      } else if (res.gone) {
        await prisma.pushSubscription.deleteMany({
          where: { id: sub.id },
        })
        subscriptionsCleaned++
      } else if (res.error) {
        errors.push(`trigger:${trigger.id}: ${res.error}`)
      }
    }

    if (deliveredToAny) {
      await prisma.trigger.update({
        where: { id: trigger.id },
        data: { reminder_sent_at: now },
      })
      eventNotificationsSent++
      eventNotifiedUsers.add(trigger.user_id)
    }
  }

  // 2. Notificações padrão de check-in a cada 3 horas (respeitando janela ativa)
  const checkinCandidates = await prisma.profile.findMany({
    where: {
      checkin_enabled: true,
      users: {
        push_subscriptions: {
          some: {},
        },
      },
    },
    include: {
      users: {
        select: {
          push_subscriptions: true,
        },
      },
    },
  })

  for (const profile of checkinCandidates) {
    if (eventNotifiedUsers.has(profile.id)) continue

    const subs = profile.users.push_subscriptions
    if (subs.length === 0) continue

    const localHour = getLocalHour(profile.timezone, now)
    if (!isWithinActiveHours(localHour, profile.active_start_hour, profile.active_end_hour)) {
      continue
    }

    // Margem de 10 minutos para evitar perda de ciclo em cron de 15/30 min
    const intervalMs = Math.max(1, profile.checkin_interval_hours) * 60 * 60 * 1000 - 10 * 60 * 1000
    if (
      profile.last_checkin_sent_at &&
      now.getTime() - profile.last_checkin_sent_at.getTime() < intervalMs
    ) {
      continue
    }

    // Evita enviar check-in se o usuário acabou de escrever ou recebeu lembrete de evento há menos de 90 min
    const recentActivityCount = await prisma.entry.count({
      where: {
        user_id: profile.id,
        created_at: { gte: ninetyMinutesAgo },
      },
    })
    if (recentActivityCount > 0) continue

    const recentTriggerCount = await prisma.trigger.count({
      where: {
        user_id: profile.id,
        reminder_sent_at: { gte: ninetyMinutesAgo },
      },
    })
    if (recentTriggerCount > 0) continue

    const msgIndex =
      Math.floor(now.getTime() / (3 * 60 * 60 * 1000)) % CHECKIN_MESSAGES.length
    const body = CHECKIN_MESSAGES[msgIndex]

    let deliveredToAny = false
    for (const sub of subs) {
      const res = await sendWebPush(sub, {
        title: 'BetterThoughts',
        body,
        url: '/',
        tag: 'checkin-3h',
      })

      if (res.ok) {
        deliveredToAny = true
      } else if (res.gone) {
        await prisma.pushSubscription.deleteMany({
          where: { id: sub.id },
        })
        subscriptionsCleaned++
      } else if (res.error) {
        errors.push(`checkin:${profile.id}: ${res.error}`)
      }
    }

    if (deliveredToAny) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: { last_checkin_sent_at: now },
      })
      checkinNotificationsSent++
    }
  }

  return NextResponse.json({
    ok: true,
    checkedAt: now.toISOString(),
    eventNotificationsSent,
    checkinNotificationsSent,
    subscriptionsCleaned,
    errors,
  })
}

