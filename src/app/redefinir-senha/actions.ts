'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    redirect('/redefinir-senha?error=' + encodeURIComponent('Preencha todos os campos.'))
  }

  if (password !== confirmPassword) {
    redirect('/redefinir-senha?error=' + encodeURIComponent('As senhas não coincidem.'))
  }

  if (password.length < 6) {
    redirect(
      '/redefinir-senha?error=' +
        encodeURIComponent('A senha deve ter no mínimo 6 caracteres.')
    )
  }

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    redirect('/redefinir-senha?error=' + encodeURIComponent(error.message))
  }

  redirect(
    '/login?message=' +
      encodeURIComponent('Senha atualizada com sucesso! Entre com sua nova senha.')
  )
}

