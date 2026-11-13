import { Suspense } from 'react'
import Image from 'next/image'
import {
  faCheck,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import FaIcon from './fa-icon'

export type AuthSearchParams = Promise<{
  [key: string]: string | string[] | undefined
}>

async function AlertMessages({
  searchParams,
}: {
  searchParams: AuthSearchParams
}) {
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : undefined
  const message = typeof params.message === 'string' ? params.message : undefined

  if (error) {
    return (
      <div
        role="alert"
        className="p-3.5 rounded-2xl bg-[#C98A74]/18 border border-[#C98A74]/40 text-[#7A4432] text-xs flex items-start gap-2.5 text-left"
      >
        <FaIcon
          icon={faTriangleExclamation}
          className="w-4 h-4 shrink-0 mt-0.5 text-[#C98A74]"
        />
        <span className="leading-snug">{error}</span>
      </div>
    )
  }

  if (message) {
    return (
      <div
        role="status"
        className="p-3.5 rounded-2xl bg-[#7B907E]/15 border border-[#7B907E]/35 text-[#3F5142] text-xs flex items-start gap-2.5 text-left"
      >
        <FaIcon
          icon={faCheck}
          className="w-4 h-4 shrink-0 mt-0.5 text-[#7B907E]"
        />
        <span className="leading-snug">{message}</span>
      </div>
    )
  }

  return null
}

export default function AuthShell({
  title,
  subtitle,
  searchParams,
  children,
  footer,
}: {
  title: React.ReactNode
  subtitle: string
  searchParams: AuthSearchParams
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="min-h-dvh w-full -mb-24 md:-mb-12 bg-[#F7F5F0] lg:bg-[#EAE5DC] text-[#2F3530] grid grid-cols-1 lg:grid-cols-2 overflow-x-hidden overflow-y-auto">
      {/* Lado esquerdo em telas maiores */}
      <div className="hidden lg:flex items-center justify-center p-12 xl:p-16 relative overflow-hidden">
        <div className="w-full max-w-lg flex items-center justify-center">
          <Image
            src="/auth-illustration.png"
            alt="Ilustração representando mente emaranhada e mente serena de mãos dadas"
            width={587}
            height={326}
            className="w-full max-w-[440px] xl:max-w-[500px] h-auto object-contain"
            priority
          />
        </div>
      </div>

      {/* Lado direito (desktop) / Tela única (mobile) */}
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#F7F5F0] px-6 sm:px-8 lg:px-12 xl:px-16 py-8 sm:py-10 lg:py-12 relative overflow-hidden">
        {/* Topo: Logo + Título */}
        <header className="w-full max-w-sm flex flex-col items-center text-center space-y-4">
          <Image
            src="/logo-transparent.png"
            alt="BetterThoughts"
            width={536}
            height={163}
            className="h-9 w-auto object-contain"
            priority
          />

          <div className="space-y-2.5 lg:space-y-3">
            <h1 className="font-sans text-[28px] sm:text-[30px] font-bold tracking-tight leading-[1.2] text-[#2F3530]">
              {title}
            </h1>
            <p className="text-xs text-[#2F3530]/60">
              {subtitle}
            </p>
          </div>
        </header>

        {/* Formulário + Rodapé */}
        <div className="w-full max-w-[330px] mt-8 space-y-4">
          <Suspense fallback={null}>
            <AlertMessages searchParams={searchParams} />
          </Suspense>

          {children}

          <div className="pt-2 text-center text-xs text-[#2F3530]/60">
            {footer}
          </div>
        </div>
      </div>
    </div>
  )
}

