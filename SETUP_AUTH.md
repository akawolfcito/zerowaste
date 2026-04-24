# Configuración del Sistema de Autenticación

Este documento explica cómo configurar y usar el sistema de control de acceso de Zerowaste.

## 🔐 Sistema de Autenticación

Zerowaste implementa dos modos de autenticación para controlar el uso de la API de IA configurada:

### Modo 1: Código de Acceso
- Usuarios ingresan un código válido
- Usan la API key del proyecto (`AI_PROVIDER=openai` o `AI_PROVIDER=gemini`)
- Códigos controlados por base de datos
- Soporte para límites de uso y expiración

### Modo 2: BYOK (Bring Your Own Key)
- Usuarios proveen su propia API key de Gemini u OpenAI
- Key almacenada localmente en el navegador
- No consumen tokens del proyecto
- Control total sobre sus gastos de API

## 📋 Configuración Inicial

### 1. Ejecutar Migración de Base de Datos

```bash
# Opción A: Ejecutar script de setup (crea todas las tablas)
pnpm db:setup

# Opción B: Solo ejecutar migración de access codes
# Conectarse a Supabase y ejecutar el archivo:
# supabase/migrations/add_access_codes.sql
```

### 2. Códigos de Acceso Pre-configurados

La migración crea automáticamente estos códigos:

| Código | Descripción | Límite de Usos | Estado |
|--------|-------------|----------------|--------|
| `ZEROWASTE2026` | Código de lanzamiento | Ilimitado | Activo |
| `BETA100` | Código beta | 100 usos | Activo |
| `DEMO` | Código demo | 10 usos | Activo |

### 3. Crear Códigos Adicionales

Desde Supabase Studio o mediante SQL:

```sql
INSERT INTO access_codes (code, description, max_uses, is_active, expires_at)
VALUES
  ('CUSTOM_CODE', 'Descripción del código', 50, true, '2026-12-31'::timestamptz);
```

Parámetros:
- `code`: Código alfanumérico (único)
- `description`: Descripción del propósito
- `max_uses`: Límite de usos (NULL = ilimitado)
- `is_active`: true/false
- `expires_at`: Fecha de expiración (NULL = sin expiración)

## 🚀 Uso del Sistema

### Para Usuarios Finales

1. Accede a la aplicación → Redirige a `/auth`
2. Elige una opción:
   - **Código de Acceso**: Ingresa código proporcionado
   - **Mi API Key**: Selecciona Gemini u OpenAI e ingresa tu propia API key

### Códigos de Acceso
1. Clic en tab "Código de Acceso"
2. Ingresa el código (ejemplo: `ZEROWASTE2026`)
3. Sistema valida el código
4. Si es válido → acceso concedido

### BYOK (API Key Propia)
1. Clic en tab "Mi API Key"
2. Obtén tu API key desde [Google AI Studio](https://aistudio.google.com/app/apikey) o [platform.openai.com](https://platform.openai.com/api-keys)
3. Selecciona el proveedor correcto e ingresa la key
4. Key se guarda localmente en tu navegador
5. Todas las llamadas de AI usan tu key

## 🔧 Administración de Códigos

### Ver Uso de Códigos

```sql
-- Ver todos los códigos y su uso
SELECT
  code,
  description,
  current_uses,
  max_uses,
  is_active,
  expires_at,
  created_at
FROM access_codes
ORDER BY created_at DESC;

-- Ver historial de uso
SELECT
  ac.code,
  acu.used_at,
  acu.user_identifier
FROM access_code_usage acu
JOIN access_codes ac ON ac.id = acu.code_id
ORDER BY used_at DESC
LIMIT 100;
```

### Desactivar un Código

```sql
UPDATE access_codes
SET is_active = false
WHERE code = 'CODIGO_A_DESACTIVAR';
```

### Resetear Contador de Usos

```sql
UPDATE access_codes
SET current_uses = 0
WHERE code = 'CODIGO';
```

## 🔒 Seguridad

### Códigos de Acceso
- ✅ Validación server-side con Supabase
- ✅ Tracking de usos
- ✅ Límites configurables
- ✅ Expiración automática

### API Keys Personalizadas
- ✅ Almacenadas SOLO en cliente (localStorage)
- ✅ Codificadas en base64
- ✅ Nunca enviadas al backend del proyecto
- ✅ Usadas directamente con el proveedor seleccionado

## 📊 Monitoreo

### Métricas Importantes

1. **Códigos más usados**
```sql
SELECT code, current_uses, max_uses
FROM access_codes
WHERE is_active = true
ORDER BY current_uses DESC;
```

2. **Códigos por expirar**
```sql
SELECT code, expires_at
FROM access_codes
WHERE expires_at IS NOT NULL
  AND expires_at < NOW() + INTERVAL '7 days'
  AND is_active = true;
```

3. **Códigos cerca del límite**
```sql
SELECT code, current_uses, max_uses
FROM access_codes
WHERE max_uses IS NOT NULL
  AND current_uses >= (max_uses * 0.8)
  AND is_active = true;
```

## 🛠️ Troubleshooting

### "Código inválido"
- Verificar que el código existe en la BD
- Verificar que `is_active = true`
- Verificar que no ha expirado
- Verificar que no ha alcanzado `max_uses`

### "Error al validar el código"
- Verificar conexión a Supabase
- Verificar que la función `validate_access_code` existe
- Revisar logs del servidor

### API Key no funciona
- Verificar que comienza con `sk-`
- Verificar que la key es válida en Gemini u OpenAI
- Verificar que tiene créditos disponibles
- Revisar console del navegador para errores

## 📝 Notas Importantes

1. **Para Desarrollo**: Puedes usar el código `ZEROWASTE2026` (ilimitado)
2. **Para Producción**: Crear códigos específicos con límites
3. **Logs**: Todas las validaciones se loguean en el servidor
4. **localStorage**: Los datos de auth persisten entre sesiones

## 🔄 Cerrar Sesión

Para cerrar sesión y limpiar datos de autenticación:

```javascript
// Desde la consola del navegador
localStorage.removeItem('zerowaste_auth')
localStorage.removeItem('zerowaste_custom_api_key')
location.reload()
```

O implementar un botón de logout en la configuración.

---

**Última actualización**: Enero 2026
