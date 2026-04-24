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

export function AuthGate() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'code' | 'api-key'>('code')
  const [code, setCode] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiProvider, setApiProvider] = useState<CustomAIProvider>('gemini')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Verificar si ya está autenticado
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

        // Redirigir después de un momento
        setTimeout(() => {
          router.push('/')
          router.refresh()
        }, 1500)
      } else {
        setError(result.message || 'Código inválido')
      }
    } catch (err) {
      setError('Error al validar el código. Intenta de nuevo.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (apiProvider === 'openai' && !apiKey.trim().startsWith('sk-')) {
      setError('La API key debe comenzar con "sk-"')
      return
    }

    if (apiProvider === 'gemini' && apiKey.trim().length < 20) {
      setError('La API key de Gemini parece inválida (muy corta)')
      return
    }

    if (apiProvider === 'openai' && apiKey.trim().length < 40) {
      setError('La API key parece inválida (muy corta)')
      return
    }

    setSuccess(true)
    saveCustomApiKey(apiKey.trim(), apiProvider)
    saveAuthState('custom-key', undefined, apiProvider)

    // Redirigir después de un momento
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {/* Header */}
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

        {/* Body */}
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
                  Usa tu propia API key de Gemini u OpenAI. Tus datos se guardan solo en tu navegador.
                </p>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 text-info text-xs">
                  <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">¿Cómo obtener una API key?</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Gemini: ve a aistudio.google.com y crea una API key</li>
                      <li>OpenAI: ve a platform.openai.com/api-keys</li>
                      <li>Selecciona el proveedor correcto antes de guardar</li>
                    </ol>
                  </div>
                </div>
              </div>

              <form onSubmit={handleApiKeySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiProvider">Proveedor</Label>
                  <Select value={apiProvider} onValueChange={(value) => setApiProvider(value as CustomAIProvider)}>
                    <SelectTrigger id="apiProvider">
                      <SelectValue placeholder="Selecciona proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini">Gemini</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">{apiProvider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder={apiProvider === 'gemini' ? 'AIza...' : 'sk-...'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tu API key se guarda localmente y nunca se envía a nuestros servidores
                  </p>
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
                  disabled={!apiKey.trim()}
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
