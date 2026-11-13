import { Suspense } from 'react'
import { connection } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { faCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { updateTherapeuticFocus } from './actions'
import { BUTTON_PRIMARY } from '@/lib/button-styles'
import FaIcon from '@/components/fa-icon'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

async function StatusMessage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const status = params.status

  if (status === 'saved') {
    return (
      <div
        role="status"
        className="border-l-2 border-[#7B907E] pl-3.5 py-0.5 text-[#3F5142] text-xs sm:text-sm flex items-center gap-2"
      >
        <FaIcon icon={faCheck} className="w-3.5 h-3.5 shrink-0 text-[#7B907E]" />
        <span>Foco terapêutico atualizado com sucesso.</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        role="alert"
        className="border-l-2 border-[#C98A74] pl-3.5 py-0.5 text-[#7A4432] text-xs sm:text-sm flex items-center gap-2"
      >
        <FaIcon
          icon={faTriangleExclamation}
          className="w-3.5 h-3.5 shrink-0 text-[#C98A74]"
        />
        <span>Não foi possível salvar o foco. Verifique a conexão com o banco.</span>
      </div>
    )
  }

  return null
}

async function FocoContent() {
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentFocus = ''

  if (user) {
    try {
      const profile = await prisma.profile.findUnique({
        where: { id: user.id },
      })
      currentFocus = profile?.therapeutic_focus || ''
    } catch (err) {
      console.error('Erro ao buscar perfil no Prisma:', err)
    }
  }

  return (
    <form action={updateTherapeuticFocus} className="space-y-6">
      <div className="border-t border-[#E2DDD3] pt-5 space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="therapeutic_focus"
            className="block text-xs font-medium text-[#2F3530]/60"
          >
            Diretrizes desta semana
          </label>
          <textarea
            id="therapeutic_focus"
            name="therapeutic_focus"
            rows={6}
            defaultValue={currentFocus}
            placeholder="Ex: Observar quando começo a me cobrar excessivamente no trabalho e praticar a pausa consciente..."
            className="w-full bg-transparent border-0 p-0 text-[#2F3530] text-base placeholder-[#2F3530]/35 focus:outline-none focus:ring-0 resize-none min-h-[160px] leading-[1.75]"
          />
        </div>

        <div className="border-t border-[#E2DDD3] pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="border-l-2 border-[#C98A74] pl-3.5 py-0.5 text-xs text-[#2F3530]/65 leading-relaxed max-w-md space-y-0.5">
            <span className="font-medium text-[#2F3530]/80 block">
              Como esse foco é utilizado
            </span>
            <p>
              Ao registrar no seu Diário Terapêutico, suas diretrizes orientam perguntas
              alinhadas ao que você está trabalhando em terapia.
            </p>
          </div>

          <button
            type="submit"
            className={`${BUTTON_PRIMARY} w-full sm:w-auto shrink-0`}
          >
            Salvar foco
          </button>
        </div>
      </div>
    </form>
  )
}

export default function FocoPage(props: {
  searchParams: SearchParams
}) {
  return (
    <div className="max-w-lg md:max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-9 space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-serif text-[26px] sm:text-3xl font-medium tracking-tight text-[#2F3530]">
          Foco Terapêutico
        </h1>
        <p className="text-xs sm:text-sm text-[#2F3530]/60 leading-relaxed">
          O que seu(sua) terapeuta convidou você a observar ou praticar nos próximos dias?
        </p>
      </header>

      <Suspense fallback={null}>
        <StatusMessage searchParams={props.searchParams} />
      </Suspense>

      <Suspense
        fallback={
          <div className="border-t border-[#E2DDD3] py-12 text-xs text-[#2F3530]/50 animate-pulse">
            Carregando foco terapêutico...
          </div>
        }
      >
        <FocoContent />
      </Suspense>
    </div>
  )
}
