/**
 * AI integration via Vercel AI SDK.
 * Supports OpenAI, Google Gemini, OpenRouter, and DeepSeek providers.
 * OpenRouter and DeepSeek use the OpenAI-compatible API surface.
 */

import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

// ============================================================================
// Configuration
// ============================================================================

const IS_DEV = process.env.NODE_ENV === 'development'
const LOG_REQUESTS = IS_DEV || process.env.LOG_AI_REQUESTS === 'true' || process.env.LOG_OPENAI_REQUESTS === 'true'
const DEFAULT_AI_PROVIDER: AIProviderName = 'openai'

export type AIProviderName = 'openai' | 'gemini' | 'openrouter' | 'deepseek'

interface ProviderConfig {
  envKeys: string[]
  envModel: string
  defaultModel: string
  defaultSmallModel: string
  baseURL?: string
  requiresExplicitModel?: boolean
  supportsVision: boolean
  label: string
}

const PROVIDERS: Record<AIProviderName, ProviderConfig> = {
  openai: {
    envKeys: ['OPENAI_API_KEY'],
    envModel: 'OPENAI_MODEL',
    defaultModel: 'gpt-4o',
    defaultSmallModel: 'gpt-4o-mini',
    supportsVision: true,
    label: 'OpenAI',
  },
  gemini: {
    envKeys: ['GEMINI_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY'],
    envModel: 'GEMINI_MODEL',
    defaultModel: 'gemini-2.5-flash',
    defaultSmallModel: 'gemini-2.5-flash',
    supportsVision: true,
    label: 'Gemini',
  },
  openrouter: {
    envKeys: ['OPENROUTER_API_KEY'],
    envModel: 'OPENROUTER_MODEL',
    defaultModel: 'openai/gpt-4o-mini',
    defaultSmallModel: 'openai/gpt-4o-mini',
    baseURL: 'https://openrouter.ai/api/v1',
    requiresExplicitModel: true,
    supportsVision: true,
    label: 'OpenRouter',
  },
  deepseek: {
    envKeys: ['DEEPSEEK_API_KEY'],
    envModel: 'DEEPSEEK_MODEL',
    defaultModel: 'deepseek-chat',
    defaultSmallModel: 'deepseek-chat',
    baseURL: 'https://api.deepseek.com/v1',
    supportsVision: false,
    label: 'DeepSeek',
  },
}

export function getProviderConfig(name: AIProviderName): ProviderConfig {
  return PROVIDERS[name]
}

export function providerSupportsVision(name: AIProviderName): boolean {
  return PROVIDERS[name].supportsVision
}

// ============================================================================
// Logging Middleware
// ============================================================================

function createLoggingFetch(providerName: AIProviderName): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const path = new URL(url).pathname

    const startTime = Date.now()
    const response = await fetch(input, init)
    const duration = Date.now() - startTime

    if (LOG_REQUESTS) {
      const requestId = response.headers.get('x-request-id') || 'N/A'
      console.log(`[AI:${providerName}] ${path} | ${response.status} | ${duration}ms | req_id: ${requestId}`)
    }

    return response
  }
}

// ============================================================================
// Client Factory
// ============================================================================

function normalizeProvider(provider?: string, apiKey?: string): AIProviderName {
  if (provider && provider in PROVIDERS) return provider as AIProviderName
  if (apiKey?.startsWith('sk-or-')) return 'openrouter'
  if (apiKey?.startsWith('AIza')) return 'gemini'
  // sk- is ambiguous (OpenAI and DeepSeek both use it). Default to openai
  // unless env override is set.
  const envOverride = process.env.AI_PROVIDER
  if (envOverride && envOverride in PROVIDERS) return envOverride as AIProviderName
  return DEFAULT_AI_PROVIDER
}

function getProviderApiKey(providerName: AIProviderName, customApiKey?: string) {
  if (customApiKey) return customApiKey
  const { envKeys } = PROVIDERS[providerName]
  for (const key of envKeys) {
    const value = process.env[key]
    if (value) return value
  }
  return ''
}

function resolveModelId(providerName: AIProviderName, customModel?: string, kind: 'default' | 'small' = 'default') {
  if (customModel) return customModel
  const cfg = PROVIDERS[providerName]
  const envValue = process.env[cfg.envModel]
  if (envValue) return envValue
  return kind === 'small' ? cfg.defaultSmallModel : cfg.defaultModel
}

export function getAIModel(
  customApiKey?: string,
  customProvider?: AIProviderName,
  modelKind: 'default' | 'small' = 'default',
  customModel?: string,
) {
  const providerName = normalizeProvider(customProvider, customApiKey)
  const apiKey = getProviderApiKey(providerName, customApiKey)
  const cfg = PROVIDERS[providerName]

  if (!apiKey) {
    throw new Error(`${cfg.label} API key not configured`)
  }

  const modelId = resolveModelId(providerName, customModel, modelKind)
  const loggingFetch = LOG_REQUESTS ? createLoggingFetch(providerName) : undefined

  if (providerName === 'gemini') {
    const provider = createGoogleGenerativeAI({
      apiKey,
      fetch: loggingFetch,
    })
    return {
      providerName,
      model: provider(modelId),
      providerOptions: undefined,
    }
  }

  // OpenAI, OpenRouter, DeepSeek all use OpenAI-compatible API
  const provider = createOpenAI({
    apiKey,
    baseURL: cfg.baseURL,
    fetch: loggingFetch,
  })

  return {
    providerName,
    model: provider(modelId),
    providerOptions: providerName === 'openai'
      ? { openai: { store: false } }
      : undefined,
  }
}

export function getAIProviderName(provider?: string, apiKey?: string) {
  return normalizeProvider(provider, apiKey)
}

// ============================================================================
// Types
// ============================================================================

export interface ReceiptLineItem {
  name: string
  qty: number | null
  unitPrice: number | null
  total: number | null
}

export interface ReceiptData {
  merchant: string | null
  date: string | null
  currency: string | null
  lineItems: ReceiptLineItem[]
  subtotal: number | null
  tax: number | null
  total: number | null
  confidence: number
}

export interface FamilyRecommendations {
  recommendations: string[]
}

export interface MetricsData {
  metrics: {
    wastePercentage: number
    estimatedSavings: number
    weeklyWaste: number[]
    wasteKg?: number
    wasteChange?: number
    savingsChange?: number
  }
  recommendations: string[]
}

// ============================================================================
// Helper Functions
// ============================================================================

function base64ToBuffer(base64String: string): Buffer {
  const base64Data = base64String.includes(',')
    ? base64String.split(',')[1]
    : base64String
  return Buffer.from(base64Data, 'base64')
}

function parseJsonResponse<T>(text: string, fallback: T): T {
  try {
    const cleanText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const startIdx = cleanText.indexOf('{')
    const endIdx = cleanText.lastIndexOf('}')

    if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
      console.error('[AI] Invalid JSON response: no object found')
      return fallback
    }

    const jsonStr = cleanText.slice(startIdx, endIdx + 1)
    return JSON.parse(jsonStr) as T
  } catch (error) {
    console.error('[AI] JSON parse error:', error)
    return fallback
  }
}

// ============================================================================
// API Functions
// ============================================================================

export async function processReceiptImage(
  imageBase64: string,
  customApiKey?: string,
  customProvider?: AIProviderName,
  customModel?: string,
): Promise<ReceiptData> {
  const ai = getAIModel(customApiKey, customProvider, 'default', customModel)

  if (!providerSupportsVision(ai.providerName)) {
    throw new Error(`El proveedor ${PROVIDERS[ai.providerName].label} no soporta análisis de imágenes. Usa OpenAI, Gemini u OpenRouter (con modelo multimodal).`)
  }

  const imageBuffer = base64ToBuffer(imageBase64)

  const systemPrompt = `Eres un asistente especializado en extraer información de facturas de supermercado.
Tu tarea es analizar imágenes de facturas y extraer información estructurada.

REGLAS ESTRICTAS:
- Responde ÚNICAMENTE con JSON válido, sin backticks, sin texto adicional.
- Si no puedes extraer un campo, usa null. NO inventes datos.
- Los precios deben ser números (sin símbolos de moneda).
- Las cantidades deben ser números.
- La fecha debe estar en formato ISO 8601 (YYYY-MM-DD) si es posible extraerla.
- El campo "confidence" debe ser un número entre 0 y 1.`

  const userPrompt = `Analiza esta imagen de factura y extrae la información en este formato JSON exacto:
{
  "merchant": "Nombre del comercio o null",
  "date": "YYYY-MM-DD o null",
  "currency": "Código de moneda (USD, MXN, EUR, etc.) o null",
  "lineItems": [{ "name": "Producto", "qty": 1, "unitPrice": 10.50, "total": 10.50 }],
  "subtotal": 100.00,
  "tax": 16.00,
  "total": 116.00,
  "confidence": 0.95
}

Extrae TODOS los productos visibles. Si un campo no es visible o legible, usa null.`

  try {
    const { text } = await generateText({
      model: ai.model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: systemPrompt + '\n\n' + userPrompt },
            { type: 'image', image: imageBuffer },
          ],
        },
      ],
      maxOutputTokens: 2000,
      temperature: 0.3,
      providerOptions: ai.providerOptions,
    })

    const fallback: ReceiptData = {
      merchant: null,
      date: null,
      currency: null,
      lineItems: [],
      subtotal: null,
      tax: null,
      total: null,
      confidence: 0,
    }

    const result = parseJsonResponse<ReceiptData>(text, fallback)

    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      result.confidence = 0.5
    }

    if (!Array.isArray(result.lineItems)) {
      result.lineItems = []
    }

    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[AI] processReceiptImage error:', message)
    throw new Error(`Error procesando factura: ${message}`)
  }
}

export async function processReceiptImageLegacy(
  imageBase64: string,
  customApiKey?: string,
  customProvider?: AIProviderName,
  customModel?: string,
) {
  const receiptData = await processReceiptImage(imageBase64, customApiKey, customProvider, customModel)
  return {
    products: receiptData.lineItems.map(item => ({
      name: item.name,
      quantity_units: item.qty,
      quantity_kg: null,
      unit_price: item.unitPrice,
      total_price: item.total,
    })),
  }
}

export async function processFamilyData(
  familyMembers: unknown[],
  restrictions: unknown[],
  prohibitedDishes: string[],
  customApiKey?: string,
  customProvider?: AIProviderName,
  customModel?: string,
): Promise<FamilyRecommendations> {
  const ai = getAIModel(customApiKey, customProvider, 'default', customModel)

  const { text } = await generateText({
    model: ai.model,
    system: 'Eres un nutricionista especializado en planificación de comidas familiares. Proporciona recomendaciones personalizadas. Responde SOLO con JSON válido.',
    prompt: `Analiza estos datos de una familia y proporciona recomendaciones:

Miembros de la familia: ${JSON.stringify(familyMembers)}
Restricciones alimenticias: ${JSON.stringify(restrictions)}
Platos prohibidos: ${JSON.stringify(prohibitedDishes)}

Responde en formato JSON:
{ "recommendations": ["Recomendación 1", "Recomendación 2", "Recomendación 3"] }`,
    maxOutputTokens: 500,
    temperature: 0.7,
    providerOptions: ai.providerOptions,
  })

  return parseJsonResponse<FamilyRecommendations>(text, { recommendations: [] })
}

export async function processLeftovers(
  leftovers: unknown[],
  customApiKey?: string,
  customProvider?: AIProviderName,
  customModel?: string,
): Promise<FamilyRecommendations> {
  const ai = getAIModel(customApiKey, customProvider, 'default', customModel)

  const { text } = await generateText({
    model: ai.model,
    system: 'Eres un chef especializado en reducir el desperdicio de alimentos. Proporciona recomendaciones creativas para aprovechar sobrantes. Responde SOLO con JSON válido.',
    prompt: `Analiza estos sobrantes de comida y proporciona recomendaciones para aprovecharlos:

Sobrantes: ${JSON.stringify(leftovers)}

Responde en formato JSON:
{ "recommendations": ["Recomendación 1", "Recomendación 2", "Recomendación 3"] }`,
    maxOutputTokens: 500,
    temperature: 0.7,
    providerOptions: ai.providerOptions,
  })

  return parseJsonResponse<FamilyRecommendations>(text, { recommendations: [] })
}

export async function generateWeeklyMenu(
  familyMembers: unknown[],
  restrictions: unknown[],
  prohibitedDishes: string[],
  products: unknown[],
  customApiKey?: string,
  customProvider?: AIProviderName,
  customModel?: string,
) {
  const ai = getAIModel(customApiKey, customProvider, 'default', customModel)

  const { text } = await generateText({
    model: ai.model,
    system: 'Eres un chef especializado en planificación de comidas familiares. Genera menús semanales personalizados con recetas detalladas. Responde SOLO con JSON válido, sin backticks.',
    prompt: `Genera un menú semanal para esta familia:

Miembros de la familia: ${JSON.stringify(familyMembers)}
Restricciones alimenticias: ${JSON.stringify(restrictions)}
Platos prohibidos: ${JSON.stringify(prohibitedDishes)}
Productos disponibles: ${JSON.stringify(products)}

Responde en formato JSON:
{
  "weeklyMenu": [
    {
      "day": "Lun",
      "recipe": {
        "name": "Nombre (máx 100 chars)",
        "description": "Descripción (máx 100 chars)",
        "ingredients": [{ "name": "Ingrediente", "quantity": "1", "unit": "unidad" }],
        "instructions": ["Paso 1", "Paso 2"],
        "cookingTime": "30",
        "servings": "4",
        "difficulty": "Fácil",
        "nutritionalInfo": { "calories": "400", "protein": "25", "carbs": "40", "fat": "15" }
      },
      "protein": "Proteína principal",
      "side": "Acompañamiento"
    }
  ]
}

IMPORTANTE: Genera recetas para los 7 días (Lun, Mar, Mié, Jue, Vie, Sáb, Dom).`,
    maxOutputTokens: 4000,
    temperature: 0.7,
    providerOptions: ai.providerOptions,
  })

  return parseJsonResponse(text, { weeklyMenu: [] })
}

export async function generateMetrics(
  familyMembers: unknown[],
  products: unknown[],
  leftovers: unknown[],
  customApiKey?: string,
  customProvider?: AIProviderName,
  customModel?: string,
): Promise<MetricsData> {
  const ai = getAIModel(customApiKey, customProvider, 'default', customModel)

  const { text } = await generateText({
    model: ai.model,
    system: 'Eres un analista especializado en reducción de desperdicio alimentario y ahorro en el hogar. Responde SOLO con JSON válido.',
    prompt: `Genera métricas y recomendaciones basadas en:

Miembros de la familia: ${JSON.stringify(familyMembers)}
Productos comprados: ${JSON.stringify(products)}
Sobrantes registrados: ${JSON.stringify(leftovers)}

Responde en formato JSON:
{
  "metrics": {
    "wastePercentage": 15,
    "estimatedSavings": 250,
    "weeklyWaste": [20, 18, 15, 12, 10]
  },
  "recommendations": ["Recomendación 1", "Recomendación 2", "Recomendación 3", "Recomendación 4"]
}`,
    maxOutputTokens: 600,
    temperature: 0.5,
    providerOptions: ai.providerOptions,
  })

  const fallback: MetricsData = {
    metrics: {
      wastePercentage: 0,
      estimatedSavings: 0,
      weeklyWaste: [0, 0, 0, 0, 0],
    },
    recommendations: [],
  }

  return parseJsonResponse<MetricsData>(text, fallback)
}

// ============================================================================
// Smoke Test
// ============================================================================

export async function smokeTest() {
  console.log('\n=== AI Provider Smoke Test ===\n')

  try {
    const ai = getAIModel(undefined, undefined, 'small')

    console.log(`Test 1: Text generation with ${ai.providerName}...`)
    const { text } = await generateText({
      model: ai.model,
      prompt: 'Respond with exactly: "OK"',
      maxOutputTokens: 10,
      providerOptions: ai.providerOptions,
    })
    console.log(`  Result: ${text.trim()}`)
    console.log('  ✓ Text generation works\n')

    console.log('=== Smoke Test Complete ===\n')
    return { success: true }
  } catch (error) {
    console.error('Smoke test failed:', error)
    return { success: false, error }
  }
}
