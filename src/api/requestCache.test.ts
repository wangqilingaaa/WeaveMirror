import { describe, expect, it, vi } from 'vitest'
import { createCachedRequest } from './requestCache'

describe('createCachedRequest', () => {
  it('应在缓存有效期内复用已完成结果，避免重复请求', async () => {
    const factory = vi.fn(async (id: number) => ({ id, value: `result-${id}` }))
    const request = createCachedRequest(factory, {
      getKey: (id) => `detail:${id}`,
      ttlMs: 1000
    })

    const first = await request(1)
    const second = await request(1)

    expect(first).toEqual({ id: 1, value: 'result-1' })
    expect(second).toEqual(first)
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it('应对并发中的相同请求做去重，只触发一次底层工厂', async () => {
    const factory = vi.fn(
      async (id: number) =>
        new Promise<{ id: number }>((resolve) => {
          setTimeout(() => resolve({ id }), 10)
        })
    )

    const request = createCachedRequest(factory, {
      getKey: (id) => `detail:${id}`,
      ttlMs: 1000
    })

    const [first, second] = await Promise.all([request(2), request(2)])

    expect(first).toEqual({ id: 2 })
    expect(second).toEqual({ id: 2 })
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it('应在手动失效后重新触发请求，确保写操作后不会继续读取旧缓存', async () => {
    const factory = vi
      .fn<(...args: [number]) => Promise<{ version: number }>>()
      .mockResolvedValueOnce({ version: 1 })
      .mockResolvedValueOnce({ version: 2 })

    const request = createCachedRequest(factory, {
      getKey: (id) => `detail:${id}`,
      ttlMs: 1000
    })

    const beforeInvalidate = await request(3)
    request.invalidate((key) => key === 'detail:3')
    const afterInvalidate = await request(3)

    expect(beforeInvalidate).toEqual({ version: 1 })
    expect(afterInvalidate).toEqual({ version: 2 })
    expect(factory).toHaveBeenCalledTimes(2)
  })
})
