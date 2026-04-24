import { generateText } from "ai"
import { NextResponse } from "next/server"
import { getAIModel } from "@/lib/openai"

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    const ai = getAIModel()
    const { text } = await generateText({
      model: ai.model,
      prompt: prompt,
      system:
        "Eres un asistente culinario especializado en planificación de comidas familiares. Tu tarea es interpretar las solicitudes del usuario y proporcionar respuestas útiles relacionadas con la planificación de comidas, recetas y consejos de cocina. IMPORTANTE: Debes responder SIEMPRE en formato JSON con la siguiente estructura: { 'response': 'tu respuesta aquí' }",
      providerOptions: ai.providerOptions,
    })

    try {
      const parsedResponse = JSON.parse(text)
      return NextResponse.json(parsedResponse)
    } catch (error) {
      // Si el texto no es JSON válido, lo enviamos como respuesta plana
      return NextResponse.json({ response: text })
    }
  } catch (error) {
    console.error("Error in generate API:", error)
    return NextResponse.json(
      { error: "Error processing your request" },
      { status: 500 }
    )
  }
} 
