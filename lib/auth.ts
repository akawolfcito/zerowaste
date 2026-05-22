/**
 * Sistema de autenticación para control de acceso.
 * Soporta dos modos:
 * 1. Código de acceso (usa API key del proyecto)
 * 2. BYOK - Bring Your Own Key (OpenAI, Gemini, OpenRouter, DeepSeek)
 */

const AUTH_STORAGE_KEY = 'zerowaste_auth'
const API_KEY_STORAGE_KEY = 'zerowaste_custom_api_key'
const API_PROVIDER_STORAGE_KEY = 'zerowaste_custom_api_provider'
const API_MODEL_STORAGE_KEY = 'zerowaste_custom_api_model'

export type AuthMode = 'code' | 'custom-key'
export type CustomAIProvider = 'openai' | 'gemini' | 'openrouter' | 'deepseek'

const VALID_PROVIDERS: CustomAIProvider[] = ['openai', 'gemini', 'openrouter', 'deepseek']

function coerceProvider(value: string | null): CustomAIProvider {
  return VALID_PROVIDERS.includes(value as CustomAIProvider)
    ? (value as CustomAIProvider)
    : 'openai'
}

export interface AuthState {
  isAuthenticated: boolean
  mode: AuthMode | null
  code?: string
  hasCustomKey?: boolean
  provider?: CustomAIProvider
}

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

export function saveCustomApiKey(
  apiKey: string,
  provider: CustomAIProvider = 'openai',
  model?: string,
): void {
  if (typeof window === 'undefined') return
  const encoded = btoa(apiKey)
  localStorage.setItem(API_KEY_STORAGE_KEY, encoded)
  localStorage.setItem(API_PROVIDER_STORAGE_KEY, provider)
  if (model && model.trim()) {
    localStorage.setItem(API_MODEL_STORAGE_KEY, model.trim())
  } else {
    localStorage.removeItem(API_MODEL_STORAGE_KEY)
  }
}

export function getCustomApiKey(): string | null {
  if (typeof window === 'undefined') return null

  const encoded = localStorage.getItem(API_KEY_STORAGE_KEY)
  if (!encoded) return null

  try {
    return atob(encoded)
  } catch {
    return null
  }
}

export function getCustomApiProvider(): CustomAIProvider {
  if (typeof window === 'undefined') return 'openai'
  return coerceProvider(localStorage.getItem(API_PROVIDER_STORAGE_KEY))
}

export function getCustomApiModel(): string | null {
  if (typeof window === 'undefined') return null
  const model = localStorage.getItem(API_MODEL_STORAGE_KEY)
  return model && model.trim() ? model : null
}

export function removeCustomApiKey(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(API_KEY_STORAGE_KEY)
  localStorage.removeItem(API_PROVIDER_STORAGE_KEY)
  localStorage.removeItem(API_MODEL_STORAGE_KEY)
}

export function isAuthenticated(): boolean {
  return getAuthState().isAuthenticated
}

export function logout(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_STORAGE_KEY)
  localStorage.removeItem(API_KEY_STORAGE_KEY)
  localStorage.removeItem(API_PROVIDER_STORAGE_KEY)
  localStorage.removeItem(API_MODEL_STORAGE_KEY)
}

export function getApiKeyToUse(): string | null {
  const auth = getAuthState()
  if (!auth.isAuthenticated) return null
  if (auth.mode === 'custom-key') return getCustomApiKey()
  return null
}

export function getProviderToUse(): CustomAIProvider | null {
  const auth = getAuthState()
  if (!auth.isAuthenticated || auth.mode !== 'custom-key') return null
  return getCustomApiProvider()
}

export function getModelToUse(): string | null {
  const auth = getAuthState()
  if (!auth.isAuthenticated || auth.mode !== 'custom-key') return null
  return getCustomApiModel()
}
