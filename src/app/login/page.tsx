import Link from 'next/link'
import { login, requestPasswordReset } from './actions'
import { BUTTON_PRIMARY } from '@/lib/button-styles'
import LoginPasswordInput from '@/components/login-password-input'
import AuthShell, { type AuthSearchParams } from '@/components/auth-shell'

export default function LoginPage(props: {
  searchParams: AuthSearchParams
}) {
  return (
    <AuthShell
      title={
        <>
          Bem-vindo ao seu
          <br className="lg:hidden" />{' '}
          diário terapêutico
        </>
      }
      subtitle="Entre com seus dados para continuar"
      searchParams={props.searchParams}
      footer={
        <p>
          Não possui conta?{' '}
          <Link
            href="/cadastro"
            className="font-semibold text-[#2F3530] hover:underline underline-offset-4"
          >
            Cadastre-se
          </Link>
        </p>
      }
    >
      <form className="space-y-4">
        <div className="relative">
          <label htmlFor="email" className="sr-only">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Seu e-mail"
            className="w-full rounded-none bg-transparent border-0 border-b border-[#D7CFC2] px-1 py-2.5 text-sm text-[#2F3530] placeholder-[#2F3530]/45 transition focus:outline-none focus:border-[#2F3530]"
          />
        </div>

        <LoginPasswordInput />

        <div className="flex justify-end pt-0.5">
          <button
            type="submit"
            formAction={requestPasswordReset}
            formNoValidate
            className="text-xs text-[#2F3530]/60 hover:text-[#2F3530] transition cursor-pointer"
          >
            Esqueceu a senha?
          </button>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            formAction={login}
            className={`${BUTTON_PRIMARY} w-full py-3`}
          >
            Entrar
          </button>
        </div>
      </form>
    </AuthShell>
  )
}
