import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'

interface SubscribeBody {
  endpoint?: string
  keys?: {
    p256dh?: string
    auth?: string
  }
  timezone?: string
}

function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  let body: SubscribeBody
  try {
    body = (await request.json()) as SubscribeBody
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const endpoint = body.endpoint?.trim()
  const p256dh = body.keys?.p256dh?.trim()
  const auth = body.keys?.auth?.trim()

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: 'Dados da assinatura push incompletos.' },
      { status: 400 }
    )
  }

  const timezone =
    body.timezone && isValidTimeZone(body.timezone)
      ? body.timezone
      : 'America/Sao_Paulo'

  try {
    await prisma.$transaction([
      prisma.pushSubscription.upsert({
        where: { endpoint },
        update: {
          user_id: user.id,
          p256dh,
          auth,
        },
        create: {
          user_id: user.id,
          endpoint,
          p256dh,
          auth,
        },
      }),
      prisma.profile.upsert({
        where: { id: user.id },
        update: { timezone },
        create: {
          id: user.id,
          timezone,
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro ao salvar assinatura push:', err)
    return NextResponse.json(
      { error: 'Não foi possível salvar a assinatura push.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  let endpoint: string | undefined
  try {
    const body = (await request.json()) as { endpoint?: string }
    endpoint = body.endpoint?.trim()
  } catch {
    endpoint = undefined
  }

  try {
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: {
          user_id: user.id,
          endpoint,
        },
      })
    } else {
      await prisma.pushSubscription.deleteMany({
        where: { user_id: user.id },
      })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro ao remover assinatura push:', err)
    return NextResponse.json(
      { error: 'Erro ao remover assinatura push.' },
      { status: 500 }
    )
  }
}

