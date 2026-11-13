'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AuthListener() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/redefinir-senha')
      }
    })

    // Caso a URL contenha o fragmento de recuperação diretamente no navegador
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      router.push('/redefinir-senha')
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return null
}

