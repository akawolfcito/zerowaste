/**
 * Revocación de códigos de acceso a nivel de aplicación.
 *
 * Contexto: los códigos sembrados por la migración inicial quedaron publicados
 * en el historial público de este repositorio. Un código de acceso válido
 * habilita consumir la API key de IA del proyecto, así que son, en la práctica,
 * credenciales de facturación.
 *
 * Esta capa los rechaza en el servidor ANTES de consultar la base de datos. La
 * revocación queda así en el código y no depende de:
 *   - el estado de la tabla `access_codes`,
 *   - que alguien recuerde correr el UPDATE de desactivación,
 *   - que un `pnpm db:setup` no los vuelva a sembrar.
 *
 * Se almacenan hashes SHA-256, no texto plano, para no reintroducir una copia
 * legible de los códigos en el HEAD del repositorio. Los códigos son de baja
 * entropía y ya son públicos, así que el hash no aporta secreto criptográfico:
 * su única función es evitar publicar de nuevo los valores en claro.
 *
 * Para revocar códigos adicionales sin tocar el código, define la variable de
 * entorno `REVOKED_ACCESS_CODES` con una lista separada por comas. Se hashean
 * en runtime y se suman a esta lista.
 */

/** Hashes SHA-256 de los códigos sembrados que quedaron expuestos. */
const REVOKED_CODE_HASHES: ReadonlySet<string> = new Set([
  '3ced2a6d267a485a50bc1da777d66f56a246de1eedfbc1e2aa28653c6827c877',
  'a2778bfee738c7fcd47b68c01746a512fa030e8780b0f3526f54b9816c0615e6',
  '4ff006ca6b88e752f08cb7881714505ceb3d2079eea432acfda8e158e0d1d82e',
])

/** Nombre de la variable de entorno con revocaciones adicionales. */
const EXTRA_REVOKED_VAR = 'REVOKED_ACCESS_CODES'

/**
 * Normaliza un código antes de compararlo. Debe coincidir con la normalización
 * usada para generar los hashes de arriba.
 */
export function normalizeAccessCode(code: string): string {
  return code.trim().toUpperCase()
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

let extraRevokedHashes: Promise<ReadonlySet<string>> | null = null

function loadExtraRevokedHashes(): Promise<ReadonlySet<string>> {
  if (!extraRevokedHashes) {
    extraRevokedHashes = (async () => {
      const raw = process.env[EXTRA_REVOKED_VAR]
      if (!raw) return new Set<string>()

      const codes = raw
        .split(',')
        .map((c) => normalizeAccessCode(c))
        .filter(Boolean)

      const hashes = await Promise.all(codes.map(sha256Hex))
      return new Set(hashes)
    })()
  }
  return extraRevokedHashes
}

/**
 * Indica si el código está revocado y por tanto debe rechazarse sin consultar
 * la base de datos.
 *
 * Fail-closed: si el hashing falla por cualquier motivo, se rechaza el código.
 */
export async function isRevokedAccessCode(code: string): Promise<boolean> {
  try {
    const hash = await sha256Hex(normalizeAccessCode(code))
    if (REVOKED_CODE_HASHES.has(hash)) return true

    const fromEnv = await loadExtraRevokedHashes()
    return fromEnv.has(hash)
  } catch {
    return true
  }
}
