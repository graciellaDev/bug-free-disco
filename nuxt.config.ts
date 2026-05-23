// https://nuxt.com/docs/api/configuration/nuxt-config
import path from 'node:path'
import fs from 'node:fs'

/** Пути проекта в сгенерированных .nuxt-файлах: /app в Docker, абсолютный путь на хосте. */
function normalizeGeneratedProjectPaths(content: string, rootDir: string, isDocker: boolean): string {
    const hostPrefix = rootDir.replace(/\\/g, '/').replace(/\/?$/, '/')
    const dockerPrefix = '/app/'
    let next = content

    if (isDocker) {
        // .nuxt мог быть создан на macOS — в контейнере /Users/... не существует
        next = next.replace(/\/Users\/[^"'\\]+?\/bug-free-disco\//g, dockerPrefix)
        if (hostPrefix !== dockerPrefix && hostPrefix.startsWith('/')) {
            const escaped = hostPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            next = next.replace(new RegExp(escaped, 'g'), dockerPrefix)
        }
    } else {
        next = next.replace(/\/app\//g, hostPrefix)
    }

    return next
}

const SVG_SPRITE_ICONS_RELATIVE = '../assets/sprite/gen/icons.svg'

function patchSvgSpritePaths(rootDir: string) {
    const spriteModulePath = path.join(rootDir, '.nuxt', 'svg-sprite.mjs')
    if (!fs.existsSync(spriteModulePath)) return
    const content = fs.readFileSync(spriteModulePath, 'utf8')
    if (!content.includes('export const sprites')) return

    const isDocker = process.env.NUXT_DOCKER === '1'
    let next = normalizeGeneratedProjectPaths(content, rootDir, isDocker)
    // Абсолютные пути (/Users/... или /app/...) ломают Vite в Docker — только относительный от .nuxt
    next = next.replace(
        /import\(["'][^"']*assets\/sprite\/gen\/icons\.svg["']\)/g,
        `import("${SVG_SPRITE_ICONS_RELATIVE}")`
    )

    if (next !== content) {
        fs.writeFileSync(spriteModulePath, next)
    }
}

function patchTailwindConfig(rootDir: string) {
    const tailwindConfigPath = path.join(rootDir, '.nuxt', 'tailwind.config.cjs')
    if (!fs.existsSync(tailwindConfigPath)) return
    const content = fs.readFileSync(tailwindConfigPath, 'utf8')
    // Не трогаем файл, пока Nuxt ещё дописывает конфиг (иначе ломается PostCSS/Tailwind).
    if (!content.includes('module.exports = config')) return
    let next = content
    const isDocker = process.env.NUXT_DOCKER === '1'

    // Любой абсолютный require merger (Docker /app, локальный /Users/...) — в путь от .nuxt,
    // чтобы один и тот же файл .nuxt/tailwind.config.cjs работал и на хосте, и в контейнере.
    const mergerAbsRequire =
        /require\s*\(\s*["'][^"']*@nuxtjs\/tailwindcss\/dist\/runtime\/merger\.js["']\s*\)/g
    if (mergerAbsRequire.test(next)) {
        mergerAbsRequire.lastIndex = 0
        next = next.replace(
            mergerAbsRequire,
            'require(path.resolve(__dirname, "../node_modules/@nuxtjs/tailwindcss/dist/runtime/merger.js"))'
        )
    }
    if (next.includes('path.resolve') && !next.includes('const path = require')) {
        next = 'const path = require("path");\n' + next
    }

    next = normalizeGeneratedProjectPaths(next, rootDir, isDocker)

    if (next !== content) {
        fs.writeFileSync(tailwindConfigPath, next)
    }
}

export default defineNuxtConfig({
    compatibilityDate: '2024-11-01',
    devtools: { enabled: true },
    components: true,
    ssr: true,
    hooks: {
        'ready'(nuxt) {
            const root = nuxt.options.rootDir
            patchTailwindConfig(root)
            patchSvgSpritePaths(root)
            // svg-sprite.mjs иногда пишется после ready — повторный патч
            setTimeout(() => {
                patchTailwindConfig(root)
                patchSvgSpritePaths(root)
            }, 500)
        },
        'build:before'() {
            const rootDir = process.cwd()
            patchTailwindConfig(rootDir)
            patchSvgSpritePaths(rootDir)
        },
    },
    build: {
        transpile: ['entities'],
    },
    typescript: {
        shim: false,
    },
    css: ['~/assets/css/main.scss'],
    tailwindcss: {
        config: {
            content: [
                './components/**/*.{vue,js,jsx,mjs,ts,tsx}',
                './layouts/**/*.{vue,js,jsx,mjs,ts,tsx}',
                './pages/**/*.{vue,js,jsx,mjs,ts,tsx}',
                './plugins/**/*.{js,ts,mjs}',
                './composables/**/*.{js,ts,mjs}',
                './utils/**/*.{js,ts,mjs}',
                './app.vue',
                './error.vue',
                './app.config.{js,ts,mjs}',
            ],
        },
    },
    modules: [['@nuxtjs/google-fonts', {
        families: {
            Inter: [300, 400, 500, 600, 700],
        }
    }], '@nuxtjs/tailwindcss', 'shadcn-nuxt', '@nuxtjs/svg-sprite', '@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt'],
    postcss: {
        plugins: {
            tailwindcss: {},
            autoprefixer: {},
        },
    },
    shadcn: {
        /**
         * Prefix for all the imported component
         */
        prefix: 'Ui',
        /**
         * Directory that the component lives in.
         * @default "./components/ui"
         */
        componentDir: './components/ui'
    },
    // code bottom answer for deprecated saas library Dark 2.0
    vite: {
        plugins: [
            {
                name: 'jobly-patch-tailwind-docker-paths',
                enforce: 'pre',
                configResolved() {
                    const root = process.cwd()
                    patchTailwindConfig(root)
                    patchSvgSpritePaths(root)
                },
                buildStart() {
                    const root = process.cwd()
                    patchTailwindConfig(root)
                    patchSvgSpritePaths(root)
                },
                configureServer() {
                    const root = process.cwd()
                    patchTailwindConfig(root)
                    patchSvgSpritePaths(root)
                },
            },
        ],
        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern-compiler' // or "modern"
                }
            }
        },
        ...(process.env.NUXT_DOCKER === '1'
            ? {
                  server: {
                      host: true,
                      strictPort: true,
                      hmr: { clientPort: 3000 },
                      watch: { usePolling: true },
                  },
              }
            : {}),
    },
    svgSprite: {
        input: '~/assets/sprite/svg',
    },
    app: {
        head: {
            title: 'Наймикс',
            charset: 'utf-8',
            viewport: 'width=device-width, initial-scale=1',
            link: [
                { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
            ],
        },
        pageTransition: { name: 'page', mode: 'out-in' },
    },
    runtimeConfig: {
        public: {
            apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
            /** Origin Laravel без /api (тот же хост, что NUXT_PUBLIC_API_BACKEND у прокси). Нужен браузеру для OAuth /api/code-* в обход прокси. */
            apiBackend: process.env.NUXT_PUBLIC_API_BACKEND || '',
            apiEmail: process.env.NUXT_PUBLIC_API_EMAIL,
            apiPassword: process.env.NUXT_PUBLIC_API_PASSWORD,
            /** Опционально: WebSocket push чата hh.ru. Плейсхолдер {id}. */
            wsCandidateMessagesUrl: process.env.NUXT_PUBLIC_WS_CANDIDATE_MESSAGES_URL || '',
            /** Опционально: WebSocket push чата SuperJob. Если пусто — только polling. */
            wsSuperjobCandidateMessagesUrl: process.env.NUXT_PUBLIC_WS_SUPERJOB_CANDIDATE_MESSAGES_URL || '',
            /** Опционально: WebSocket push чата Avito. Если пусто — только polling. */
            wsAvitoCandidateMessagesUrl: process.env.NUXT_PUBLIC_WS_AVITO_CANDIDATE_MESSAGES_URL || '',
            /** Опционально: WebSocket push чата Rabota.ru. Если пусто — только polling. */
            wsRabotaCandidateMessagesUrl: process.env.NUXT_PUBLIC_WS_RABOTA_CANDIDATE_MESSAGES_URL || '',
            /** Только dev: в кабинете показать Avito как подключённый (без OAuth). */
            mockAvitoConnected: process.env.NUXT_PUBLIC_MOCK_AVITO_CONNECTED || '',
        }
    },
    pinia: {
        storesDirs: ['~/stores'],
    },
    routeRules: {
        '/auth': { ssr: false },
        // Все защищённые разделы кабинета: SSR не нужен (требуют авторизации)
        // и убирает 6+ сек блокировку Nitro‑воркера при dev‑пересборке
        '/vacancies/**': { ssr: false },
        '/candidates/**': { ssr: false },
        '/applications/**': { ssr: false },
        '/reports/**': { ssr: false },
        '/settings/**': { ssr: false },
        '/activity/**': { ssr: false },
        // Проксирование /api/* на Laravel
        '/api/**': {
            proxy: (process.env.NUXT_PUBLIC_API_BACKEND || 'http://127.0.0.1:8000') + '/api/**',
        },
    },
})
