// https://nuxt.com/docs/api/configuration/nuxt-config
import path from 'node:path'
import fs from 'node:fs'

function patchTailwindConfig(rootDir: string) {
    const tailwindConfigPath = path.join(rootDir, '.nuxt', 'tailwind.config.cjs')
    if (!fs.existsSync(tailwindConfigPath)) return
    const content = fs.readFileSync(tailwindConfigPath, 'utf8')
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

    // В Docker content-пути должны оставаться /app/... (иначе Tailwind не найдёт классы).
    // Для локального запуска без Docker нормализуем только docker-пути из сгенерированного файла.
    if (!isDocker) {
        const rootPrefix = rootDir.replace(/\\/g, '/').replace(/\/?$/, '/')
        next = next.replace(/\/app\//g, rootPrefix)
    }

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
            patchTailwindConfig(nuxt.options.rootDir)
        },
        'build:before'() {
            // Патч ещё раз перед сборкой — шаблон tailwind мог записаться после ready
            const rootDir = process.cwd()
            patchTailwindConfig(rootDir)
        },
    },
    build: {
        transpile: ['entities'],
    },
    typescript: {
        shim: false,
    },
    css: ['~/assets/css/main.scss'],
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
                    patchTailwindConfig(process.cwd())
                },
                buildStart() {
                    patchTailwindConfig(process.cwd())
                },
                configureServer() {
                    const root = process.cwd()
                    const nuxtDir = path.join(root, '.nuxt')
                    patchTailwindConfig(root)
                    let debounce: ReturnType<typeof setTimeout> | undefined
                    const schedule = () => {
                        if (debounce) clearTimeout(debounce)
                        debounce = setTimeout(() => patchTailwindConfig(root), 50)
                    }
                    try {
                        fs.watch(nuxtDir, { persistent: false }, (event, filename) => {
                            if (filename === 'tailwind.config.cjs') schedule()
                        })
                    } catch {
                        /* .nuxt может ещё не существовать */
                    }
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
        // input: '~/assets/sprite/'
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
