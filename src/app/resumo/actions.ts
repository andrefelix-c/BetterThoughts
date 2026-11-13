'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import {
  generateWeeklyReport,
  type SummaryEntryItem,
  type WeeklyReport,
} from '@/services/ai'

export interface SummaryActionState {
  report?: WeeklyReport | null
  entries?: SummaryEntryItem[]
  error?: string
  totalEntries?: number
  startDate?: string
  endDate?: string
}

export async function generateSummaryAction(
  prevState: SummaryActionState,
  formData: FormData
): Promise<SummaryActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado. Faça login novamente.' }
  }

  const startDateStr = formData.get('startDate') as string
  const endDateStr = formData.get('endDate') as string
  const timezoneOffsetRaw = formData.get('timezoneOffset') as string | null

  if (!startDateStr || !endDateStr) {
    return { error: 'Por favor, selecione as datas de início e fim do período.' }
  }

  // Fuso horário do cliente (ex: Brasil UTC-3 = 180 minutos)
  const offsetMinutes =
    timezoneOffsetRaw !== null && !isNaN(Number(timezoneOffsetRaw))
      ? Number(timezoneOffsetRaw)
      : 180

  const [sy, sm, sd] = startDateStr.split('-').map(Number)
  const [ey, em, ed] = endDateStr.split('-').map(Number)

  // Início do dia (00:00:00.000) no fuso do usuário convertido para UTC
  const startUtc = Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0)
  const startDate = new Date(startUtc + offsetMinutes * 60 * 1000)

  // Fim do dia (23:59:59.999) no fuso do usuário convertido para UTC
  const endUtc = Date.UTC(ey, em - 1, ed, 23, 59, 59, 999)
  const endDate = new Date(endUtc + offsetMinutes * 60 * 1000)

  if (startDate > endDate) {
    return { error: 'A data inicial não pode ser posterior à data final.' }
  }

  try {
    // 1. Busca os registros no período via Prisma
    const entries = await prisma.entry.findMany({
      where: {
        user_id: user.id,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { created_at: 'asc' },
    })

    if (entries.length === 0) {
      return {
        error: 'Nenhum registro encontrado neste período. Crie registros no diário terapêutico antes de gerar a síntese.',
        totalEntries: 0,
        startDate: startDateStr,
        endDate: endDateStr,
      }
    }

    // 2. Busca o foco terapêutico do usuário
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { therapeutic_focus: true },
    })

    // 3. Aciona a OpenAI para produzir o relatório estruturado
    const parsedEntries = entries.map((e) => {
      const reflection = e.ai_reflection as {
        observation?: string
        questions?: string[]
        answers?: string[]
      } | null
      return {
        id: e.id,
        description: e.description,
        coreEmotion: e.core_emotion,
        reflection,
        createdAt: e.created_at,
      }
    })

    const report = await generateWeeklyReport({
      entries: parsedEntries,
      therapeuticFocus: profile?.therapeutic_focus || null,
      startDate: startDateStr,
      endDate: endDateStr,
    })

    const serializedEntries: SummaryEntryItem[] = parsedEntries.map((e) => ({
      id: e.id,
      description: e.description,
      coreEmotion: e.coreEmotion,
      createdAt: e.createdAt ? e.createdAt.toISOString() : null,
      questions: e.reflection?.questions,
      answers: e.reflection?.answers,
    }))

    return {
      report,
      entries: serializedEntries,
      totalEntries: entries.length,
      startDate: startDateStr,
      endDate: endDateStr,
    }
  } catch (err: unknown) {
    console.error('Erro ao gerar relatório semanal:', err)
    const message =
      err instanceof Error
        ? err.message
        : 'Não foi possível gerar a síntese. Verifique suas credenciais da OpenAI e banco de dados.'
    return {
      error: message,
    }
  }
}
