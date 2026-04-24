"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Loader2, RefreshCw, Trash2, PiggyBank, TrendingDown, TrendingUp, Sparkles, ChevronRight, Snowflake, Salad } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"
import { generateMetricsData } from "@/app/actions"
import { getCustomApiKey, getProviderToUse } from "@/lib/auth"
import { BottomNavigation } from "./bottom-navigation"

type Metrics = {
  wasteKg: number
  wasteChange: number
  estimatedSavings: number
  savingsChange: number
  weeklyWaste: number[]
}

type Recommendation = {
  id: string
  title: string
  description: string
  type: "recipe" | "tip"
}

const weekDays = ["L", "M", "X", "J", "V", "S", "D"]

export function Metricas() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [metrics, setMetrics] = useState<Metrics>({
    wasteKg: 1.2,
    wasteChange: -5,
    estimatedSavings: 120.50,
    savingsChange: 12,
    weeklyWaste: [0.3, 0.2, 0.15, 0.1, 0.05, 0, 0],
  })
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    { id: "1", title: "Remix de Pollo", description: "Usa el pollo sobrante para hacer tacos o ensalada", type: "recipe" },
    { id: "2", title: "Tip de conservación", description: "Congela el pan en rebanadas para que dure más tiempo", type: "tip" },
  ])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClientSupabaseClient()

        const { data: metricsData, error: metricsError } = await supabase
          .from("metrics")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(7)

        if (metricsError) throw metricsError

        const { data: recommendationsData, error: recommendationsError } = await supabase
          .from("recommendations")
          .select("*")
          .limit(3)

        if (recommendationsError) throw recommendationsError

        if (metricsData && metricsData.length > 0) {
          const data = metricsData as { week_number: number; waste_kg: number; waste_change: number; estimated_savings: number; savings_change: number }[]
          const sortedMetrics = data.sort((a, b) => a.week_number - b.week_number)
          setMetrics({
            wasteKg: sortedMetrics[sortedMetrics.length - 1].waste_kg || 1.2,
            wasteChange: sortedMetrics[sortedMetrics.length - 1].waste_change || -5,
            estimatedSavings: sortedMetrics[sortedMetrics.length - 1].estimated_savings || 120.50,
            savingsChange: sortedMetrics[sortedMetrics.length - 1].savings_change || 12,
            weeklyWaste: sortedMetrics.map((m) => m.waste_kg || 0),
          })
        }

        if (recommendationsData && recommendationsData.length > 0) {
          const recData = recommendationsData as { id: string; title: string; text: string; type: string }[]
          setRecommendations(
            recData.map((r) => ({
              id: r.id,
              title: r.title || "Recomendación",
              description: r.text,
              type: (r.type || "tip") as "recipe" | "tip",
            })),
          )
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleGenerateMetrics = async () => {
    setIsGenerating(true)

    try {
      // Get custom API key if user is using BYOK
      const customApiKey = getCustomApiKey()
      const customProvider = getProviderToUse()

      const result = await generateMetricsData(customApiKey || undefined, customProvider || undefined)

      if (result.success) {
        if (result.metrics) {
          setMetrics({
            wasteKg: result.metrics.wasteKg || 1.2,
            wasteChange: result.metrics.wasteChange || -5,
            estimatedSavings: result.metrics.estimatedSavings || 120.50,
            savingsChange: result.metrics.savingsChange || 12,
            weeklyWaste: result.metrics.weeklyWaste || [0.3, 0.2, 0.15, 0.1, 0.05, 0, 0],
          })
        }

        if (result.recommendations) {
          setRecommendations(
            result.recommendations.map((text: string, index: number) => ({
              id: (index + 1).toString(),
              title: index === 0 ? "Remix sugerido" : "Tip de conservación",
              description: text,
              type: index === 0 ? "recipe" as const : "tip" as const,
            })),
          )
        }
      }
    } catch (error) {
      console.error("Error generating metrics:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const maxWaste = Math.max(...metrics.weeklyWaste, 0.5)
  const todayIndex = new Date().getDay() - 1

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg font-medium">Cargando métricas...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between bg-white">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold ml-1">Métricas y ahorro</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-primary text-primary"
          onClick={handleGenerateMetrics}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualizar
            </>
          )}
        </Button>
      </header>

      {/* Body */}
      <main className="flex-1 px-4 pt-4 pb-24 overflow-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-4 rounded-2xl border-0 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Desperdicio</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{metrics.wasteKg} kg</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="h-4 w-4 text-secondary" />
              <span className="text-xs text-secondary font-medium">{metrics.wasteChange}% vs mes pasado</span>
            </div>
          </Card>

          <Card className="p-4 rounded-2xl border-0 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
                <PiggyBank className="h-4 w-4 text-secondary" />
              </div>
              <span className="text-xs text-muted-foreground">Ahorro Total</span>
            </div>
            <p className="text-2xl font-bold text-foreground">${metrics.estimatedSavings.toFixed(2)}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-4 w-4 text-secondary" />
              <span className="text-xs text-secondary font-medium">+{metrics.savingsChange}% vs mes pasado</span>
            </div>
          </Card>
        </div>

        {/* Weekly Chart */}
        <Card className="p-4 rounded-2xl border-0 bg-white mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground tracking-wider">EVOLUCIÓN SEMANAL</p>
            <button className="text-xs text-primary font-medium">Esta semana</button>
          </div>
          <p className="text-lg font-bold text-foreground mb-4">
            {metrics.weeklyWaste.reduce((a, b) => a + b, 0).toFixed(1)} kg esta semana
          </p>
          <div className="flex items-end justify-between gap-2 h-32">
            {metrics.weeklyWaste.map((value, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="relative w-full flex justify-center mb-2">
                  {index === todayIndex && (
                    <span className="absolute -top-5 text-xs font-medium text-primary">Hoy</span>
                  )}
                  <div
                    className={`w-8 rounded-t-lg transition-all ${
                      index === todayIndex ? "bg-primary" : "bg-primary/30"
                    }`}
                    style={{ height: `${(value / maxWaste) * 100}px`, minHeight: "4px" }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{weekDays[index]}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recommendations */}
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-foreground">Recomendaciones</h2>
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="space-y-3">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="p-4 rounded-2xl border-0 bg-white">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  rec.type === "recipe" ? "bg-primary/10" : "bg-info/10"
                }`}>
                  {rec.type === "recipe" ? (
                    <Salad className="h-5 w-5 text-primary" />
                  ) : (
                    <Snowflake className="h-5 w-5 text-info" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{rec.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{rec.description}</p>
                  {rec.type === "recipe" && (
                    <button className="flex items-center gap-1 text-primary text-sm font-medium mt-2">
                      Ver Receta
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
