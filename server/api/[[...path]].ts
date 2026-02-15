import { joinURL } from 'ufo'

/**
 * Catch-all API proxy: перенаправляет запросы к Laravel бэкенду.
 * Не перехватывает /api/hh/* и /api/candidates/* — они обрабатываются Nuxt.
 */
export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  const requestPath = path ? `/${path}` : ''
  const fullPath = `/api${requestPath}`

  // Более специфичные маршруты (/api/hh/*, /api/candidates/*) обрабатываются Nitro раньше

  const apiBackend = process.env.NUXT_PUBLIC_API_BACKEND || 'http://127.0.0.1:8000'
  const url = getRequestURL(event)
  const target = url.search ? `${joinURL(apiBackend, fullPath)}${url.search}` : joinURL(apiBackend, fullPath)

  const method = getMethod(event)
  const headers = getHeaders(event)

  // Копируем заголовки (Content-Type важен для multipart — содержит boundary)
  const forwardHeaders: Record<string, string> = {
    Accept: (headers.accept || 'application/json') as string,
  }
  const ct = headers['content-type']
  if (ct) forwardHeaders['Content-Type'] = ct as string
  if (headers.authorization) forwardHeaders.Authorization = headers.authorization as string
  if (headers['x-auth-user']) forwardHeaders['X-Auth-User'] = headers['x-auth-user'] as string

  let body: BodyInit | undefined
  if (method !== 'GET' && method !== 'HEAD') {
    // Для multipart/form-data нужен сырой body — readRawBody вызываем первым
    const rawBody = await readRawBody(event)
    if (rawBody !== undefined) {
      body = rawBody
    } else {
      try {
        const parsed = await readBody(event)
        if (parsed !== undefined) body = parsed as BodyInit
      } catch {
        // body уже прочитан или пустой
      }
    }
  }

  try {
    const response = await $fetch.raw(target, {
      method,
      headers: forwardHeaders,
      body: body as BodyInit | undefined,
      ignoreResponseError: true,
    })

    for (const [key, value] of response.headers.entries()) {
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        setHeader(event, key, value)
      }
    }
    setResponseStatus(event, response.status)
    return response._data
  } catch (err: unknown) {
    const e = err as { statusCode?: number; statusMessage?: string; data?: unknown }
    throw createError({
      statusCode: e?.statusCode || 502,
      statusMessage: e?.statusMessage || 'Backend Error',
      data: e?.data,
    })
  }
})
