type CachedPromiseFactory<TArgs extends unknown[], TResult> = (...args: TArgs) => Promise<TResult>

interface RequestCacheOptions<TArgs extends unknown[]> {
  /**
   * 请求缓存 key 的生成逻辑。
   * 这里显式要求调用方提供 key，是为了避免把“不稳定对象序列化”硬编码在工具内部，方便每个模块按自身参数结构控制粒度。
   */
  getKey: (...args: TArgs) => string
  /**
   * 缓存有效期，默认 3 秒。
   * 这个值刻意保持较短，只用于吸收页面切换、watch 重跑、并发触发造成的重复 GET，不承担长期离线缓存职责。
   */
  ttlMs?: number
}

interface CacheEntry<TResult> {
  data: TResult
  expiresAt: number
}

export interface CachedRequest<TArgs extends unknown[], TResult> {
  (...args: TArgs): Promise<TResult>
  invalidate: (predicate?: (key: string) => boolean) => void
}

/**
 * 为 GET 请求创建一个“短 TTL + 并发去重”的轻量缓存层。
 *
 * 解决的问题：
 * 1. 同一页面在 mounted / watch / 手动刷新阶段，容易短时间内重复触发同一请求。
 * 2. 多个页面或组件同时读取同一资源时，会产生完全等价的并发请求。
 * 3. 数据写入后如果没有显式失效，读取层又可能拿到旧结果，因此这里额外暴露 invalidate 供写操作调用。
 */
export function createCachedRequest<TArgs extends unknown[], TResult>(
  factory: CachedPromiseFactory<TArgs, TResult>,
  options: RequestCacheOptions<TArgs>
): CachedRequest<TArgs, TResult> {
  const ttlMs = options.ttlMs ?? 3000
  const cache = new Map<string, CacheEntry<TResult>>()
  const inFlightRequests = new Map<string, Promise<TResult>>()

  const cachedRequest = (async (...args: TArgs) => {
    const key = options.getKey(...args)
    const now = Date.now()
    const cachedEntry = cache.get(key)

    if (cachedEntry && cachedEntry.expiresAt > now) {
      return cachedEntry.data
    }

    const pendingRequest = inFlightRequests.get(key)
    if (pendingRequest) {
      return pendingRequest
    }

    const requestPromise = factory(...args)
      .then((result) => {
        cache.set(key, {
          data: result,
          expiresAt: Date.now() + ttlMs
        })
        return result
      })
      .finally(() => {
        inFlightRequests.delete(key)
      })

    inFlightRequests.set(key, requestPromise)
    return requestPromise
  }) as CachedRequest<TArgs, TResult>

  cachedRequest.invalidate = (predicate) => {
    if (!predicate) {
      cache.clear()
      inFlightRequests.clear()
      return
    }

    Array.from(cache.keys()).forEach((key) => {
      if (predicate(key)) {
        cache.delete(key)
      }
    })

    Array.from(inFlightRequests.keys()).forEach((key) => {
      if (predicate(key)) {
        inFlightRequests.delete(key)
      }
    })
  }

  return cachedRequest
}
