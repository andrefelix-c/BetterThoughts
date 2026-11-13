'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { signOut } from '@/app/auth/actions'
import { NAV_ITEMS } from '@/lib/nav'
import FaIcon from './fa-icon'

export default function Header() {
  const pathname = usePathname()

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/cadastro') ||
    pathname.startsWith('/redefinir-senha')
  ) {
    return null
  }

  return (
    <header className="sticky top-0 z-30 bg-[#F7F5F0]/90 backdrop-blur-lg border-b border-[#E5DFD5] px-4 sm:px-6 pb-2.5 pt-safe">
      <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto flex items-center justify-between gap-4 min-h-10">
        <Link href="/" className="flex items-center shrink-0 focus:outline-none">
          <Image
            src="/logo-transparent.png"
            alt="BetterThoughts"
            width={536}
            height={163}
            className="h-7 sm:h-8 w-auto object-contain"
            priority
          />
        </Link>

        {/* Navegação para tablet e desktop */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`py-1.5 border-b-[1.5px] text-xs whitespace-nowrap transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'border-[#7B907E] text-[#2F3530] font-medium'
                    : 'border-transparent text-[#2F3530]/50 hover:text-[#2F3530]'
                }`}
              >
                <FaIcon
                  icon={item.icon}
                  className={`w-3.5 h-3.5 ${isActive ? 'text-[#7B907E]' : ''}`}
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <form action={signOut} className="shrink-0">
          <button
            type="submit"
            title="Sair da conta"
            className="px-2 py-1.5 text-[#2F3530]/55 hover:text-[#2F3530] transition-colors text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <FaIcon icon={faRightFromBracket} className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </form>
      </div>
    </header>
  )
}
