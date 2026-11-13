'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'

export async function updateTherapeuticFocus(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const focus = (formData.get('therapeutic_focus') as string)?.trim() ?? ''

  try {
    await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        therapeutic_focus: focus,
        updated_at: new Date(),
      },
      create: {
        id: user.id,
        therapeutic_focus: focus,
        updated_at: new Date(),
      },
    })
  } catch (err) {
    console.error('Erro ao atualizar foco terapêutico:', err)
    redirect('/foco?status=error')
  }

  revalidatePath('/foco')
  revalidatePath('/')
  redirect('/foco?status=saved')
}

