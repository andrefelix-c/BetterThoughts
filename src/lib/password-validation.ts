export interface PasswordCheckResult {
  moreThan8: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasSymbol: boolean
  passwordsMatch: boolean
}

export function checkPasswordRules(
  password: string,
  confirmPassword: string
): PasswordCheckResult {
  return {
    moreThan8: password.length > 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasSymbol: /[^A-Za-z0-9\s]/.test(password),
    passwordsMatch: password.length > 0 && password === confirmPassword,
  }
}

export function validatePassword(
  password: string,
  confirmPassword: string
): { valid: boolean; error: string | null; checks: PasswordCheckResult } {
  const checks = checkPasswordRules(password, confirmPassword)

  if (!password || !confirmPassword) {
    return { valid: false, error: 'Preencha todos os campos.', checks }
  }

  if (!checks.moreThan8) {
    return {
      valid: false,
      error: 'A senha deve ter mais de 8 caracteres.',
      checks,
    }
  }

  if (!checks.hasUppercase) {
    return {
      valid: false,
      error: 'A senha deve conter pelo menos uma letra maiúscula.',
      checks,
    }
  }

  if (!checks.hasLowercase) {
    return {
      valid: false,
      error: 'A senha deve conter pelo menos uma letra minúscula.',
      checks,
    }
  }

  if (!checks.hasSymbol) {
    return {
      valid: false,
      error: 'A senha deve conter pelo menos um símbolo (ex: !@#$%).',
      checks,
    }
  }

  if (!checks.passwordsMatch) {
    return {
      valid: false,
      error: 'As senhas não coincidem.',
      checks,
    }
  }

  return { valid: true, error: null, checks }
}

