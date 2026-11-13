'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { generateSocraticReflection, type SocraticReflection } from '@/services/ai'
import { parseLocalDateTimeWithOffset } from '@/lib/date-time'

export interface SaveEntryState {
  success?: boolean
  error?: string
  reflection?: SocraticReflection | null
  savedEntryId?: string
}

export async function createJournalEntry(
  prevState: SaveEntryState,
  formData: FormData
): Promise<SaveEntryState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado. Faça login novamente.' }
  }

  const description = (formData.get('description') as string)?.trim()
  const coreEmotion = (formData.get('core_emotion') as string)?.trim() || null
  const customEntryDateRaw = (formData.get('entry_date') as string)?.trim()
  const timezoneOffsetRaw = formData.get('timezoneOffset') as string | null
  const triggerIdRaw = (formData.get('trigger_id') as string)?.trim() || null

  if (!description) {
    return { error: 'Por favor, escreva o seu relato antes de salvar.' }
  }

  let customCreatedAt: Date | undefined
  if (customEntryDateRaw) {
    const parsedDate = parseLocalDateTimeWithOffset(
      customEntryDateRaw,
      timezoneOffsetRaw
    )
    if (!parsedDate) {
      return { error: 'Data e hora do relato inválidas.' }
    }

    if (parsedDate.getTime() > Date.now() + 15 * 60 * 1000) {
      return { error: 'A data do relato não pode estar no futuro.' }
    }

    customCreatedAt = parsedDate
  }

  try {
    // 1. Busca foco terapêutico vigente e eventual gatilho associado
    let therapeuticFocus: string | null = null
    try {
      const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { therapeutic_focus: true },
      })
      therapeuticFocus = profile?.therapeutic_focus || null
    } catch (profileErr) {
      console.warn('Aviso: Não foi possível obter o foco terapêutico:', profileErr)
    }

    const linkedTrigger = triggerIdRaw
      ? await prisma.trigger.findFirst({
          where: {
            id: triggerIdRaw,
            user_id: user.id,
          },
          select: { id: true, title: true },
        })
      : null

    // 2. Aciona a OpenAI para produzir a reflexão socrática
    const reflection = await generateSocraticReflection({
      description,
      coreEmotion,
      therapeuticFocus,
      triggerTitle: linkedTrigger?.title,
    })

    // 3. Salva a entrada e resolve o gatilho vinculado em transação
    const entry = await prisma.$transaction(async (tx) => {
      const created = await tx.entry.create({
        data: {
          user_id: user.id,
          description,
          core_emotion: coreEmotion,
          ai_reflection: reflection as unknown as object,
          ...(linkedTrigger ? { trigger_id: linkedTrigger.id } : {}),
          ...(customCreatedAt ? { created_at: customCreatedAt } : {}),
        },
      })

      if (linkedTrigger) {
        await tx.trigger.update({
          where: { id: linkedTrigger.id },
          data: { is_resolved: true },
        })
      }

      return created
    })

    revalidatePath('/')
    revalidatePath('/gatilhos')
    revalidatePath('/historico')
    revalidatePath('/resumo')

    return {
      success: true,
      reflection,
      savedEntryId: entry.id,
    }
  } catch (err: unknown) {
    console.error('Erro ao salvar relato no diário:', err)
    const message =
      err instanceof Error
        ? err.message
        : 'Não foi possível registrar o momento. Verifique a conexão com o banco de dados.'
    return {
      error: message,
    }
  }
}

export interface SaveAnswersState {
  success?: boolean
  error?: string
  savedEntryId?: string
  answers?: string[]
}

export async function saveEntryAnswers(
  prevState: SaveAnswersState,
  formData: FormData
): Promise<SaveAnswersState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado. Faça login novamente.' }
  }

  const entryId = formData.get('entryId') as string
  if (!entryId) {
    return { error: 'ID do registro não fornecido.' }
  }

  // Coleta as respostas do formulário (answer_0, answer_1, ...)
  const answers: string[] = []
  let index = 0
  while (formData.has(`answer_${index}`) || formData.has(`answer-${index}`)) {
    const rawValue = formData.get(`answer_${index}`) ?? formData.get(`answer-${index}`)
    answers.push(((rawValue as string) || '').trim())
    index++
  }

  try {
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      select: { user_id: true, ai_reflection: true },
    })

    if (!entry || entry.user_id !== user.id) {
      return { error: 'Registro não encontrado ou não autorizado.' }
    }

    const currentReflection = (entry.ai_reflection as Record<string, unknown>) || {}
    const updatedReflection = {
      ...currentReflection,
      answers,
    }

    await prisma.entry.update({
      where: { id: entryId },
      data: {
        ai_reflection: updatedReflection as unknown as object,
      },
    })

    revalidatePath('/')
    revalidatePath('/historico')
    revalidatePath('/resumo')

    return {
      success: true,
      savedEntryId: entryId,
      answers,
    }
  } catch (err: unknown) {
    console.error('Erro ao salvar respostas das perguntas socráticas:', err)
    const message =
      err instanceof Error ? err.message : 'Falha ao salvar respostas no banco.'
    return { error: message }
  }
}

export async function deleteJournalEntry(
  entryId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Usuário não autenticado.' }
  }

  if (!entryId) {
    return { success: false, error: 'ID inválido.' }
  }

  try {
    const result = await prisma.entry.deleteMany({
      where: {
        id: entryId,
        user_id: user.id,
      },
    })

    if (result.count === 0) {
      return { success: false, error: 'Registro não encontrado ou não autorizado.' }
    }

    revalidatePath('/')
    revalidatePath('/historico')
    revalidatePath('/resumo')

    return { success: true }
  } catch (err: unknown) {
    console.error('Erro ao excluir relato:', err)
    const message =
      err instanceof Error ? err.message : 'Não foi possível excluir o relato.'
    return { success: false, error: message }
  }
}
