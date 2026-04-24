/**
 * Sistema de autenticación para control de acceso
 * Soporta dos modos:
 * 1. Código de acceso (usa API key del proyecto)
 * 2. BYOK - Bring Your Own Key (usuario provee su API key)
 */

const AUTH_STORAGE_KEY = 'zerowaste_auth'
const API_KEY_STORAGE_KEY = 'zerowaste_custom_api_key'
const API_PROVIDER_STORAGE_KEY = 'zerowaste_custom_api_provider'

export type AuthMode = 'code' | 'custom-key'
export type CustomAIProvider = 'openai' | 'gemini'

export interface AuthState {
  isAuthenticated: boolean
  mode: AuthMode | null
  code?: string
  hasCustomKey?: boolean
  provider?: CustomAIProvider
}

/**
 * Guarda el estado de autenticación en localStorage
 */
export function saveAuthState(mode: AuthMode, code?: string, provider?: CustomAIProvider): void {
  const authState: AuthState = {
    isAuthenticated: true,
    mode,
    code: mode === 'code' ? code : undefined,
    hasCustomKey: mode === 'custom-key',
    provider: mode === 'custom-key' ? provider : undefined,
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState))
  }
}

/**
 * Obtiene el estado de autenticación desde localStorage
 */
export function getAuthState(): AuthState {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, mode: null }
  }

  const stored = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!stored) {
    return { isAuthenticated: false, mode: null }
  }

  try {
    return JSON.parse(stored) as AuthState
  } catch {
    return { isAuthenticated: false, mode: null }
  }
}

/**
 * Guarda la API key custom del usuario (solo en cliente)
 */
export function saveCustomApiKey(apiKey: string, provider: CustomAIProvider = 'openai'): void {
  if (typeof window !== 'undefined') {
    // Encriptar básicamente (en producción usar crypto más robusto)
    const encoded = btoa(apiKey)
    localStorage.setItem(API_KEY_STORAGE_KEY, encoded)
    localStorage.setItem(API_PROVIDER_STORAGE_KEY, provider)
  }
}

/**
 * Obtiene la API key custom del usuario
 */
export function getCustomApiKey(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const encoded = localStorage.getItem(API_KEY_STORAGE_KEY)
  if (!encoded) {
    return null
  }

  try {
    return atob(encoded)
  } catch {
    return null
  }
}

/**
 * Obtiene el proveedor asociado a la API key custom del usuario
 */
export function getCustomApiProvider(): CustomAIProvider {
  if (typeof window === 'undefined') {
    return 'openai'
  }

  const provider = localStorage.getItem(API_PROVIDER_STORAGE_KEY)
  return provider === 'gemini' ? 'gemini' : 'openai'
}

/**
 * Elimina la API key custom
 */
export function removeCustomApiKey(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(API_KEY_STORAGE_KEY)
    localStorage.removeItem(API_PROVIDER_STORAGE_KEY)
  }
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
  const auth = getAuthState()
  return auth.isAuthenticated
}

/**
 * Cierra sesión
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(API_KEY_STORAGE_KEY)
    localStorage.removeItem(API_PROVIDER_STORAGE_KEY)
  }
}

/**
 * Obtiene la API key a usar (custom o del proyecto)
 */
export function getApiKeyToUse(): string | null {
  const auth = getAuthState()

  if (!auth.isAuthenticated) {
    return null
  }

  if (auth.mode === 'custom-key') {
    return getCustomApiKey()
  }

  // Modo 'code' usa la API key del proyecto según AI_PROVIDER
  return null
}

/**
 * Obtiene el proveedor de IA a usar para BYOK.
 */
export function getProviderToUse(): CustomAIProvider | null {
  const auth = getAuthState()

  if (!auth.isAuthenticated || auth.mode !== 'custom-key') {
    return null
  }

  return getCustomApiProvider()
}
