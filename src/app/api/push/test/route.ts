import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { sendWebPush } from '@/lib/web-push'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { user_id: user.id },
  })

  if (subscriptions.length === 0) {
    return NextResponse.json(
      { error: 'Nenhum aparelho registrado para notificações.' },
      { status: 400 }
    )
  }

  let sent = 0
  let cleaned = 0
  const errors: string[] = []

  for (const sub of subscriptions) {
    const res = await sendWebPush(sub, {
      title: 'Notificação de teste',
      body: 'Tudo certo com seus lembretes neste aparelho.',
      url: '/gatilhos',
      tag: 'betterthoughts-test',
    })

    if (res.ok) {
      sent++
    } else if (res.gone) {
      await prisma.pushSubscription.deleteMany({ where: { id: sub.id } })
      cleaned++
      errors.push(res.error || 'Assinatura expirada removida.')
    } else if (res.error) {
      errors.push(res.error)
    }
  }

  if (sent === 0) {
    return NextResponse.json(
      {
        error: errors[0] || 'Não foi possível entregar a notificação de teste.',
        errors,
        cleaned,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, sent, cleaned, errors })
}

