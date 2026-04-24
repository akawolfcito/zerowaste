/**
 * AI integration via Vercel AI SDK.
 * Supports OpenAI and Google Gemini providers.
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
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o'
const DEFAULT_OPENAI_SMALL_MODEL = process.env.OPENAI_SMALL_MODEL || 'gpt-4o-mini'
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

export type AIProviderName = 'openai' | 'gemini'

// ============================================================================
// Logging Middleware
// ============================================================================

/**
 * Custom fetch wrapper that logs request details (NOT sensitive data)
 * Only logs: URL path, status code, x-request-id
 */
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

/**
 * Creates an AI model instance using the selected provider.
 */
function normalizeProvider(provider?: string, apiKey?: string): AIProviderName {
  if (provider === 'openai' || provider === 'gemini') return provider
  if (apiKey?.startsWith('sk-')) return 'openai'
  if (apiKey?.startsWith('AIza')) return 'gemini'
  return process.env.AI_PROVIDER === 'gemini' ? 'gemini' : DEFAULT_AI_PROVIDER
}

function getProviderApiKey(providerName: AIProviderName, customApiKey?: string) {
  if (customApiKey) return customApiKey

  if (providerName === 'gemini') {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
  }

  return process.env.OPENAI_API_KEY || ''
}

export function getAIModel(
  customApiKey?: string,
  customProvider?: AIProviderName,
  modelKind: 'default' | 'small' = 'default'
) {
  const providerName = normalizeProvider(customProvider, customApiKey)
  const apiKey = getProviderApiKey(providerName, customApiKey)
  if (!apiKey) {
    throw new Error(`${providerName === 'gemini' ? 'Gemini' : 'OpenAI'} API key not configured`)
  }

  if (providerName === 'gemini') {
    const provider = createGoogleGenerativeAI({
      apiKey,
      fetch: LOG_REQUESTS ? createLoggingFetch(providerName) : undefined,
    })
    return {
      providerName,
      model: provider(DEFAULT_GEMINI_MODEL),
      providerOptions: undefined,
    }
  }

  const provider = createOpenAI({
    apiKey,
    fetch: LOG_REQUESTS ? createLoggingFetch(providerName) : undefined,
  })

  return {
    providerName,
    model: provider(modelKind === 'small' ? DEFAULT_OPENAI_SMALL_MODEL : DEFAULT_OPENAI_MODEL),
    providerOptions: {
      openai: {
        store: false,
      },
    },
  }
}

/**
 * Default provider options for all requests
 * - store: false to minimize data retention
 * - No tools enabled (web_search, file_search, etc.)
 */
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

/**
 * Converts base64 string to Buffer for image processing
 * Strips data URL prefix if present
 */
function base64ToBuffer(base64String: string): Buffer {
  const base64Data = base64String.includes(',')
    ? base64String.split(',')[1]
    : base64String
  return Buffer.from(base64Data, 'base64')
}

/**
 * Safely parses JSON from AI response, cleaning common artifacts
 */
function parseJsonResponse<T>(text: string, fallback: T): T {
  try {
    // Remove markdown code blocks if present
    const cleanText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // Find JSON object boundaries
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

/**
 * Process receipt image using GPT-4o vision
 * Uses Responses API with image as Buffer
 */
export async function processReceiptImage(
  imageBase64: string,
  customApiKey?: string,
  customProvider?: AIProviderName
): Promise<ReceiptData> {
  const ai = getAIModel(customApiKey, customProvider)
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

    // Validate and normalize confidence
    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      result.confidence = 0.5
    }

    // Ensure lineItems is an array
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

/**
 * Legacy wrapper for backward compatibility
 */
export async function processReceiptImageLegacy(
  imageBase64: string,
  customApiKey?: string,
  customProvider?: AIProviderName
) {
  try {
    const receiptData = await processReceiptImage(imageBase64, customApiKey, customProvider)
    return {
      products: receiptData.lineItems.map(item => ({
        name: item.name,
        quantity_units: item.qty,
        quantity_kg: null,
        unit_price: item.unitPrice,
        total_price: item.total,
      })),
    }
  } catch (error) {
    console.error('[AI] processReceiptImageLegacy error:', error)
    return { products: [] }
  }
}

/**
 * Process family onboarding data and generate recommendations
 */
export async function processFamilyData(
  familyMembers: unknown[],
  restrictions: unknown[],
  prohibitedDishes: string[],
  customApiKey?: string,
  customProvider?: AIProviderName
): Promise<FamilyRecommendations> {
  const ai = getAIModel(customApiKey, customProvider)

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

/**
 * Process leftovers data and generate reuse recommendations
 */
export async function processLeftovers(
  leftovers: unknown[],
  customApiKey?: string,
  customProvider?: AIProviderName
): Promise<FamilyRecommendations> {
  const ai = getAIModel(customApiKey, customProvider)

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

/**
 * Generate weekly menu based on family data and available products
 */
export async function generateWeeklyMenu(
  familyMembers: unknown[],
  restrictions: unknown[],
  prohibitedDishes: string[],
  products: unknown[],
  customApiKey?: string,
  customProvider?: AIProviderName
) {
  const ai = getAIModel(customApiKey, customProvider)

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

/**
 * Generate waste metrics and savings recommendations
 */
export async function generateMetrics(
  familyMembers: unknown[],
  products: unknown[],
  leftovers: unknown[],
  customApiKey?: string,
  customProvider?: AIProviderName
): Promise<MetricsData> {
  const ai = getAIModel(customApiKey, customProvider)

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
// Smoke Test (for development verification)
// ============================================================================

/**
 * Smoke test to verify the configured provider works.
 * Run with: npx tsx -e "import('./lib/openai').then(m => m.smokeTest())"
 */
export async function smokeTest() {
  console.log('\n=== AI Provider Smoke Test ===\n')

  try {
    const ai = getAIModel(undefined, undefined, 'small')

    // Test 1: Simple text generation
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
