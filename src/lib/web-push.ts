import { sendNotification, setVapidDetails } from 'web-push'

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

export const CHECKIN_MESSAGES: string[] = [
  'Pausa rápida: como você está se sentindo neste momento do dia?',
  'Como está sua mente agora? Vale registrar algumas linhas no diário.',
  'O que tem ocupado seus pensamentos nas últimas horas? Anote com calma.',
  'Check-in de 2 minutos: algo mexeu com você hoje que mereça registro?',
  'Respire fundo por um instante. Como tem sido o ritmo do seu dia até aqui?',
]

let vapidConfigured = false

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:contato@betterthoughts.app'

  if (!publicKey || !privateKey) {
    return false
  }

  setVapidDetails(subject, publicKey, privateKey)
  vapidConfigured = true
  return true
}

export async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<{ ok: boolean; gone?: boolean; error?: string }> {
  if (!ensureVapidConfigured()) {
    return {
      ok: false,
      error: 'Chaves VAPID não configuradas no ambiente.',
    }
  }

  try {
    await sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    )
    return { ok: true }
  } catch (err: unknown) {
    const statusCode =
      typeof err === 'object' && err !== null && 'statusCode' in err
        ? Number((err as { statusCode?: number }).statusCode)
        : undefined

    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, gone: true, error: `Subscription expired (${statusCode})` }
    }

    const message = err instanceof Error ? err.message : 'Erro desconhecido ao enviar push'
    return { ok: false, error: message }
  }
}

