"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Loader2, Clock, Users, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, MoreHorizontal, Check, Plus, ListChecks, Salad, Soup, Pizza, Sandwich, Fish } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { createClientSupabaseClient } from "@/lib/supabase"
import { generateMenu } from "@/app/actions"
import { getCustomApiKey, getProviderToUse } from "@/lib/auth"
import { BottomNavigation } from "@/components/bottom-navigation"

type MealDay = {
  id: string
  day: string
  recipe: string
  protein: string
  side: string
}

type RecipeData = {
  name: string
  description: string
  cookingTime: number
  servings: number
  difficulty: string
  ingredients: { name: string; quantity: string; unit: string }[]
}

const dayNames: Record<string, string> = {
  "Lun": "LUNES",
  "Mar": "MARTES",
  "Mié": "MIÉRCOLES",
  "Jue": "JUEVES",
  "Vie": "VIERNES",
  "Sáb": "SÁBADO",
  "Dom": "DOMINGO",
}

const dayIcons = [Salad, Soup, Pizza, Sandwich, Fish, Salad, Soup]

export function MenuSemanal() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [weekMenu, setWeekMenu] = useState<MealDay[]>([])
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const supabase = createClientSupabaseClient()
        const { data, error } = await supabase.from("weekly_menu").select("*")

        if (error) throw error

        if (data && data.length > 0) {
          setWeekMenu(data)
        } else {
          setWeekMenu([
            { id: "1", day: "Lun", recipe: JSON.stringify({ name: "Ensalada César con Pollo", description: "Ensalada fresca con pollo a la parrilla", cookingTime: 30, servings: 2, difficulty: "Fácil", ingredients: [{ name: "Lechuga romana", quantity: "1", unit: "unidad" }, { name: "Parmesano rallado", quantity: "50", unit: "g" }, { name: "Crutones de ajo", quantity: "100", unit: "g" }] }), protein: "Pechuga", side: "Crutones" },
            { id: "2", day: "Mar", recipe: JSON.stringify({ name: "Pasta Alfredo con Camarones", description: "Cremosa pasta con camarones", cookingTime: 45, servings: 4, difficulty: "Media", ingredients: [{ name: "Pasta fettuccine", quantity: "400", unit: "g" }, { name: "Camarones", quantity: "300", unit: "g" }, { name: "Crema", quantity: "200", unit: "ml" }] }), protein: "Camarones", side: "Pan ajo" },
            { id: "3", day: "Mié", recipe: JSON.stringify({ name: "Curry Rojo Tailandés", description: "Curry aromático con vegetales", cookingTime: 60, servings: 2, difficulty: "Difícil", ingredients: [{ name: "Tofu", quantity: "200", unit: "g" }, { name: "Leche de coco", quantity: "400", unit: "ml" }, { name: "Pasta de curry", quantity: "2", unit: "cdas" }] }), protein: "Tofu", side: "Arroz Jazmín" },
          ])
        }
      } catch (error) {
        console.error("Error fetching menu:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenu()
  }, [])

  const handleGenerateMenu = async () => {
    setIsGenerating(true)
    try {
      // Get custom API key if user is using BYOK
      const customApiKey = getCustomApiKey()
      const customProvider = getProviderToUse()

      const result = await generateMenu(customApiKey || undefined, customProvider || undefined)
      if (result.success && result.weeklyMenu) {
        setWeekMenu(result.weeklyMenu)
      }
    } catch (error) {
      console.error("Error generating menu:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCards(newExpanded)
  }

  const toggleIngredient = (ingredientKey: string) => {
    const newChecked = new Set(checkedIngredients)
    if (newChecked.has(ingredientKey)) {
      newChecked.delete(ingredientKey)
    } else {
      newChecked.add(ingredientKey)
    }
    setCheckedIngredients(newChecked)
  }

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "fácil":
        return { bg: "bg-secondary/10", text: "text-secondary", icon: "😊" }
      case "media":
        return { bg: "bg-warning/10", text: "text-warning", icon: "📊" }
      case "difícil":
        return { bg: "bg-destructive/10", text: "text-destructive", icon: "🔥" }
      default:
        return { bg: "bg-muted", text: "text-muted-foreground", icon: "😊" }
    }
  }

  const getCurrentWeekRange = () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    return `${monday.getDate()} ${months[monday.getMonth()]} - ${sunday.getDate()} ${months[sunday.getMonth()]}`
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg font-medium">Cargando menú...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">Tu Menú Semanal</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGenerateMenu}
            disabled={isGenerating}
            className="h-10 w-10 rounded-full bg-surface"
          >
            <RefreshCw className={`h-5 w-5 text-primary ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Week Selector */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </Button>
          <div className="text-center">
            <p className="text-xs font-semibold text-primary tracking-wider">SEMANA ACTUAL</p>
            <p className="text-base font-medium text-foreground">{getCurrentWeekRange()}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* Menu List */}
      <main className="flex-1 px-4 pb-32 overflow-auto">
        {weekMenu.map((day, index) => {
          let recipeData: RecipeData
          try {
            recipeData = JSON.parse(day.recipe)
          } catch {
            recipeData = { name: day.recipe, description: "", cookingTime: 0, servings: 0, difficulty: "", ingredients: [] }
          }

          const isExpanded = expandedCards.has(day.id)
          const difficultyStyle = getDifficultyStyle(recipeData.difficulty)
          const DayIcon = dayIcons[index % dayIcons.length]

          return (
            <Card key={day.id} className="mb-4 rounded-2xl border-0 bg-white overflow-hidden shadow-sm">
              {/* Day Header */}
              <div className="flex items-center justify-between px-4 pt-4">
                <span className="text-sm font-bold text-primary tracking-wide">
                  {dayNames[day.day] || day.day}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                  <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                </Button>
              </div>

              {/* Recipe Content */}
              <div className="flex p-4 pt-2">
                {/* Recipe Icon */}
                <div className="w-16 h-16 rounded-xl bg-primary/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <DayIcon className="h-8 w-8 text-primary" />
                </div>

                {/* Recipe Info */}
                <div className="flex-1 ml-3">
                  <h3 className="font-bold text-foreground">{recipeData.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Proteína: {day.protein} | Acomp: {day.side}
                  </p>

                  {/* Stats Row */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">{recipeData.cookingTime} min</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">{recipeData.servings} pax</span>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${difficultyStyle.bg}`}>
                      <span className="text-xs">{difficultyStyle.icon}</span>
                      <span className={`text-xs font-medium ${difficultyStyle.text}`}>
                        {recipeData.difficulty || "Fácil"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Ingredients */}
              {isExpanded && recipeData.ingredients && recipeData.ingredients.length > 0 && (
                <div className="px-4 pb-2 border-t border-border/50 pt-3 mx-4">
                  <p className="text-xs font-semibold text-muted-foreground tracking-wider mb-2">INGREDIENTES</p>
                  <div className="space-y-2">
                    {recipeData.ingredients.map((ing, i) => {
                      const key = `${day.id}-${i}`
                      const isChecked = checkedIngredients.has(key)
                      return (
                        <button
                          key={i}
                          onClick={() => toggleIngredient(key)}
                          className="flex items-center gap-3 w-full text-left"
                        >
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isChecked ? "bg-primary border-primary" : "border-muted-foreground/30"
                          }`}>
                            {isChecked && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className={`text-sm flex-1 ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {ing.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Ver más/menos toggle */}
              <button
                onClick={() => toggleExpand(day.id)}
                className="w-full py-3 text-muted-foreground text-sm font-medium flex items-center justify-center gap-1 border-t border-border/50"
              >
                {isExpanded ? (
                  <>Ver menos <ChevronUp className="h-4 w-4" /></>
                ) : (
                  <>Ver más <ChevronDown className="h-4 w-4" /></>
                )}
              </button>
            </Card>
          )
        })}

        {/* Empty Day Card */}
        <Card className="mb-4 rounded-2xl border-2 border-dashed border-border bg-transparent overflow-hidden">
          <button
            onClick={() => handleGenerateMenu()}
            className="w-full py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus className="h-8 w-8" />
            <span className="font-medium">Planificar Jueves</span>
          </button>
        </Card>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4">
        <Button
          className="h-12 px-5 rounded-full bg-primary hover:bg-primary/90 text-white font-medium shadow-lg"
          onClick={() => router.push("/lista-compra")}
        >
          <ListChecks className="h-5 w-5 mr-2" />
          Generar lista
        </Button>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
