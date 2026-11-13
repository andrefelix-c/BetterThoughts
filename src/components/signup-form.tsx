'use client'

import { useState } from 'react'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { signup } from '@/app/login/actions'
import { BUTTON_PRIMARY } from '@/lib/button-styles'
import { validatePassword } from '@/lib/password-validation'
import FaIcon from './fa-icon'
import LoginPasswordInput from './login-password-input'
import PasswordRequirements from './password-requirements'

export default function SignupForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)

  const validation = validatePassword(password, confirmPassword)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setClientError(null)
    if (!validation.valid) {
      e.preventDefault()
      setClientError(validation.error)
    }
  }

  return (
    <form action={signup} onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
      {clientError && (
        <div
          role="alert"
          className="p-3.5 rounded-2xl bg-[#C98A74]/18 border border-[#C98A74]/40 text-[#7A4432] text-xs flex items-start gap-2.5 text-left"
        >
          <FaIcon
            icon={faTriangleExclamation}
            className="w-4 h-4 shrink-0 mt-0.5 text-[#C98A74]"
          />
          <span className="leading-snug">{clientError}</span>
        </div>
      )}

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

      <LoginPasswordInput
        id="password"
        name="password"
        label="Senha"
        placeholder="Crie uma senha"
        autoComplete="new-password"
        minLength={9}
        required
        value={password}
        onChange={(e) => {
          setPassword(e.target.value)
          if (clientError) setClientError(null)
        }}
      />

      <LoginPasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirmar senha"
        placeholder="Confirme sua senha"
        autoComplete="new-password"
        minLength={9}
        required
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value)
          if (clientError) setClientError(null)
        }}
      />

      <PasswordRequirements
        password={password}
        confirmPassword={confirmPassword}
      />

      <div className="pt-2">
        <button
          type="submit"
          className={`${BUTTON_PRIMARY} w-full py-3`}
        >
          Cadastrar
        </button>
      </div>
    </form>
  )
}

