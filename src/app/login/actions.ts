'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { validatePassword } from '@/lib/password-validation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?error=' + encodeURIComponent('Preencha todos os campos.'))
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = (formData.get('password') as string) || ''
  const confirmPassword = (formData.get('confirmPassword') as string) || ''

  if (!email) {
    redirect('/cadastro?error=' + encodeURIComponent('Preencha todos os campos.'))
  }

  const passwordValidation = validatePassword(password, confirmPassword)
  if (!passwordValidation.valid) {
    redirect(
      '/cadastro?error=' +
        encodeURIComponent(passwordValidation.error || 'Senha inválida.')
    )
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    redirect('/cadastro?error=' + encodeURIComponent(error.message))
  }

  // Se o Supabase já autenticou imediatamente:
  if (data.session) {
    revalidatePath('/', 'layout')
    redirect('/')
  }

  // Se requer confirmação de email ou para fazer login:
  redirect(
    '/login?message=' +
      encodeURIComponent('Conta criada com sucesso! Você já pode entrar.')
  )
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string)?.trim()

  if (!email) {
    redirect(
      '/login?error=' +
        encodeURIComponent('Digite o seu e-mail no campo acima para recuperar a senha.')
    )
  }

  const headerList = await headers()
  const host = headerList.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const redirectTo = `${protocol}://${host}/auth/callback?next=/redefinir-senha`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  redirect(
    '/login?message=' +
      encodeURIComponent('Link enviado! Verifique seu e-mail para redefinir sua senha.')
  )
}
