import { describe, expect, it, vi } from 'vitest'
import { clientLog, logApiFailure } from '@/lib/logger'

describe('client logger', () => {
  it('logs without throwing', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      clientLog({
        level: 'error',
        message: 'test',
        context: 'unit',
        path: '/api/test',
        status: 500,
        detail: { a: 1 },
      })
    ).not.toThrow()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('logApiFailure uses warn for 4xx', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logApiFailure('/api/x', 404, 'nope')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
