'use client'

import { useState, type ChangeEvent } from 'react'
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons'
import FaIcon from './fa-icon'

interface LoginPasswordInputProps {
  id?: string
  name?: string
  label?: string
  placeholder?: string
  autoComplete?: string
  minLength?: number
  required?: boolean
  value?: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
}

export default function LoginPasswordInput({
  id = 'password',
  name = 'password',
  label = 'Senha',
  placeholder = 'Sua senha',
  autoComplete = 'current-password',
  minLength,
  required,
  value,
  onChange,
}: LoginPasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="auth-input w-full rounded-full pl-5 pr-11 py-3.5 text-sm bg-[#EAE5DC] border border-[#D7CFC2] text-[#2F3530] placeholder-[#2F3530]/45 transition focus:outline-none focus:ring-2 focus:ring-[#7B907E]/45 focus:border-[#7B907E] lg:rounded-none lg:bg-transparent lg:border-0 lg:border-b lg:border-[#D7CFC2] lg:pl-1 lg:pr-9 lg:py-2.5 lg:focus:ring-0 lg:focus:border-[#2F3530]"
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        className="absolute right-4 lg:right-1 top-1/2 -translate-y-1/2 text-[#2F3530]/45 hover:text-[#2F3530] transition cursor-pointer flex items-center p-1"
      >
        <FaIcon icon={visible ? faEyeSlash : faEye} className="w-4 h-4" />
      </button>
    </div>
  )
}
