# Zerowaste - Tu Chefcito Inteligente

<div align="center">

**Planifica comidas, reduce desperdicios, ahorra dinero**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-orange?style=flat-square)](LICENSE)

</div>

---

## ¿Qué es Zerowaste?

**Zerowaste** es una aplicación móvil-first impulsada por inteligencia artificial que revoluciona la forma en que las familias planifican sus comidas. Genera menús personalizados basados en preferencias familiares, restricciones dietéticas y productos disponibles, ayudándote a:

- **Planificar comidas en segundos** - La IA genera menús semanales completos
- **Aprovechar lo que ya tienes** - El menú se arma sobre los productos de tu despensa
- **Reutilizar sobrantes** - Registra lo que sobró y recibe sugerencias para reusarlo
- **Comer más variado** - Descubre nuevas recetas adaptadas a tu familia

> El objetivo del producto es reducir desperdicio y gasto. La app estima ahorro a partir
> de los datos que tú cargas; el proyecto todavía **no** tiene mediciones de impacto
> validadas con usuarios reales, así que no publicamos porcentajes.

---

## Estado del proyecto

**Versión actual: [v0.2.0](https://github.com/akawolfcito/zerowaste/releases/tag/v0.2.0) — MVP funcional, sin despliegue público activo.**

| Aspecto | Estado |
|---|---|
| Funcionalidad core | ✅ Completa y usable de punta a punta (ver Características) |
| Build / lint / typecheck | ✅ En verde (16 rutas compilan) |
| Suite de tests | ❌ No existe todavía |
| Despliegue público | ⚠️ Ninguno activo — ver [Despliegue](#despliegue) |
| Multi-usuario / multi-tenant | ❌ No implementado — ver [Limitaciones conocidas](#limitaciones-conocidas) |

Es un proyecto en desarrollo activo mantenido por una sola persona. Se ejecuta bien en
local siguiendo la [Instalación](#instalación).

---

## Características Principales

### Planificación Inteligente con IA
Genera menús semanales completos en segundos considerando las preferencias de tu familia, restricciones alimentarias y productos disponibles en tu despensa.

![Menú Semanal](img/menú_semanal.png)

### Configuración Familiar Personalizada
Define quién come en casa, restricciones dietéticas (vegetariano, sin gluten, vegano, etc.) e ingredientes a evitar para recibir recomendaciones 100% personalizadas.

![Mis Gustos](img/_mis_gustos.png)

### Escaneo de Facturas con OCR
Toma una foto de tu ticket del supermercado y la IA extrae automáticamente todos los productos, cantidades y precios usando un modelo con visión (OpenAI, Gemini u OpenRouter con modelo multimodal). DeepSeek no soporta visión y la app lo indica explícitamente.

<div align="center">
  <img src="img/subir_factura.png" width="30%" />
  <img src="img/validar_datos_de_factura.png" width="30%" />
  <img src="img/categorizar_productos.png" width="30%" />
</div>

### Recetas Detalladas Paso a Paso
Cada receta incluye ingredientes, pasos numerados, tiempos de cocción, nivel de dificultad y valor nutricional.

![Detalle de Receta](img/detalle_de_receta.png)

### Gestión de Sobrantes
Registra comida sobrante y recibe sugerencias inteligentes de la IA para reutilizarla, reduciendo el desperdicio alimentario.

![Registro de Sobrantes](img/registro_de_sobrantes.png)

### Lista de Compras Automática
Genera listas de compras organizadas por categorías directamente desde tu menú semanal.

![Lista de Compras](img/lista_de_compras.png)

### Métricas y Ahorro
Visualiza tu progreso con métricas de desperdicio, ahorro estimado y recomendaciones personalizadas para mejorar.

![Métricas y Ahorro](img/métricas_y_ahorro.png)

---

## Tech Stack

Zerowaste está construido con tecnologías modernas de vanguardia:

### Frontend
- **Next.js 16.2** - Framework React con App Router
- **React 19** - Última versión con React Server Components
- **TypeScript** - Tipado estático para mayor robustez
- **Tailwind CSS** - Estilos utility-first
- **Shadcn/ui** - Componentes UI basados en Radix

### Backend & AI
- **Supabase** - PostgreSQL con Row Level Security
- **Vercel AI SDK** - Capa única sobre 4 proveedores de IA
- **OpenAI / Google Gemini / OpenRouter / DeepSeek** - Generación de menús y análisis de imágenes. OpenRouter y DeepSeek reutilizan la superficie compatible con OpenAI mediante `baseURL` propio, sin dependencias extra
- **Server Actions** - API serverless nativa de Next.js

### Herramientas
- **pnpm** - Gestor de paquetes eficiente
- **react-hook-form + zod** - Validación de formularios
- **Recharts** - Visualización de datos

---

## Instalación

### Requisitos Previos

- Node.js 20.9+
- pnpm 9+
- Cuenta de Supabase
- API Key de OpenAI o Gemini

### Configuración

1. **Clona el repositorio**
```bash
git clone https://github.com/akawolfcito/zerowaste.git
cd zerowaste
```

2. **Instala dependencias**
```bash
pnpm install
```

3. **Configura variables de entorno**

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase
SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# AI Provider
AI_PROVIDER=gemini # openai | gemini | openrouter | deepseek
GEMINI_MODEL=gemini-2.5-flash
OPENAI_MODEL=gpt-4o
OPENROUTER_MODEL=anthropic/claude-sonnet-4.5
DEEPSEEK_MODEL=deepseek-chat
```

Además, define la clave del proveedor elegido en tu entorno local:
- Para OpenAI: variable `OPENAI_API_KEY`
- Para Gemini: variable `GEMINI_API_KEY`
- Para OpenRouter: variable `OPENROUTER_API_KEY` (acceso unificado a Claude, Llama, GPT, Gemini, etc.)
- Para DeepSeek: variable `DEEPSEEK_API_KEY` (no soporta análisis de imágenes/facturas)

4. **Inicializa la base de datos**
```bash
pnpm db:setup
```

5. **Inicia el servidor de desarrollo**
```bash
pnpm dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

---

## Uso

### Comandos Disponibles

```bash
pnpm dev          # Inicia servidor de desarrollo
pnpm build        # Genera build de producción
pnpm start        # Inicia servidor de producción
pnpm lint         # Ejecuta ESLint
pnpm typecheck    # Ejecuta validación de TypeScript
pnpm db:setup     # Inicializa esquema de base de datos
```

### Flujo de Usuario Básico

1. **Primera vez**: Configura tu familia en "Mis Gustos"
2. **Genera tu menú**: Usa la barra de búsqueda para generar un menú semanal
3. **Explora recetas**: Navega por los 7 días y descubre las recetas
4. **Crea tu lista**: Genera automáticamente tu lista de compras
5. **Escanea facturas**: Sube tickets para mantener tu inventario actualizado
6. **Registra sobrantes**: Obtén sugerencias de reutilización

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│       Next.js 16 + React 19 + TypeScript + Tailwind         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVER ACTIONS                          │
│                   app/actions.ts                            │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼                               ▼
┌─────────────────────────┐   ┌─────────────────────────────┐
│      AI SERVICES        │   │      DATABASE SERVICES       │
│   lib/openai.ts         │   │   services/supabase-service  │
│   - Vercel AI SDK       │   │   - PostgreSQL               │
│   - Registro de 4       │   │   - RLS Policies             │
│     proveedores         │   │   - withTransaction<T>()     │
│   - Texto + visión      │   │                              │
└─────────────────────────┘   └─────────────────────────────┘
```

### Cómo se resuelve el proveedor de IA

`lib/openai.ts` expone un registro (`PROVIDERS`) con, por cada proveedor: etiqueta,
variables de entorno donde buscar la key, `baseURL`, modelo por defecto y si soporta
visión. En cada llamada:

1. `normalizeProvider()` decide el proveedor — el que envía el cliente (BYOK) o `AI_PROVIDER`.
2. `getProviderApiKey()` toma la key del cliente si existe, si no la del entorno.
3. `getAIModel()` construye el modelo: `createGoogleGenerativeAI` para Gemini,
   `createOpenAI` (con `baseURL` propio) para OpenAI, OpenRouter y DeepSeek.
4. Las funciones de visión verifican `providerSupportsVision()` antes de enviar la imagen
   y fallan con un mensaje claro si el proveedor no la soporta.

Esto significa que **agregar un proveedor compatible con OpenAI es una entrada nueva en
`PROVIDERS`**, sin tocar el resto del código.

### Estructura del Proyecto

```
zerowaste/
├── app/
│   ├── actions.ts              # Server Actions - todas las mutaciones
│   ├── api/generate/           # Endpoint de generación de IA
│   └── (routes)/              # Rutas de páginas
├── components/
│   ├── ui/                    # Componentes Shadcn/ui
│   ├── welcome-screen.tsx     # Pantalla de inicio
│   ├── menu-semanal.tsx       # Menú semanal
│   └── detalle-receta.tsx     # Vista de receta
├── lib/
│   ├── openai.ts              # Funciones de IA
│   ├── supabase.ts            # Clientes de Supabase
│   └── utils.ts               # Utilidades
└── services/
    └── supabase-service.ts     # Operaciones CRUD
```

---

## Roadmap

### Fase 1: MVP — completada (v0.2.0)
- [x] Onboarding familiar
- [x] Generación de menú con IA
- [x] Vista de menú semanal
- [x] Detalle de receta
- [x] Procesamiento de facturas
- [x] Registro de sobrantes
- [x] Lista de compras funcional
- [x] Descarga PDF de lista de compras
- [x] Métricas de desperdicio y ahorro con recomendaciones
- [x] Control de acceso: código de acceso o BYOK
- [x] Soporte multi-proveedor de IA (OpenAI, Gemini, OpenRouter, DeepSeek)

### Fase 2: Robustez — siguiente
- [ ] Suite de tests (hoy no existe ninguna)
- [ ] Rate limiting en `/api/generate`
- [ ] Cifrado real de las keys BYOK (hoy solo base64 en localStorage)
- [ ] Deduplicar `menu.tsx` vs `menu-semanal.tsx` y podar rutas inalcanzables
- [ ] Manejo explícito de fallos en `parseJsonResponse`
- [ ] Autenticación multi-usuario real (hoy el acceso es un portón, no una identidad)

### Fase 3: Producto
- [ ] Sistema de favoritos
- [ ] Historial de menús
- [ ] Compartir menú/recetas
- [ ] Notificaciones push

### Fase 4: Expansión
- [ ] Múltiples perfiles familiares
- [ ] Integración con supermercados
- [ ] Recetas de la comunidad
- [ ] Modo offline (PWA)
- [ ] Versión iOS/Android nativa

---

## Despliegue

**No hay ningún despliegue público activo en este momento.**

- El proyecto está configurado para Vercel (Next.js App Router, Server Actions,
  `/api/generate` como ruta dinámica). El build de producción pasa en verde.
- El dominio `zerowaste.lat` que aparecía en versiones anteriores de este README
  **ya no resuelve DNS** y fue retirado de los enlaces.
- El último despliegue de producción existente está protegido con autenticación de la
  plataforma, así que no es accesible públicamente.

Para levantarlo tú mismo, sigue [Instalación](#instalación) — corre en local sin problemas.
Cualquier plataforma que soporte Next.js 16 en Node 20.9+ sirve; no hay dependencias de
runtime propietario.

---

## Tests

**Este repositorio no tiene tests todavía.** No hay framework de testing instalado ni
archivos de test. Es la deuda técnica más importante y el primer punto de la Fase 2.

Lo que sí puedes correr para validar un cambio:

```bash
pnpm lint        # ESLint — actualmente sin issues
pnpm typecheck   # tsc --noEmit — actualmente en verde
pnpm build       # build de producción — 16 rutas, en verde
```

Además, `lib/openai.ts` expone una función `smokeTest()` que verifica conectividad y
generación contra el proveedor configurado.

---

## Limitaciones conocidas

Documentadas honestamente para que sepas qué esperar:

- **No es multi-usuario.** No hay identidad por usuario ni aislamiento de datos entre
  personas. El control de acceso es un portón compartido (código o BYOK), no un sistema de
  cuentas. Todos los datos viven en un espacio común.
- **Las keys BYOK se guardan en `localStorage` codificadas en base64**, que es ofuscación,
  no cifrado. Quien tenga acceso al navegador puede leerlas. Está marcado para arreglo.
- **`/api/generate` no tiene rate limiting.** Si expones una instancia públicamente con la
  key del proyecto, el consumo no está acotado.
- **Sin tests automatizados** (ver arriba).
- **Hay rutas duplicadas/heredadas** (`menu.tsx` vs `menu-semanal.tsx`) pendientes de podar.
- **La calidad de la extracción de tickets depende del proveedor y de la foto.** No hay
  garantía de exactitud en cantidades ni precios; por eso existe la pantalla de validación
  manual antes de guardar.
- **Las métricas de ahorro son estimaciones** calculadas sobre los datos que tú cargas, no
  mediciones auditadas.

---

## Consideraciones de seguridad

Supuestos bajo los que está construido el proyecto — léelos antes de exponerlo:

- **Los códigos de acceso controlan gasto, no identidad.** Un código válido habilita usar
  la API key de IA del proyecto. Si despliegas esto públicamente, trata los códigos como
  credenciales de facturación: rótalos, ponles límite de usos y expiración, y no los
  publiques.
- **Usa RLS en Supabase.** El esquema está pensado con Row Level Security; no expongas la
  `SERVICE_ROLE_KEY` fuera del servidor.
- **Las keys BYOK nunca se envían al backend del proyecto** — van directo al proveedor
  elegido desde el cliente. Pero se almacenan en el navegador solo ofuscadas (ver
  Limitaciones).
- **Los logs del servidor pasan por una función `redact()`** que elimina tokens con formato
  `sk-*` y `AIza*` antes de escribir.
- **No hay secretos en este repositorio.** La configuración sensible va por variables de
  entorno; los archivos de entorno están excluidos del control de versiones.

Si encuentras un problema de seguridad, abre un issue sin incluir detalles explotables o
contacta al mantenedor en privado.

---

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: amazing feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución

- Todo el código debe estar en TypeScript
- Sigue las convenciones de ESLint configuradas
- Escribe commits descriptivos en español
- Antes de abrir el PR, corre `pnpm lint`, `pnpm typecheck` y `pnpm build` — los tres deben quedar en verde
- Aún no hay infraestructura de tests; si quieres montarla, es la contribución más valiosa ahora mismo
- Actualiza la documentación cuando sea necesario

---

## Documentación Adicional

- [PRD - Product Requirements Document](docs/PRD.md)
- [Pantallas y Flujos de Usuario](docs/SCREENS-AND-FLOWS.md)
- [Guía de Claude Code](CLAUDE.md)

---

## Licencia

Este proyecto está bajo la Licencia Apache 2.0. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## Contacto y Soporte

- **Repositorio**: [github.com/akawolfcito/zerowaste](https://github.com/akawolfcito/zerowaste)
- **Issues**: [GitHub Issues](https://github.com/akawolfcito/zerowaste/issues)
- **Releases**: [Historial de versiones](https://github.com/akawolfcito/zerowaste/releases)

---

<div align="center">

**Hecho con ❤️ para reducir el desperdicio alimentario**

[Inicio](#zerowaste---tu-chefcito-inteligente) • [Características](#características-principales) • [Instalación](#instalación) • [Contribuir](#contribuir)

</div>
