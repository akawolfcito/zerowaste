"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Key, Lock, Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { validateAccessCode } from "@/app/actions"
import { saveAuthState, saveCustomApiKey, getAuthState, type CustomAIProvider } from "@/lib/auth"

interface ProviderUiConfig {
  label: string
  placeholder: string
  keyHint: string
  modelHint?: string
  modelPlaceholder?: string
  requiresModel: boolean
  validateKey: (key: string) => string | null
}

const PROVIDER_UI: Record<CustomAIProvider, ProviderUiConfig> = {
  openai: {
    label: 'OpenAI',
    placeholder: 'sk-...',
    keyHint: 'Obtén tu API key en platform.openai.com/api-keys',
    modelPlaceholder: 'gpt-4o (opcional)',
    requiresModel: false,
    validateKey: (k) => (!k.startsWith('sk-') ? 'La API key debe comenzar con "sk-"' : k.length < 40 ? 'La API key parece inválida (muy corta)' : null),
  },
  gemini: {
    label: 'Gemini',
    placeholder: 'AIza...',
    keyHint: 'Obtén tu API key en aistudio.google.com',
    modelPlaceholder: 'gemini-2.5-flash (opcional)',
    requiresModel: false,
    validateKey: (k) => (k.length < 20 ? 'La API key de Gemini parece inválida (muy corta)' : null),
  },
  openrouter: {
    label: 'OpenRouter',
    placeholder: 'sk-or-...',
    keyHint: 'Obtén tu API key en openrouter.ai/keys — acceso a Claude, Llama, GPT, Gemini',
    modelHint: 'Requerido. Ej: anthropic/claude-sonnet-4.5, openai/gpt-4o-mini, meta-llama/llama-3.3-70b-instruct',
    modelPlaceholder: 'anthropic/claude-sonnet-4.5',
    requiresModel: true,
    validateKey: (k) => (!k.startsWith('sk-or-') ? 'La API key de OpenRouter debe comenzar con "sk-or-"' : null),
  },
  deepseek: {
    label: 'DeepSeek',
    placeholder: 'sk-...',
    keyHint: 'Obtén tu API key en platform.deepseek.com/api_keys. Nota: no soporta análisis de facturas (vision).',
    modelPlaceholder: 'deepseek-chat (opcional)',
    requiresModel: false,
    validateKey: (k) => (!k.startsWith('sk-') ? 'La API key debe comenzar con "sk-"' : k.length < 20 ? 'La API key parece inválida' : null),
  },
}

export function AuthGate() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'code' | 'api-key'>('code')
  const [code, setCode] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiProvider, setApiProvider] = useState<CustomAIProvider>('gemini')
  const [model, setModel] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const auth = getAuthState()
    if (auth.isAuthenticated) {
      router.push('/')
    }
  }, [router])

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsValidating(true)

    try {
      const result = await validateAccessCode(code.trim().toUpperCase())

      if (result.success) {
        setSuccess(true)
        saveAuthState('code', code.trim().toUpperCase())

        setTimeout(() => {
          router.push('/')
          router.refresh()
        }, 1500)
      } else {
        setError(result.message || 'Código inválido')
      }
    } catch {
      setError('Error al validar el código. Intenta de nuevo.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cfg = PROVIDER_UI[apiProvider]
    const trimmedKey = apiKey.trim()
    const trimmedModel = model.trim()

    const keyError = cfg.validateKey(trimmedKey)
    if (keyError) {
      setError(keyError)
      return
    }

    if (cfg.requiresModel && !trimmedModel) {
      setError(`${cfg.label} requiere especificar un modelo`)
      return
    }

    setSuccess(true)
    saveCustomApiKey(trimmedKey, apiProvider, trimmedModel || undefined)
    saveAuthState('custom-key', undefined, apiProvider)

    setTimeout(() => {
      router.push('/')
      router.refresh()
    }, 1500)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-20 w-20 rounded-full bg-secondary/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-secondary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">¡Acceso concedido!</h2>
          <p className="text-muted-foreground mb-4">
            Redirigiendo a la aplicación...
          </p>
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </Card>
      </div>
    )
  }

  const currentCfg = PROVIDER_UI[apiProvider]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="bg-gradient-to-r from-primary to-primary/80 p-8 rounded-t-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Zerowaste</h1>
          </div>
          <p className="text-white/90 text-sm">
            Tu asistente inteligente para planificar comidas y reducir desperdicio
          </p>
        </div>

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'code' | 'api-key')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="code" className="gap-2">
                <Lock className="h-4 w-4" />
                Código de Acceso
              </TabsTrigger>
              <TabsTrigger value="api-key" className="gap-2">
                <Key className="h-4 w-4" />
                Mi API Key
              </TabsTrigger>
            </TabsList>

            <TabsContent value="code" className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Ingresa tu código de acceso para usar la app con nuestra API configurada
                </p>
              </div>

              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código de Acceso</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="DEMO"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="text-center text-lg font-mono tracking-wider"
                    disabled={isValidating}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <XCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isValidating || !code.trim()}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Acceder
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  ¿No tienes código? Contacta al equipo de Zerowaste
                </p>
              </div>
            </TabsContent>

            <TabsContent value="api-key" className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Usa tu propia API key. Tus datos se guardan solo en tu navegador.
                </p>
              </div>

              <form onSubmit={handleApiKeySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiProvider">Proveedor</Label>
                  <Select value={apiProvider} onValueChange={(value) => {
                    setApiProvider(value as CustomAIProvider)
                    setModel('')
                    setError('')
                  }}>
                    <SelectTrigger id="apiProvider">
                      <SelectValue placeholder="Selecciona proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="gemini">Gemini</SelectItem>
                      <SelectItem value="openrouter">OpenRouter (multi-modelo)</SelectItem>
                      <SelectItem value="deepseek">DeepSeek</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{currentCfg.keyHint}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">{currentCfg.label} API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder={currentCfg.placeholder}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tu API key se guarda localmente y nunca se envía a nuestros servidores
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">
                    Modelo {currentCfg.requiresModel ? '(requerido)' : '(opcional)'}
                  </Label>
                  <Input
                    id="model"
                    type="text"
                    placeholder={currentCfg.modelPlaceholder}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="font-mono text-sm"
                  />
                  {currentCfg.modelHint && (
                    <p className="text-xs text-muted-foreground">{currentCfg.modelHint}</p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <XCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!apiKey.trim() || (currentCfg.requiresModel && !model.trim())}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Guardar y Continuar
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  )
}
