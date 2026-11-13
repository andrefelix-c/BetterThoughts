'use client'

import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { checkPasswordRules } from '@/lib/password-validation'
import FaIcon from './fa-icon'

export default function PasswordRequirements({
  password,
  confirmPassword,
}: {
  password: string
  confirmPassword: string
}) {
  const checks = checkPasswordRules(password, confirmPassword)

  const rules = [
    { label: 'Mais de 8 caracteres', met: checks.moreThan8 },
    { label: 'Letra maiúscula', met: checks.hasUppercase },
    { label: 'Letra minúscula', met: checks.hasLowercase },
    { label: 'Símbolo (ex: !@#$%)', met: checks.hasSymbol },
    { label: 'As senhas são iguais', met: checks.passwordsMatch },
  ]

  return (
    <ul
      aria-label="Requisitos da senha"
      className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 px-1 pt-1 text-[11px]"
    >
      {rules.map((rule) => (
        <li
          key={rule.label}
          className={`flex items-center gap-1.5 transition-colors ${
            rule.met ? 'text-[#445646] font-medium' : 'text-[#2F3530]/50'
          }`}
        >
          <span
            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              rule.met
                ? 'bg-[#7B907E] text-[#F7F5F0]'
                : 'border border-[#D7CFC2] bg-transparent'
            }`}
          >
            {rule.met && <FaIcon icon={faCheck} className="w-2 h-2" />}
          </span>
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  )
}

