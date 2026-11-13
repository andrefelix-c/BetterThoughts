'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/nav'
import FaIcon from './fa-icon'

export default function NavigationBar() {
  const pathname = usePathname()

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/cadastro') ||
    pathname.startsWith('/redefinir-senha')
  ) {
    return null
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F7F5F0]/92 backdrop-blur-lg border-t border-[#E5DFD5] px-2 sm:px-3 pt-2 pb-safe"
      aria-label="Navegação móvel"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={`flex flex-col items-center justify-center gap-1.5 py-1.5 px-3 sm:px-5 transition-colors duration-150 ${
                isActive
                  ? 'text-[#5F7362]'
                  : 'text-[#2F3530]/45 hover:text-[#2F3530]/80'
              }`}
            >
              <FaIcon icon={item.icon} className="w-5 h-5" />
              <span
                className={`w-1 h-1 rounded-full transition-opacity ${
                  isActive ? 'bg-[#7B907E] opacity-100' : 'opacity-0'
                }`}
              />
              <span className="sr-only">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
