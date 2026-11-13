'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { parseLocalDateTimeWithOffset } from '@/lib/date-time'

export interface TriggerActionState {
  success?: boolean
  error?: string
  message?: string
}

export async function createTriggerAction(
  prevState: TriggerActionState,
  formData: FormData
): Promise<TriggerActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado. Faça login novamente.' }
  }

  const title = (formData.get('title') as string)?.trim()
  const eventTimeRaw = (formData.get('event_time') as string)?.trim()
  const timezoneOffsetRaw = formData.get('timezoneOffset') as string | null

  if (!title) {
    return { error: 'Descreva o evento que vai acontecer.' }
  }

  if (title.length > 140) {
    return { error: 'O título do evento deve ter no máximo 140 caracteres.' }
  }

  if (!eventTimeRaw) {
    return { error: 'Selecione a data e o horário do evento.' }
  }

  const parsedEventTime = parseLocalDateTimeWithOffset(eventTimeRaw, timezoneOffsetRaw)
  if (!parsedEventTime) {
    return { error: 'Data e horário do evento inválidos.' }
  }

  try {
    await prisma.trigger.create({
      data: {
        user_id: user.id,
        title,
        event_time: parsedEventTime,
        is_resolved: false,
      },
    })

    revalidatePath('/gatilhos')
    revalidatePath('/')

    return {
      success: true,
      message: 'Evento adicionado ao radar. Você será lembrado após ele acontecer.',
    }
  } catch (err) {
    console.error('Erro ao criar gatilho:', err)
    return { error: 'Não foi possível salvar o evento. Tente novamente.' }
  }
}

export async function resolveTriggerAction(
  triggerId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Usuário não autenticado.' }
  }

  if (!triggerId) {
    return { success: false, error: 'Gatilho inválido.' }
  }

  try {
    const result = await prisma.trigger.updateMany({
      where: {
        id: triggerId,
        user_id: user.id,
      },
      data: {
        is_resolved: true,
      },
    })

    if (result.count === 0) {
      return { success: false, error: 'Evento não encontrado.' }
    }

    revalidatePath('/gatilhos')
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('Erro ao dispensar gatilho:', err)
    return { success: false, error: 'Não foi possível atualizar o evento.' }
  }
}

export async function deleteTriggerAction(
  triggerId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Usuário não autenticado.' }
  }

  if (!triggerId) {
    return { success: false, error: 'Gatilho inválido.' }
  }

  try {
    await prisma.$transaction([
      prisma.entry.updateMany({
        where: {
          trigger_id: triggerId,
          user_id: user.id,
        },
        data: { trigger_id: null },
      }),
      prisma.trigger.deleteMany({
        where: {
          id: triggerId,
          user_id: user.id,
        },
      }),
    ])

    revalidatePath('/gatilhos')
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('Erro ao excluir gatilho:', err)
    return { success: false, error: 'Não foi possível excluir o evento.' }
  }
}

export interface NotificationPrefsState {
  success?: boolean
  error?: string
  message?: string
}

export async function updateNotificationPreferencesAction(
  prevState: NotificationPrefsState,
  formData: FormData
): Promise<NotificationPrefsState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado.' }
  }

  const checkinEnabled = formData.get('checkin_enabled') === 'on'
  const activeStartHour = Number(formData.get('active_start_hour'))
  const activeEndHour = Number(formData.get('active_end_hour'))
  const timezone = (formData.get('timezone') as string)?.trim() || 'America/Sao_Paulo'

  if (
    !Number.isInteger(activeStartHour) ||
    activeStartHour < 0 ||
    activeStartHour > 23 ||
    !Number.isInteger(activeEndHour) ||
    activeEndHour < 0 ||
    activeEndHour > 23
  ) {
    return { error: 'Horário ativo inválido.' }
  }

  try {
    await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        checkin_enabled: checkinEnabled,
        checkin_interval_hours: 3,
        active_start_hour: activeStartHour,
        active_end_hour: activeEndHour,
        timezone,
      },
      create: {
        id: user.id,
        checkin_enabled: checkinEnabled,
        checkin_interval_hours: 3,
        active_start_hour: activeStartHour,
        active_end_hour: activeEndHour,
        timezone,
      },
    })

    revalidatePath('/gatilhos')
    return {
      success: true,
      message: 'Preferências de lembretes salvas.',
    }
  } catch (err) {
    console.error('Erro ao salvar preferências de notificação:', err)
    return { error: 'Não foi possível salvar suas preferências.' }
  }
}

