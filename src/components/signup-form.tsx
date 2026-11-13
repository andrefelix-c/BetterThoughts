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
    <form action={signup} onSubmit={handleSubmit} className="space-y-4">
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
          className="w-full rounded-none bg-transparent border-0 border-b border-[#D7CFC2] px-1 py-2.5 text-sm text-[#2F3530] placeholder-[#2F3530]/45 transition focus:outline-none focus:border-[#2F3530]"
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

