import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Atualiza a sessão e obtém o usuário autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname.startsWith('/login')
  const isSignupPage = request.nextUrl.pathname.startsWith('/cadastro')
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isResetPage = request.nextUrl.pathname.startsWith('/redefinir-senha')

  // Redireciona usuários não autenticados para /login
  if (!user && !isLoginPage && !isSignupPage && !isAuthPage && !isResetPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redireciona usuários já autenticados para a home se acessarem /login ou /cadastro
  if (user && (isLoginPage || isSignupPage)) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Executa o middleware em todas as rotas, exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico (ícone do navegador)
     * - sw.js e manifest.webmanifest (PWA)
     * - api/cron/* (autenticada via CRON_SECRET)
     * - imagens comuns (.svg, .png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|api/cron/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
