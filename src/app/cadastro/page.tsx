import Link from 'next/link'
import AuthShell, { type AuthSearchParams } from '@/components/auth-shell'
import SignupForm from '@/components/signup-form'

export default function CadastroPage(props: {
  searchParams: AuthSearchParams
}) {
  return (
    <AuthShell
      title="Criar conta"
      subtitle="Preencha seus dados para começar seu diário terapêutico"
      searchParams={props.searchParams}
      footer={
        <p>
          Já possui conta?{' '}
          <Link
            href="/login"
            className="font-semibold text-[#2F3530] hover:underline underline-offset-4"
          >
            Entrar
          </Link>
        </p>
      }
    >
      <SignupForm />
    </AuthShell>
  )
}
