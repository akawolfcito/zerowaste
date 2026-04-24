"use client"

import { useEffect, useState } from "react"
import { Menu, Loader2, Heart, Sparkles, ThumbsUp, X, CalendarDays, BarChart3, ListTodo, LayoutGrid, Salad } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { generateMenu } from "@/app/actions"
import { createClientSupabaseClient } from "@/lib/supabase"
import { BottomNavigation } from "./bottom-navigation"

type MealDay = {
  id: string
  day: string
  recipe: string
  protein: string
  side: string
}

export function WelcomeScreen() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [weekMenu, setWeekMenu] = useState<MealDay[]>([])
  const [favIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(true)

  useEffect(() => {
    const fetchMenu = async () => {
      const supabase = createClientSupabaseClient()
      const { data, error } = await supabase.from("weekly_menu").select("*")
      if (!error && data) setWeekMenu(data)
    }
    fetchMenu()
  }, [])

  const favoriteRecipe = weekMenu.length > 0
    ? JSON.parse(weekMenu[favIndex].recipe)
    : null

  const handleCook = async () => {
    if (!prompt.trim()) {
      router.push("/menu-semanal")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) throw new Error("Error en la generación del texto")

      await response.json()
      const result = await generateMenu()

      if (!result.success) throw new Error("Error al generar el menú")

      router.push("/menu-semanal")
    } catch (error) {
      console.error("Error processing prompt:", error)
      router.push("/menu-semanal")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleCook()
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Zerowaste</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push("/lista-compra")}>Lista de compra</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/sobrantes")}>Registrar sobrantes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/metricas")}>Métricas</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-24 overflow-auto">
        {/* Search Input */}
        <div className="relative mb-6">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <Input
            placeholder="Generar menú con IA..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyPress}
            className="h-14 pl-12 pr-4 rounded-full bg-surface border-border text-base placeholder:text-muted-foreground"
          />
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Favorite Section Title */}
        <h2 className="text-lg font-bold text-foreground mb-3">Favorito de la Semana</h2>

        {/* Favorite Card */}
        <Card
          className="mb-6 overflow-hidden rounded-2xl border-0 shadow-sm cursor-pointer"
          onClick={() => router.push("/receta")}
        >
          {/* Image Container */}
          <div className="relative h-48 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            <Salad className="h-24 w-24 text-primary/60" />
          </div>

          {/* Content */}
          <div className="p-4 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">
                  {favoriteRecipe ? favoriteRecipe.name : "Lasaña de Verduras"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {favoriteRecipe ? favoriteRecipe.description : "Receta baja en desperdicios"}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsFavorite(!isFavorite)
                }}
                className="ml-2"
              >
                <Heart
                  className={`h-6 w-6 ${isFavorite ? "fill-primary text-primary" : "text-muted-foreground"}`}
                />
              </button>
            </div>
            <Button
              className="mt-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 font-medium"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                router.push("/receta")
              }}
            >
              Ver receta
            </Button>
          </div>
        </Card>

        {/* Quick Access Title */}
        <h2 className="text-lg font-bold text-foreground mb-3">Accesos Rápidos</h2>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card
            className="p-4 rounded-2xl border-0 bg-surface cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/configuracion")}
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <ThumbsUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Gustos</h3>
          </Card>

          <Card
            className="p-4 rounded-2xl border-0 bg-surface cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/menu-semanal")}
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <X className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Menú</h3>
          </Card>

          <Card
            className="p-4 rounded-2xl border-0 bg-surface cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/subir-factura")}
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Factura</h3>
          </Card>

          <Card
            className="p-4 rounded-2xl border-0 bg-surface cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/metricas")}
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Reporte</h3>
          </Card>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex gap-3">
          <Button
            className="flex-1 h-14 rounded-2xl bg-foreground hover:bg-foreground/90 text-white font-medium"
            onClick={() => router.push("/lista-compra")}
          >
            <ListTodo className="h-5 w-5 mr-2" />
            Lista
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-14 rounded-2xl border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-medium"
            onClick={() => router.push("/sobrantes")}
          >
            <LayoutGrid className="h-5 w-5 mr-2" />
            Sobrantes
          </Button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
