"use client"

import { useState } from "react"
import { ArrowLeft, Plus, Sparkles, Loader2, Calendar, Sandwich, Coffee, Salad, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { saveLeftoversData } from "@/app/actions"
import { getCustomApiKey, getProviderToUse } from "@/lib/auth"
import { BottomNavigation } from "./bottom-navigation"

type Leftover = {
  id: string
  meal: string
  product: string
  quantity: string
}

const mealIcons: Record<string, typeof Sandwich> = {
  "Desayuno": Coffee,
  "Almuerzo": Sandwich,
  "Cena": Salad,
}

const mealColors: Record<string, string> = {
  "Desayuno": "bg-warning/10",
  "Almuerzo": "bg-primary/10",
  "Cena": "bg-secondary/10",
}

export function RegistroSobrantes() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [meal, setMeal] = useState<string>("")
  const [product, setProduct] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("")
  const [leftovers, setLeftovers] = useState<Leftover[]>([
    { id: "1", meal: "Almuerzo", product: "Pollo Asado", quantity: "1 presa" },
    { id: "2", meal: "Desayuno", product: "Pan Integral", quantity: "2 rebanadas" },
    { id: "3", meal: "Almuerzo", product: "Ensalada César", quantity: "150 g" },
  ])

  const addLeftover = () => {
    if (meal && product && quantity) {
      const newId = (Number.parseInt(leftovers[leftovers.length - 1]?.id || "0") + 1).toString()
      setLeftovers([...leftovers, { id: newId, meal, product, quantity }])
      setProduct("")
      setQuantity("")
    }
  }

  const handleSaveLeftovers = async () => {
    setIsLoading(true)

    try {
      // Get custom API key if user is using BYOK
      const customApiKey = getCustomApiKey()
      const customProvider = getProviderToUse()

      await saveLeftoversData(leftovers, customApiKey || undefined, customProvider || undefined)
      router.push("/")
    } catch (error) {
      console.error("Error saving leftovers:", error)
      router.push("/")
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentDate = () => {
    const now = new Date()
    const day = now.getDate()
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    return `Hoy, ${day} ${months[now.getMonth()]}`
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 py-4 flex items-center bg-white">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold ml-1">Registro de Sobrantes</h1>
      </header>

      {/* Date Chip */}
      <div className="px-4 py-3 flex justify-center bg-white">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{getCurrentDate()}</span>
        </div>
      </div>

      {/* Body */}
      <main className="flex-1 px-4 pt-4 pb-40 overflow-auto">
        {/* Add Form Card */}
        <Card className="p-4 rounded-2xl border-0 bg-white mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <Plus className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-foreground">Agregar Nuevo Sobrante</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Tipo de Comida</label>
              <Select value={meal} onValueChange={setMeal}>
                <SelectTrigger className="h-12 rounded-xl bg-surface border-0">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Desayuno">Desayuno</SelectItem>
                  <SelectItem value="Almuerzo">Almuerzo</SelectItem>
                  <SelectItem value="Cena">Cena</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Producto</label>
                <Input
                  placeholder="Ej. Arroz"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="h-12 rounded-xl bg-surface border-0"
                />
              </div>
              <div className="w-24">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Cant.</label>
                <Input
                  placeholder="200g"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-12 rounded-xl bg-surface border-0"
                />
              </div>
            </div>

            <Button
              onClick={addLeftover}
              disabled={!meal || !product || !quantity}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              AGREGAR
            </Button>
          </div>
        </Card>

        {/* Leftovers List */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Sobrantes de hoy</h2>
          <span className="text-sm font-medium text-primary">{leftovers.length} items</span>
        </div>

        <div className="space-y-3">
          {leftovers.map((leftover) => {
            const Icon = mealIcons[leftover.meal] || Sandwich
            const bgColor = mealColors[leftover.meal] || "bg-muted"
            return (
              <Card key={leftover.id} className="p-4 rounded-2xl border-0 bg-white">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-muted-foreground tracking-wider mb-0.5">
                      {leftover.meal.toUpperCase()}
                    </p>
                    <p className="font-bold text-foreground">{leftover.product}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{leftover.quantity}</span>
                </div>
                <div className="border-t border-dashed border-border mt-3 pt-3">
                  <button className="flex items-center gap-2 text-primary text-sm font-medium">
                    <Sparkles className="h-4 w-4" />
                    Ver Remix IA
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-16 left-0 right-0 p-4 bg-background">
        <Button
          className="w-full h-14 rounded-2xl bg-foreground hover:bg-foreground/90 text-white font-semibold"
          onClick={handleSaveLeftovers}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Guardar Sobrantes
            </>
          )}
        </Button>
      </footer>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
