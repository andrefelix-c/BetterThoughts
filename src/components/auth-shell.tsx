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
  mobileTagline,
  searchParams,
  children,
  footer,
}: {
  title: React.ReactNode
  subtitle: string
  mobileTagline: [string, string]
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
      <div className="min-h-dvh flex flex-col items-center justify-between lg:justify-center bg-[#F7F5F0] px-4 sm:px-8 lg:px-12 xl:px-16 py-8 sm:py-10 lg:py-12 relative overflow-hidden">
        {/* Motivo sutil de fundo no mobile */}
        <svg
          aria-hidden="true"
          viewBox="0 0 400 320"
          className="lg:hidden pointer-events-none select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[400px] text-[#C98A74]/[0.16]"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="52" cy="185" r="32" />
          <path d="M98 85 l26 22 M122 80 l-22 26" />
          <ellipse cx="165" cy="95" rx="18" ry="12" transform="rotate(-15 165 95)" />
          <path d="M180 145 q14 -30 22 -2 t22 -28 t16 14" />
          <path d="M275 110 v50 M250 135 h50 M257 117 l36 36 M293 117 l-36 36" />
          <circle cx="335" cy="88" r="18" />
          <path d="M352 152 h-18 v22" />
          <path d="M128 165 l16 10 l-14 14 z" />
        </svg>

        {/* Topo: Logo + Título */}
        <header className="relative z-10 w-full max-w-sm pt-4 sm:pt-6 lg:pt-0 flex flex-col items-center text-center space-y-5 lg:space-y-4">
          <Image
            src="/logo-transparent.png"
            alt="BetterThoughts"
            width={536}
            height={163}
            className="h-10 sm:h-11 lg:h-9 w-auto object-contain"
            priority
          />

          <div className="space-y-2.5 lg:space-y-3">
            <h1 className="font-sans text-[28px] sm:text-3xl lg:text-[28px] xl:text-[30px] font-bold tracking-tight leading-[1.2] text-[#2F3530]">
              {title}
            </h1>
            <p className="hidden lg:block text-xs text-[#2F3530]/60">
              {subtitle}
            </p>
          </div>
        </header>

        {/* Centro: Subtítulo minimalista no mobile */}
        <div className="lg:hidden relative z-10 my-8 text-center space-y-1 text-sm text-[#2F3530]/65 font-normal">
          <p>{mobileTagline[0]}</p>
          <p>{mobileTagline[1]}</p>
        </div>

        {/* Formulário + Rodapé */}
        <div className="relative z-10 w-full max-w-[330px] pb-2 lg:pb-0 lg:mt-8 space-y-4">
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

