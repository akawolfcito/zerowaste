"use server"

import {
  saveFamilyMembers,
  saveDietaryRestrictions,
  saveProhibitedDishes,
  saveProducts,
  saveLeftovers,
  saveWeeklyMenu,
  saveMetrics,
  saveRecommendations,
  getFamilyMembers,
  getDietaryRestrictions,
  getProhibitedDishes,
  getProducts,
  getLeftovers,
  getWeeklyMenu,
  saveShoppingList,
  getShoppingList,
  updateShoppingItemStatus,
  validateAccessCode as dbValidateAccessCode,
  incrementCodeUsage,
} from "@/services/supabase-service"

import {
  processReceiptImageLegacy as processReceiptImage,
  processFamilyData,
  processLeftovers,
  generateWeeklyMenu,
  generateMetrics,
  type AIProviderName,
} from "@/lib/openai"

// Logger utility
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data ? data : '')
  },
  error: (message: string, error: any) => {
    console.error(`[ERROR] ${message}`, error)
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data ? data : '')
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data ? data : '')
    }
  }
}

// Acción para guardar datos de onboarding familiar
export async function saveFamilyData(
  familyMembers: any[],
  restrictions: any[],
  prohibitedDishes: string[],
  customApiKey?: string,
  customProvider?: AIProviderName
) {
  try {
    logger.info('Starting family data save process', {
      familyMembersCount: familyMembers.length,
      restrictionsCount: restrictions.length,
      prohibitedDishesCount: prohibitedDishes.length
    })

    await saveFamilyMembers(familyMembers)
    await saveDietaryRestrictions(restrictions)
    await saveProhibitedDishes(prohibitedDishes)

    logger.debug('Saved family data to database, processing with AI')

    // Procesar datos con IA para obtener recomendaciones
    const aiResponse = await processFamilyData(familyMembers, restrictions, prohibitedDishes, customApiKey, customProvider)

    // Guardar recomendaciones
    if (aiResponse.recommendations && aiResponse.recommendations.length > 0) {
      logger.info('Saving AI recommendations', { count: aiResponse.recommendations.length })
      await saveRecommendations(aiResponse.recommendations)
    }

    logger.info('Family data save process completed successfully')
    return { success: true }
  } catch (error) {
    logger.error('Error in saveFamilyData', error)
    return { success: false, error }
  }
}

// Acción para procesar imagen de factura
export async function processReceipt(imageBase64: string, customApiKey?: string, customProvider?: AIProviderName) {
  try {
    logger.info('Starting receipt processing')

    // Procesar imagen con IA
    const aiResponse = await processReceiptImage(imageBase64, customApiKey, customProvider)

    // Verificar si la respuesta tiene productos
    if (!aiResponse || !aiResponse.products) {
      logger.error('Invalid AI response', aiResponse)
      return { success: false, error: "Invalid AI response" }
    }

    // Guardar productos extraídos
    if (aiResponse.products.length > 0) {
      logger.info('Saving extracted products', { count: aiResponse.products.length })
      await saveProducts(aiResponse.products)
      return { success: true, products: aiResponse.products }
    } else {
      logger.warn('No products found in receipt')
      return { success: false, error: "No products found in the receipt" }
    }
  } catch (error) {
    logger.error('Error in processReceipt', error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Acción para guardar productos validados
export async function saveValidatedProducts(products: any[]) {
  try {
    logger.info('Saving validated products', { count: products.length })
    await saveProducts(products)
    return { success: true }
  } catch (error) {
    logger.error('Error in saveValidatedProducts', error)
    return { success: false, error }
  }
}

// Acción para guardar categorías de productos
export async function saveProductCategories(products: any[]) {
  try {
    logger.info('Saving product categories', { count: products.length })
    await saveProducts(products)
    return { success: true }
  } catch (error) {
    logger.error('Error in saveProductCategories', error)
    return { success: false, error }
  }
}

// Acción para guardar sobrantes
export async function saveLeftoversData(leftovers: any[], customApiKey?: string, customProvider?: AIProviderName) {
  try {
    logger.info('Starting leftovers save process', { count: leftovers.length })
    await saveLeftovers(leftovers)

    logger.debug('Saved leftovers to database, processing with AI')

    // Procesar sobrantes con IA para obtener recomendaciones
    const aiResponse = await processLeftovers(leftovers, customApiKey, customProvider)

    // Guardar recomendaciones
    if (aiResponse.recommendations && aiResponse.recommendations.length > 0) {
      logger.info('Saving AI recommendations', { count: aiResponse.recommendations.length })
      await saveRecommendations(aiResponse.recommendations)
    }

    logger.info('Leftovers save process completed successfully')
    return { success: true }
  } catch (error) {
    logger.error('Error in saveLeftoversData', error)
    return { success: false, error }
  }
}

// Acción para generar menú semanal
export async function generateMenu(customApiKey?: string, customProvider?: AIProviderName) {
  try {
    logger.info('Starting weekly menu generation')

    // Obtener datos necesarios
    const familyMembers = await getFamilyMembers()
    const restrictions = await getDietaryRestrictions()
    const prohibitedDishes = await getProhibitedDishes()
    const products = await getProducts()

    logger.debug('Retrieved data for menu generation', {
      familyMembersCount: familyMembers.length,
      restrictionsCount: restrictions.length,
      productsCount: products.length
    })

    // Generar menú con IA
    const aiResponse = await generateWeeklyMenu(
      familyMembers,
      restrictions,
      prohibitedDishes.map((dish) => dish.name),
      products,
      customApiKey,
      customProvider
    )

    // Guardar menú generado
    if (aiResponse.weeklyMenu && aiResponse.weeklyMenu.length > 0) {
      logger.info('Saving generated menu', { count: aiResponse.weeklyMenu.length })
      await saveWeeklyMenu(aiResponse.weeklyMenu)
    }

    logger.info('Menu generation completed successfully')
    return { success: true, weeklyMenu: aiResponse.weeklyMenu }
  } catch (error) {
    logger.error('Error in generateMenu', error)
    return { success: false, error }
  }
}

// Acción para generar métricas
export async function generateMetricsData(customApiKey?: string, customProvider?: AIProviderName) {
  try {
    logger.info('Starting metrics generation')

    // Obtener datos necesarios
    const familyMembers = await getFamilyMembers()
    const products = await getProducts()
    const leftovers = await getLeftovers()

    logger.debug('Retrieved data for metrics generation', {
      familyMembersCount: familyMembers.length,
      productsCount: products.length,
      leftoversCount: leftovers.length
    })

    // Generar métricas con IA
    const aiResponse = await generateMetrics(familyMembers, products, leftovers, customApiKey, customProvider)

    // Guardar métricas y recomendaciones
    if (aiResponse.metrics) {
      logger.info('Saving generated metrics')
      await saveMetrics(aiResponse.metrics)
    }

    if (aiResponse.recommendations && aiResponse.recommendations.length > 0) {
      logger.info('Saving AI recommendations', { count: aiResponse.recommendations.length })
      await saveRecommendations(aiResponse.recommendations)
    }

    logger.info('Metrics generation completed successfully')
    return {
      success: true,
      metrics: aiResponse.metrics,
      recommendations: aiResponse.recommendations,
    }
  } catch (error) {
    logger.error('Error in generateMetricsData', error)
    return { success: false, error }
  }
}

// Función para categorizar ingredientes automáticamente
function categorizeIngredient(ingredientName: string): string {
  const name = ingredientName.toLowerCase()

  // Proteínas
  if (name.includes('pollo') || name.includes('pechuga') || name.includes('carne') ||
      name.includes('res') || name.includes('cerdo') || name.includes('pescado') ||
      name.includes('salmón') || name.includes('atún') || name.includes('camarón')) {
    return 'Proteína'
  }

  // Verduras
  if (name.includes('tomate') || name.includes('lechuga') || name.includes('cebolla') ||
      name.includes('zanahoria') || name.includes('papa') || name.includes('brócoli') ||
      name.includes('espinaca') || name.includes('calabaza') || name.includes('pimiento') ||
      name.includes('aguacate') || name.includes('pepino')) {
    return 'Verduras'
  }

  // Lácteos
  if (name.includes('leche') || name.includes('queso') || name.includes('yogurt') ||
      name.includes('crema') || name.includes('mantequilla')) {
    return 'Lácteos'
  }

  // Huevos
  if (name.includes('huevo')) {
    return 'Huevos'
  }

  // Granos y cereales
  if (name.includes('arroz') || name.includes('pasta') || name.includes('pan') ||
      name.includes('harina') || name.includes('avena') || name.includes('cereal')) {
    return 'Granos'
  }

  // Frutas
  if (name.includes('manzana') || name.includes('plátano') || name.includes('naranja') ||
      name.includes('fresa') || name.includes('uva') || name.includes('limón')) {
    return 'Frutas'
  }

  // Default
  return 'Otros'
}

// Acción para generar lista de compras desde el menú semanal
export async function generateShoppingList() {
  try {
    logger.info('Starting shopping list generation')

    // Obtener menú semanal
    const weeklyMenu = await getWeeklyMenu()

    if (!weeklyMenu || weeklyMenu.length === 0) {
      logger.warn('No weekly menu found')
      return { success: false, error: 'No hay menú semanal disponible' }
    }

    logger.debug('Retrieved weekly menu', { daysCount: weeklyMenu.length })

    // Extraer todos los ingredientes de todas las recetas
    const allIngredients: any[] = []

    for (const day of weeklyMenu) {
      try {
        // Parsear el JSON de la receta
        const recipe = typeof day.recipe === 'string' ? JSON.parse(day.recipe) : day.recipe

        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
          recipe.ingredients.forEach((ingredient: any) => {
            allIngredients.push({
              name: ingredient.name,
              quantity: ingredient.quantity || '1',
              unit: ingredient.unit || '',
              category: categorizeIngredient(ingredient.name)
            })
          })
        }
      } catch (parseError) {
        logger.warn('Error parsing recipe for day', { day: day.day, error: parseError })
      }
    }

    logger.info('Extracted ingredients', { count: allIngredients.length })

    if (allIngredients.length === 0) {
      logger.warn('No ingredients found in menu')
      return { success: false, error: 'No se encontraron ingredientes en el menú' }
    }

    // Consolidar ingredientes duplicados (misma categoría y nombre)
    const consolidatedIngredients = allIngredients.reduce((acc: any[], current) => {
      const existing = acc.find(item =>
        item.name.toLowerCase() === current.name.toLowerCase() &&
        item.category === current.category
      )

      if (!existing) {
        acc.push(current)
      }
      // Si ya existe, podrías sumar cantidades aquí si lo deseas
      // Por ahora solo mantenemos la primera ocurrencia

      return acc
    }, [])

    logger.info('Consolidated ingredients', { count: consolidatedIngredients.length })

    // Guardar en base de datos
    await saveShoppingList(consolidatedIngredients)

    logger.info('Shopping list generation completed successfully')
    return { success: true, count: consolidatedIngredients.length }
  } catch (error) {
    logger.error('Error in generateShoppingList', error)
    return { success: false, error }
  }
}

// Acción para actualizar estado de un item de la lista
export async function updateShoppingItem(itemId: string, isPurchased: boolean) {
  try {
    await updateShoppingItemStatus(itemId, isPurchased)
    return { success: true }
  } catch (error) {
    logger.error('Error updating shopping item', error)
    return { success: false, error }
  }
}

// Acción para validar código de acceso
export async function validateAccessCode(code: string) {
  try {
    logger.info('Validating access code')

    const result = await dbValidateAccessCode(code)

    if (result.is_valid && result.code_id) {
      // Incrementar contador de usos
      await incrementCodeUsage(result.code_id)
      logger.info('Access code validated successfully', { code_id: result.code_id })
    }

    return {
      success: result.is_valid,
      message: result.message,
      codeId: result.code_id
    }
  } catch (error) {
    logger.error('Error validating access code', error)
    return {
      success: false,
      message: 'Error al validar el código'
    }
  }
}
