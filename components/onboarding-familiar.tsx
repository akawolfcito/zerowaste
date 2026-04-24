"use client"

import type React from "react"
import { useState } from "react"
import { Minus, Plus, X, Loader2, ArrowLeft, ArrowRight, Search, User, Baby, Leaf, Rabbit, Circle, Droplet, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { saveFamilyData } from "@/app/actions"
import { getCustomApiKey, getProviderToUse } from "@/lib/auth"
import { BottomNavigation } from "./bottom-navigation"

type FamilyMember = {
  id: string
  type: "adultos" | "ninos"
  count: number
  icon: typeof User
}

type DietOption = {
  id: string
  name: string
  icon: typeof Leaf
  selected: boolean
}

export function OnboardingFamiliar() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep] = useState(2)

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { id: "1", type: "adultos", count: 2, icon: User },
    { id: "2", type: "ninos", count: 1, icon: Baby },
  ])

  const [dietOptions, setDietOptions] = useState<DietOption[]>([
    { id: "1", name: "Vegetariano", icon: Leaf, selected: true },
    { id: "2", name: "Vegano", icon: Rabbit, selected: false },
    { id: "3", name: "Sin gluten", icon: Circle, selected: false },
    { id: "4", name: "Sin lácteos", icon: Droplet, selected: false },
  ])

  const [avoidedIngredients, setAvoidedIngredients] = useState<string[]>([])
  const [ingredientSearch, setIngredientSearch] = useState("")

  const updateMemberCount = (id: string, increment: boolean) => {
    setFamilyMembers(
      familyMembers.map((member) => {
        if (member.id === id) {
          const newCount = increment ? member.count + 1 : Math.max(0, member.count - 1)
          return { ...member, count: newCount }
        }
        return member
      }),
    )
  }

  const toggleDietOption = (id: string) => {
    setDietOptions(
      dietOptions.map((option) => {
        if (option.id === id) {
          return { ...option, selected: !option.selected }
        }
        return option
      }),
    )
  }

  const addIngredient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && ingredientSearch.trim()) {
      if (!avoidedIngredients.includes(ingredientSearch.trim())) {
        setAvoidedIngredients([...avoidedIngredients, ingredientSearch.trim()])
      }
      setIngredientSearch("")
      e.preventDefault()
    }
  }

  const removeIngredient = (ingredient: string) => {
    setAvoidedIngredients(avoidedIngredients.filter((i) => i !== ingredient))
  }

  const getMemberLabel = (type: string) => {
    switch (type) {
      case "adultos":
        return "Adultos"
      case "ninos":
        return "Niños"
      default:
        return type
    }
  }

  const handleSaveAndContinue = async () => {
    setIsLoading(true)

    try {
      // Convert to old format for compatibility
      const oldFormatMembers = [
        { id: "1", type: "mama" as const, count: Math.ceil(familyMembers[0].count / 2) },
        { id: "2", type: "papa" as const, count: Math.floor(familyMembers[0].count / 2) },
        { id: "3", type: "adolescente" as const, count: 0 },
        { id: "4", type: "nino" as const, count: familyMembers[1].count },
      ]

      const restrictions = dietOptions
        .filter(d => d.selected)
        .map((d, i) => ({ id: String(i + 1), name: d.name, checked: true }))

      // Get custom API key if user is using BYOK
      const customApiKey = getCustomApiKey()
      const customProvider = getProviderToUse()

      await saveFamilyData(oldFormatMembers, restrictions, avoidedIngredients, customApiKey || undefined, customProvider || undefined)
      router.push("/")
    } catch (error) {
      console.error("Error saving family data:", error)
      router.push("/")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header */}
      <header className="px-4 py-4 flex items-center bg-white">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold flex-1 text-center mr-10">Mis gustos</h1>
      </header>

      {/* Progress Dots */}
      <div className="flex justify-center items-center gap-2 py-4 bg-white">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`rounded-full transition-all ${
              step === currentStep
                ? "w-8 h-2 bg-primary"
                : "w-2 h-2 bg-primary/30"
            }`}
          />
        ))}
      </div>

      {/* Body */}
      <main className="flex-1 px-4 pt-6 overflow-auto pb-40 bg-surface">
        {/* Family Members Section */}
        <section className="mb-8">
          <h3 className="text-lg font-bold mb-4 text-foreground">Quiénes comen en casa</h3>
          <div className="space-y-3">
            {familyMembers.map((member) => {
              const Icon = member.icon
              return (
                <Card
                  key={member.id}
                  className="flex items-center justify-between rounded-2xl p-4 border-0 bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{getMemberLabel(member.type)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full text-muted-foreground hover:bg-muted"
                      onClick={() => updateMemberCount(member.id, false)}
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <span className="w-8 text-center font-semibold text-lg text-foreground">
                      {member.count}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full bg-primary text-white hover:bg-primary/90"
                      onClick={() => updateMemberCount(member.id, true)}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Diet Options Section */}
        <section className="mb-8">
          <h3 className="text-lg font-bold mb-4 text-foreground">¿Alguna alergia o dieta especial?</h3>
          <div className="grid grid-cols-2 gap-3">
            {dietOptions.map((option) => {
              const Icon = option.icon
              return (
                <Card
                  key={option.id}
                  onClick={() => toggleDietOption(option.id)}
                  className={`relative p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                    option.selected
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-white hover:bg-muted/50"
                  }`}
                >
                  {option.selected && (
                    <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col items-center py-2">
                    <Icon className={`h-8 w-8 mb-2 ${option.selected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${option.selected ? "text-primary" : "text-foreground"}`}>
                      {option.name}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Avoided Ingredients Section */}
        <section className="mb-8">
          <h3 className="text-lg font-bold mb-4 text-foreground">¿Qué ingredientes evitamos?</h3>
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Escribe aquí, ej. Cebolla..."
              value={ingredientSearch}
              onChange={(e) => setIngredientSearch(e.target.value)}
              onKeyDown={addIngredient}
              className="h-14 pl-12 rounded-2xl bg-white border-0"
            />
          </div>
          {avoidedIngredients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {avoidedIngredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1.5"
                >
                  <span className="text-sm font-medium">{ingredient}</span>
                  <button
                    onClick={() => removeIngredient(ingredient)}
                    className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-primary/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-16 left-0 right-0 p-4 bg-surface">
        <Button
          className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold text-base"
          onClick={handleSaveAndContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              Guardar y continuar
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </footer>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
