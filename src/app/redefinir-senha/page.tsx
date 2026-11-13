'use client'

import { useState } from 'react'
import Image from 'next/image'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { createClient } from '@/utils/supabase/client'
import { BUTTON_PRIMARY } from '@/lib/button-styles'
import { validatePassword } from '@/lib/password-validation'
import FaIcon from '@/components/fa-icon'
import PasswordRequirements from '@/components/password-requirements'

export default function RedefinirSenhaPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const passwordValidation = validatePassword(password, confirmPassword)
    if (!passwordValidation.valid) {
      setError(passwordValidation.error)
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      window.location.href =
        '/login?message=' +
        encodeURIComponent('Senha atualizada com sucesso! Entre com sua nova senha.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao redefinir senha.'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh w-full -mb-24 md:-mb-12 flex items-center justify-center px-4 sm:px-6 py-8 bg-[#F7F5F0] text-[#2F3530]">
      <div className="w-full max-w-sm sm:max-w-md bg-[#EAE5DC] rounded-3xl border border-[#DDD6CA] p-6 sm:p-8 space-y-6">
        <header className="space-y-4 text-center sm:text-left">
          <div className="flex justify-center sm:justify-start">
            <Image
              src="/logo-transparent.png"
              alt="BetterThoughts"
              width={536}
              height={163}
              className="h-11 sm:h-12 w-auto object-contain"
              priority
            />
          </div>
          <div className="space-y-1">
            <h1 className="font-serif text-2xl font-medium tracking-tight text-[#2F3530]">
              Criar nova senha
            </h1>
            <p className="text-xs sm:text-sm text-[#2F3530]/65">
              Digite sua nova senha abaixo para restabelecer o acesso.
            </p>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-[#C98A74]/18 border border-[#C98A74]/40 text-[#7A4432] text-xs sm:text-sm flex items-start gap-2.5"
          >
            <FaIcon
              icon={faTriangleExclamation}
              className="w-4 h-4 shrink-0 mt-0.5 text-[#C98A74]"
            />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-[#2F3530]/80"
            >
              Nova senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={9}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma senha forte"
              className="w-full px-4 py-3 rounded-2xl border border-[#D7CFC2] bg-[#F7F5F0] text-[#2F3530] placeholder-[#2F3530]/40 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#7B907E]/45 focus:border-[#7B907E]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-medium text-[#2F3530]/80"
            >
              Confirmar nova senha
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={9}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite novamente"
              className="w-full px-4 py-3 rounded-2xl border border-[#D7CFC2] bg-[#F7F5F0] text-[#2F3530] placeholder-[#2F3530]/40 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#7B907E]/45 focus:border-[#7B907E]"
            />
          </div>

          <PasswordRequirements
            password={password}
            confirmPassword={confirmPassword}
          />

          <button
            type="submit"
            disabled={loading}
            className={`${BUTTON_PRIMARY} w-full mt-2 py-3`}
          >
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
