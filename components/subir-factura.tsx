"use client"

import type React from "react"
import { useState } from "react"
import NextImage from "next/image"
import { ArrowLeft, Camera, Image as ImageIcon, X, Sparkles, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { processReceipt } from "@/app/actions"
import { getCustomApiKey, getProviderToUse } from "@/lib/auth"
import { BottomNavigation } from "./bottom-navigation"

export function SubirFactura() {
  const [step, setStep] = useState<"upload" | "processing">("upload")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setPreview(null)
    setError(null)
  }

  const handleSubmit = async () => {
    if (file && preview) {
      setStep("processing")
      setError(null)

      try {
        // Get custom API key if user is using BYOK
        const customApiKey = getCustomApiKey()
        const customProvider = getProviderToUse()

        const result = await processReceipt(preview, customApiKey || undefined, customProvider || undefined)

        if (result.success) {
          router.push("/validar-datos")
        } else {
          setError(result.error || "Error al procesar la factura")
          setStep("upload")
        }
      } catch (error) {
        console.error("Error processing receipt:", error)
        setError("La imagen parece estar borrosa o mal iluminada. Por favor, intenta subir una foto más clara.")
        setStep("upload")
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header */}
      <header className="px-4 py-4 flex items-center bg-white">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold ml-1">Nueva factura</h1>
      </header>

      {/* Body */}
      <main className="flex-1 px-4 py-6 pb-24">
        {step === "upload" ? (
          <>
            {/* Description */}
            <p className="text-center text-muted-foreground mb-6">
              Sube una foto de tu recibo de compra para registrar tus alimentos automáticamente y evitar desperdicios.
            </p>

            {/* Upload Area */}
            {!preview ? (
              <Card className="border-2 border-dashed border-primary/30 rounded-2xl p-8 bg-white mb-4">
                <div className="flex flex-col items-center justify-center">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <div className="relative">
                      <ImageIcon className="h-8 w-8 text-primary" />
                      <Camera className="h-4 w-4 text-primary absolute -bottom-1 -right-1" />
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Sube tu factura</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Arrastra tu imagen aquí o selecciónala de tu galería
                  </p>
                  <input
                    type="file"
                    id="receipt"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="receipt">
                    <Button variant="outline" className="rounded-full" asChild>
                      <span>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Seleccionar imagen
                      </span>
                    </Button>
                  </label>
                </div>
              </Card>
            ) : (
              <Card className="rounded-2xl overflow-hidden mb-4 relative bg-white">
                <button
                  onClick={handleRemoveFile}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center z-10"
                  aria-label="Quitar imagen seleccionada"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
                <div className="aspect-[3/4] relative">
                  <NextImage
                    src={preview}
                    alt="Vista previa de la factura seleccionada"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-3 bg-surface flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate">
                    {file?.name || "recibo.jpg"}
                  </span>
                </div>
              </Card>
            )}

            {/* Process Button */}
            {preview && (
              <Button
                onClick={handleSubmit}
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Procesar factura
              </Button>
            )}

            {/* Error Message */}
            {error && (
              <Card className="mt-4 p-4 rounded-2xl bg-destructive/10 border-0">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="font-semibold text-destructive text-sm mb-1">No pudimos leer la factura</p>
                    <p className="text-sm text-destructive/80">{error}</p>
                    <button
                      onClick={handleRemoveFile}
                      className="text-primary text-sm font-medium mt-2"
                    >
                      Intentar nuevamente
                    </button>
                  </div>
                </div>
              </Card>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Card className="p-6 rounded-2xl bg-white text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Procesando con IA...</h3>
              <p className="text-sm text-muted-foreground">
                Identificando alimentos y fechas...
              </p>
              <div className="w-full h-2 bg-surface rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
