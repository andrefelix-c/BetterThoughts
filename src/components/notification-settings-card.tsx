'use client'

import { useActionState, useEffect, useState } from 'react'
import { faBell, faBellSlash } from '@fortawesome/free-regular-svg-icons'
import { faCheck, faMobileScreen, faSpinner } from '@fortawesome/free-solid-svg-icons'
import {
  updateNotificationPreferencesAction,
  type NotificationPrefsState,
} from '@/app/gatilhos/actions'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/lib/button-styles'
import FaIcon from './fa-icon'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

type PushStatus =
  | 'checking'
  | 'unsupported'
  | 'ios-needs-install'
  | 'denied'
  | 'ready'
  | 'subscribed'
  | 'missing-vapid'

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i)

export default function NotificationSettingsCard({
  initialCheckinEnabled,
  initialStartHour,
  initialEndHour,
  initialTimezone,
}: {
  initialCheckinEnabled: boolean
  initialStartHour: number
  initialEndHour: number
  initialTimezone: string
}) {
  const [pushStatus, setPushStatus] = useState<PushStatus>('checking')
  const [pushBusy, setPushBusy] = useState(false)
  const [pushFeedback, setPushFeedback] = useState<string | null>(null)
  const [checkinEnabled, setCheckinEnabled] = useState(initialCheckinEnabled)
  const [startHour, setStartHour] = useState(initialStartHour)
  const [endHour, setEndHour] = useState(initialEndHour)
  const [browserTimezone, setBrowserTimezone] = useState(initialTimezone)

  const [prefsState, prefsAction, isSavingPrefs] = useActionState<
    NotificationPrefsState,
    FormData
  >(updateNotificationPreferencesAction, {})

  useEffect(() => {
    let cancelled = false

    async function inspectPushState() {
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (!cancelled && detectedTz) {
        setBrowserTimezone(detectedTz)
      }

      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        Boolean((navigator as { standalone?: boolean }).standalone)

      if (isIos && !isStandalone) {
        if (!cancelled) setPushStatus('ios-needs-install')
        return
      }

      if (
        !('Notification' in window) ||
        !('serviceWorker' in navigator) ||
        !('PushManager' in window)
      ) {
        if (!cancelled) setPushStatus('unsupported')
        return
      }

      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        if (!cancelled) setPushStatus('missing-vapid')
        return
      }

      if (Notification.permission === 'denied') {
        if (!cancelled) setPushStatus('denied')
        return
      }

      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        const existingSub = await reg.pushManager.getSubscription()
        if (!cancelled) {
          setPushStatus(existingSub ? 'subscribed' : 'ready')
        }
      } catch {
        if (!cancelled) setPushStatus('ready')
      }
    }

    inspectPushState()
    return () => {
      cancelled = true
    }
  }, [])

  const handleEnablePush = async () => {
    setPushBusy(true)
    setPushFeedback(null)

    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        setPushStatus('missing-vapid')
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushStatus(permission === 'denied' ? 'denied' : 'ready')
        setPushFeedback('Permissão de notificação não concedida.')
        return
      }

      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready

      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        })
      }

      const json = subscription.toJSON()
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || browserTimezone

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          timezone: tz,
        }),
      })

      if (!response.ok) {
        const errBody = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(errBody.error || 'Falha ao registrar aparelho.')
      }

      setPushStatus('subscribed')
      setPushFeedback('Notificações ativadas neste aparelho.')
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Não foi possível ativar as notificações.'
      setPushFeedback(msg)
    } finally {
      setPushBusy(false)
    }
  }

  const handleDisablePush = async () => {
    setPushBusy(true)
    setPushFeedback(null)

    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      const endpoint = sub?.endpoint

      if (sub) {
        await sub.unsubscribe()
      }

      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })

      setPushStatus('ready')
      setPushFeedback('Notificações desativadas neste aparelho.')
    } catch {
      setPushFeedback('Não foi possível desativar as notificações agora.')
    } finally {
      setPushBusy(false)
    }
  }

  return (
    <section className="rounded-2xl bg-[#EAE5DC]/65 border border-[#DDD6CA] p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h2 className="text-xs font-medium text-[#2F3530] flex items-center gap-2">
            <FaIcon icon={faBell} className="w-3.5 h-3.5 text-[#7B907E]" />
            Lembretes do PWA
          </h2>
          <p className="text-xs text-[#2F3530]/65 leading-relaxed">
            Receba um lembrete gerado por IA 2–3h após seus eventos e check-ins a cada 3h.
          </p>
        </div>

        <div className="shrink-0">
          {pushStatus === 'checking' && (
            <span className="text-xs text-[#2F3530]/50">Verificando aparelho...</span>
          )}

          {pushStatus === 'ready' && (
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={pushBusy}
              className={`${BUTTON_PRIMARY} w-full sm:w-auto`}
            >
              {pushBusy ? (
                <>
                  <FaIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />
                  <span>Ativando...</span>
                </>
              ) : (
                <>
                  <FaIcon icon={faBell} className="w-3.5 h-3.5" />
                  <span>Ativar neste aparelho</span>
                </>
              )}
            </button>
          )}

          {pushStatus === 'subscribed' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#445646] bg-[#7B907E]/15 px-3 py-1.5 rounded-full">
                <FaIcon icon={faCheck} className="w-3 h-3 text-[#7B907E]" />
                Ativo aqui
              </span>
              <button
                type="button"
                onClick={handleDisablePush}
                disabled={pushBusy}
                className={`${BUTTON_SECONDARY} px-3 py-1.5`}
              >
                <FaIcon icon={faBellSlash} className="w-3 h-3" />
                <span>Desativar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {pushStatus === 'ios-needs-install' && (
        <div className="border-l-2 border-[#C98A74] pl-3.5 py-1 text-xs text-[#2F3530]/80 flex items-start gap-2 leading-relaxed">
          <FaIcon icon={faMobileScreen} className="w-3.5 h-3.5 text-[#C98A74] shrink-0 mt-0.5" />
          <span>
            No iPhone/iPad, adicione o BetterThoughts à <strong>Tela de Início</strong>{' '}
            (Compartilhar → Adicionar à Tela de Início) e abra por lá para ativar as notificações.
          </span>
        </div>
      )}

      {pushStatus === 'denied' && (
        <p className="border-l-2 border-[#C98A74] pl-3.5 py-0.5 text-xs text-[#7A4432]">
          As notificações estão bloqueadas nas configurações deste navegador/aparelho.
        </p>
      )}

      {pushStatus === 'unsupported' && (
        <p className="text-xs text-[#2F3530]/55">
          Este navegador não oferece suporte a notificações Web Push.
        </p>
      )}

      {pushStatus === 'missing-vapid' && (
        <p className="border-l-2 border-[#C98A74] pl-3.5 py-0.5 text-xs text-[#7A4432]">
          Falta configurar a chave pública VAPID (<code className="font-mono">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code>) no ambiente.
        </p>
      )}

      {pushFeedback && (
        <p className="text-xs text-[#445646]">{pushFeedback}</p>
      )}

      {/* Preferências do check-in recorrente a cada 3h */}
      <form
        action={prefsAction}
        className="border-t border-[#DCD5C8] pt-3.5 space-y-3"
      >
        <input type="hidden" name="timezone" value={browserTimezone} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2.5 text-xs font-medium text-[#2F3530] cursor-pointer">
            <input
              type="checkbox"
              name="checkin_enabled"
              checked={checkinEnabled}
              onChange={(e) => setCheckinEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#7B907E] rounded cursor-pointer"
            />
            <span>Check-in padrão a cada 3 horas</span>
          </label>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[#2F3530]/70">
            <span>Das</span>
            <select
              name="active_start_hour"
              aria-label="Horário de início dos lembretes"
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              disabled={!checkinEnabled}
              className="bg-transparent border-b border-[#D7CFC2] focus:border-[#2F3530] text-base sm:text-xs font-medium text-[#2F3530] py-0.5 px-1 focus:outline-none disabled:opacity-45 cursor-pointer"
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h} className="bg-[#F7F5F0]">
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
            <span>às</span>
            <select
              name="active_end_hour"
              aria-label="Horário final dos lembretes"
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              disabled={!checkinEnabled}
              className="bg-transparent border-b border-[#D7CFC2] focus:border-[#2F3530] text-base sm:text-xs font-medium text-[#2F3530] py-0.5 px-1 focus:outline-none disabled:opacity-45 cursor-pointer"
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h} className="bg-[#F7F5F0]">
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-[#2F3530]/50">
            {prefsState?.error ? (
              <span className="text-[#7A4432]">{prefsState.error}</span>
            ) : prefsState?.success ? (
              <span className="text-[#445646]">{prefsState.message}</span>
            ) : (
              <span>Respeita a janela de descanso e pula se você acabou de relatar.</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSavingPrefs}
            className={`${BUTTON_SECONDARY} px-3.5 py-1.5 text-xs`}
          >
            {isSavingPrefs ? 'Salvando...' : 'Salvar janela'}
          </button>
        </div>
      </form>
    </section>
  )
}

