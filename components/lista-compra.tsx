"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, ChevronDown, ChevronUp, Download, Check, Circle, Beef, Carrot, Milk, Package, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { BottomNavigation } from "./bottom-navigation"
import { generateShoppingList, updateShoppingItem } from "@/app/actions"
import { createClientSupabaseClient } from "@/lib/supabase"
import { generateShoppingListPDF } from "@/lib/pdf-generator"

type Category = {
  id: string
  name: string
  icon: typeof Beef
  color: string
  bgColor: string
  expanded: boolean
  items: ShoppingItem[]
}

type ShoppingItem = {
  id: string
  name: string
  quantity: string
  checked: boolean
}

const categoryIcons: Record<string, typeof Beef> = {
  "Proteína": Beef,
  "Verduras": Carrot,
  "Lácteos": Milk,
  "Huevos": Package,
  "Granos": Package,
  "Frutas": Carrot,
  "Otros": Package,
}

const categoryColors: Record<string, { color: string; bgColor: string }> = {
  "Proteína": { color: "text-primary", bgColor: "bg-primary/10" },
  "Verduras": { color: "text-secondary", bgColor: "bg-secondary/10" },
  "Lácteos": { color: "text-info", bgColor: "bg-info/10" },
  "Huevos": { color: "text-amber-700", bgColor: "bg-amber-100" },
  "Granos": { color: "text-orange-700", bgColor: "bg-orange-100" },
  "Frutas": { color: "text-green-700", bgColor: "bg-green-100" },
  "Otros": { color: "text-gray-700", bgColor: "bg-gray-100" },
}

export function ListaCompra() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const loadShoppingList = async () => {
    try {
      setIsLoading(true)
      const supabase = createClientSupabaseClient()
      const { data, error } = await supabase
        .from("shopping_list")
        .select("*")
        .order("category", { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        // Agrupar por categoría
        const groupedData: Record<string, any[]> = {}

        data.forEach((item: any) => {
          const category = item.category || "Otros"
          if (!groupedData[category]) {
            groupedData[category] = []
          }
          groupedData[category].push({
            id: item.id,
            name: item.ingredient_name,
            quantity: `${item.quantity}${item.unit ? ' ' + item.unit : ''}`,
            checked: item.is_purchased || false,
          })
        })

        // Convertir a formato de categorías
        const categoriesArray: Category[] = Object.keys(groupedData).map((categoryName, index) => ({
          id: (index + 1).toString(),
          name: categoryName,
          icon: categoryIcons[categoryName] || Package,
          color: categoryColors[categoryName]?.color || "text-gray-700",
          bgColor: categoryColors[categoryName]?.bgColor || "bg-gray-100",
          expanded: true,
          items: groupedData[categoryName],
        }))

        setCategories(categoriesArray)
      } else {
        setCategories([])
      }
    } catch (error) {
      console.error("Error loading shopping list:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar datos desde Supabase
  useEffect(() => {
    queueMicrotask(() => {
      void loadShoppingList()
    })
  }, [])

  const handleGenerateList = async () => {
    setIsGenerating(true)
    try {
      const result = await generateShoppingList()
      if (result.success) {
        // Recargar la lista
        await loadShoppingList()
      } else {
        alert(result.error || "Error al generar la lista")
      }
    } catch (error) {
      console.error("Error generating shopping list:", error)
      alert("Error al generar la lista de compras")
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setCategories(
      categories.map((category) => {
        if (category.id === categoryId) {
          return { ...category, expanded: !category.expanded }
        }
        return category
      }),
    )
  }

  const toggleItem = async (categoryId: string, itemId: string) => {
    // Actualizar UI optimísticamente
    let newCheckedState = false
    setCategories(
      categories.map((category) => {
        if (category.id === categoryId) {
          return {
            ...category,
            items: category.items.map((item) => {
              if (item.id === itemId) {
                newCheckedState = !item.checked
                return { ...item, checked: newCheckedState }
              }
              return item
            }),
          }
        }
        return category
      }),
    )

    // Actualizar en la base de datos
    try {
      await updateShoppingItem(itemId, newCheckedState)
    } catch (error) {
      console.error("Error updating item:", error)
      // Revertir si falla
      setCategories(
        categories.map((category) => {
          if (category.id === categoryId) {
            return {
              ...category,
              items: category.items.map((item) => {
                if (item.id === itemId) {
                  return { ...item, checked: !newCheckedState }
                }
                return item
              }),
            }
          }
          return category
        }),
      )
    }
  }

  const markAll = () => {
    setCategories(
      categories.map((category) => ({
        ...category,
        items: category.items.map((item) => ({ ...item, checked: true })),
      })),
    )
  }

  const downloadPDF = () => {
    if (categories.length === 0) {
      alert("No hay items en la lista para descargar")
      return
    }

    try {
      // Generar y descargar PDF
      generateShoppingListPDF(categories)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Error al generar el PDF")
    }
  }

  const getTotalItems = (category: Category) => category.items.length

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-surface">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg font-medium">Cargando lista...</p>
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
          <h1 className="text-lg font-bold ml-1">Mis compras</h1>
        </div>
        {categories.length === 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerateList}
            disabled={isGenerating}
            className="text-primary font-semibold text-sm"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            Generar
          </Button>
        )}
      </header>

      {/* Body */}
      <main className="flex-1 px-4 pt-4 pb-24 overflow-auto">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16">
            <div className="h-24 w-24 rounded-full bg-surface flex items-center justify-center mb-4">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Lista vacía</h2>
            <p className="text-center text-muted-foreground mb-6 px-8">
              Genera tu lista de compras automáticamente desde el menú semanal
            </p>
            <Button
              onClick={handleGenerateList}
              disabled={isGenerating}
              className="rounded-full px-6"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar desde menú
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {/* Action Buttons */}
            <div className="px-0 py-3 flex gap-3 mb-4">
              <Card
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-0 bg-white cursor-pointer hover:bg-surface/80"
                onClick={markAll}
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium text-sm text-foreground">Marcar todo</span>
              </Card>
              <Card
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-0 bg-white cursor-pointer hover:bg-surface/80"
                onClick={downloadPDF}
              >
                <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center">
                  <Download className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <span className="font-medium text-sm text-foreground">Descargar</span>
                  <span className="font-medium text-sm text-foreground block">PDF</span>
                </div>
              </Card>
            </div>

            <div className="space-y-3">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <Card key={category.id} className="rounded-2xl border-0 bg-white overflow-hidden">
                    {/* Category Header */}
                    <button
                      className="w-full flex items-center justify-between p-4"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full ${category.bgColor} flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 ${category.color}`} />
                        </div>
                        <span className="font-bold text-foreground">{category.name}</span>
                        <span className="h-6 w-6 rounded-full bg-surface flex items-center justify-center text-xs font-medium text-muted-foreground">
                          {getTotalItems(category)}
                        </span>
                      </div>
                      {category.expanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>

                    {/* Items */}
                    {category.expanded && (
                      <div className="px-4 pb-4">
                        <div className="border-t border-dashed border-border/50" />
                        <div className="pt-3 space-y-1">
                          {category.items.map((item, index) => (
                            <div key={item.id}>
                              <button
                                className="w-full flex items-center justify-between py-2"
                                onClick={() => toggleItem(category.id, item.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    item.checked
                                      ? "bg-primary border-primary"
                                      : "border-muted-foreground/30"
                                  }`}>
                                    {item.checked && <Check className="h-3 w-3 text-white" />}
                                  </div>
                                  <span className={`font-medium ${item.checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                    {item.name}
                                  </span>
                                </div>
                                <span className={`text-sm ${item.checked ? "text-primary" : "text-muted-foreground"}`}>
                                  {item.quantity}
                                </span>
                              </button>
                              {index < category.items.length - 1 && (
                                <div className="border-b border-dashed border-border/50 ml-8" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
