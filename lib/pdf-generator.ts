import jsPDF from 'jspdf'

type ShoppingItem = {
  name: string
  quantity: string
  checked: boolean
}

type Category = {
  name: string
  items: ShoppingItem[]
}

type RgbColor = [number, number, number]

export function generateShoppingListPDF(categories: Category[]) {
  // Crear nuevo documento PDF (A4)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Configuración de colores
  const primaryColor: RgbColor = [248, 103, 46] // Naranja #F8672E
  const secondaryColor: RgbColor = [45, 190, 126] // Verde #2DBE7E
  const textColor: RgbColor = [17, 24, 39] // Casi negro #111827
  const mutedColor: RgbColor = [75, 85, 99] // Gris #4B5563
  const backgroundColor: RgbColor = [247, 248, 250] // Surface #F7F8FA

  let yPosition = 20

  // Header con logo/título
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Zerowaste', 15, 18)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Lista de Compras', 15, 26)

  // Fecha
  const today = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  doc.setFontSize(10)
  doc.text(today, 210 - 15, 18, { align: 'right' })

  yPosition = 45

  // Contar totales
  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0)
  const checkedItems = categories.reduce(
    (sum, cat) => sum + cat.items.filter(item => item.checked).length,
    0
  )

  // Resumen
  doc.setFillColor(...backgroundColor)
  doc.roundedRect(15, yPosition, 180, 15, 3, 3, 'F')

  doc.setTextColor(...textColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total de items: ${totalItems}`, 20, yPosition + 6)
  doc.text(`Comprados: ${checkedItems}`, 20, yPosition + 11)
  doc.text(`Pendientes: ${totalItems - checkedItems}`, 100, yPosition + 6)
  doc.text(`Progreso: ${totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0}%`, 100, yPosition + 11)

  yPosition += 25

  // Iterar por categorías
  categories.forEach((category, categoryIndex) => {
    // Verificar si necesitamos una nueva página
    if (yPosition > 260) {
      doc.addPage()
      yPosition = 20
    }

    // Título de categoría
    doc.setFillColor(...secondaryColor)
    doc.roundedRect(15, yPosition, 180, 10, 2, 2, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(category.name, 20, yPosition + 7)

    doc.setTextColor(...mutedColor)
    doc.setFontSize(9)
    doc.text(`(${category.items.length} items)`, 210 - 20, yPosition + 7, { align: 'right' })

    yPosition += 15

    // Items de la categoría
    category.items.forEach((item, itemIndex) => {
      // Verificar si necesitamos una nueva página
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }

      // Checkbox
      const checkboxSize = 4
      doc.setDrawColor(...mutedColor)
      doc.setLineWidth(0.3)
      doc.rect(18, yPosition - 3, checkboxSize, checkboxSize)

      // Si está marcado, dibujar check
      if (item.checked) {
        doc.setDrawColor(...secondaryColor)
        doc.setLineWidth(0.8)
        doc.line(18.5, yPosition - 1, 19.5, yPosition)
        doc.line(19.5, yPosition, 21.5, yPosition - 2.5)
      }

      // Nombre del item
      doc.setTextColor(...textColor)
      doc.setFontSize(10)
      doc.setFont('helvetica', item.checked ? 'normal' : 'normal')

      if (item.checked) {
        doc.setTextColor(...mutedColor)
      }

      doc.text(item.name, 27, yPosition)

      // Cantidad
      doc.setTextColor(...mutedColor)
      doc.setFontSize(9)
      doc.text(item.quantity, 210 - 20, yPosition, { align: 'right' })

      // Línea divisoria (excepto último item)
      if (itemIndex < category.items.length - 1) {
        doc.setDrawColor(230, 232, 236) // Border color
        doc.setLineWidth(0.1)
        doc.line(27, yPosition + 2, 190, yPosition + 2)
      }

      yPosition += 7
    })

    yPosition += 5
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  doc.setFontSize(8)
  doc.setTextColor(...mutedColor)

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Página ${i} de ${pageCount} - Generado con Zerowaste`,
      210 / 2,
      290,
      { align: 'center' }
    )
  }

  // Guardar el PDF
  const fileName = `lista-compras-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}
