/**
 * Lightweight structured client logging for API and UX failures.
 * Swap implementation for Sentry (captureException) later without changing call sites.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogPayload {
  level: LogLevel
  message: string
  context?: string
  path?: string
  status?: number
  detail?: unknown
}

function serializeDetail(detail: unknown): string | undefined {
  if (detail === undefined || detail === null) return undefined
  if (detail instanceof Error) return detail.message
  if (typeof detail === 'string') return detail
  try {
    return JSON.stringify(detail)
  } catch {
    return String(detail)
  }
}

export function clientLog(payload: LogPayload) {
  const { level, message, context, path, status, detail } = payload
  const line = {
    ts: new Date().toISOString(),
    level,
    message,
    context,
    path,
    status,
    detail: serializeDetail(detail),
  }
  const text = `[Mobile Cash Vault] ${JSON.stringify(line)}`
  switch (level) {
    case 'debug':
      console.debug(text)
      break
    case 'info':
      console.info(text)
      break
    case 'warn':
      console.warn(text)
      break
    case 'error':
      console.error(text)
      break
    default:
      console.log(text)
  }
}

export function logApiFailure(path: string, status: number, detail?: unknown) {
  clientLog({
    level: status >= 500 ? 'error' : 'warn',
    message: 'API request failed',
    context: 'api',
    path,
    status,
    detail,
  })
}
