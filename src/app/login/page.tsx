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
      mobileTagline={['Feito para acolher.', 'Pensado para você.']}
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
      <form className="space-y-3 lg:space-y-4">
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
            className="auth-input w-full rounded-full px-5 py-3.5 text-sm bg-[#EAE5DC] border border-[#D7CFC2] text-[#2F3530] placeholder-[#2F3530]/45 transition focus:outline-none focus:ring-2 focus:ring-[#7B907E]/45 focus:border-[#7B907E] lg:rounded-none lg:bg-transparent lg:border-0 lg:border-b lg:border-[#D7CFC2] lg:px-1 lg:py-2.5 lg:focus:ring-0 lg:focus:border-[#2F3530]"
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
