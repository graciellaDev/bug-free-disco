/**
 * Docker + Vite dev: часть путей в HTML указывает на виртуальные модули.
 *
 * 1) /_nuxt/app/node_modules/... — лишний сегмент app (WORKDIR) → 404 entry.js.
 * 2) <link rel="stylesheet" href="/_nuxt/..."> без ?direct/&direct — Vite отдаёт JS,
 *    браузер не применяет это как CSS → «голая» страница, пока не сработает клиент
 *    (или если он падает).
 */
export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('render:html', (html) => {
        const fixChunk = (s: string) => {
            let out = s.replace(/\/_nuxt\/app\/node_modules\//g, '/_nuxt/node_modules/')
            if (process.env.NODE_ENV === 'production') {
                return out
            }
            out = out.replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/gi, (tag) => {
                if (tag.includes('direct')) return tag
                return tag.replace(/href="(\/_nuxt\/[^"]+)"/, (m, url: string) => {
                    if (url.includes('direct')) return m
                    const j = url.includes('?') ? '&' : '?'
                    return `href="${url}${j}direct"`
                })
            })
            return out
        }
        const fixArr = (arr: unknown) => {
            if (!Array.isArray(arr)) return
            for (let i = 0; i < arr.length; i++) {
                const chunk = arr[i]
                if (typeof chunk === 'string') {
                    arr[i] = fixChunk(chunk)
                }
            }
        }
        fixArr(html.head)
        fixArr(html.bodyAppend)
        fixArr(html.bodyPrepend)
        fixArr(html.body)
        fixArr(html.htmlAttrs)
        fixArr(html.bodyAttrs)
    })
})
