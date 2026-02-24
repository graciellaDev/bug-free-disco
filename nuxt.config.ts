// https://nuxt.com/docs/api/configuration/nuxt-config
import path from 'node:path'
import fs from 'node:fs'

function patchTailwindConfig(rootDir: string) {
  const tailwindConfigPath = path.join(rootDir, '.nuxt', 'tailwind.config.cjs')
  if (!fs.existsSync(tailwindConfigPath)) return
  let content = fs.readFileSync(tailwindConfigPath, 'utf8')
  if (!content.includes('/app/node_modules')) return
  const root = rootDir.replace(/\\/g, '/')
  content = content.replace(
    /require\s*\(\s*"\/app\/node_modules\/@nuxtjs\/tailwindcss\/dist\/runtime\/merger\.js"\s*\)/g,
    'require(path.resolve(__dirname, "../node_modules/@nuxtjs/tailwindcss/dist/runtime/merger.js"))'
  )
  if (content.includes('path.resolve') && !content.includes('const path = require')) {
    content = 'const path = require("path");\n' + content
  }
  content = content.replace(/\/app\//g, root.endsWith('/') ? root : root + '/')
  fs.writeFileSync(tailwindConfigPath, content)
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
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler' // or "modern"
        }
      }
    }
  },
  svgSprite: {
    // input: '~/assets/sprite/'
  },
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
      apiEmail: process.env.NUXT_PUBLIC_API_EMAIL,
      apiPassword: process.env.NUXT_PUBLIC_API_PASSWORD,
    }
  },
  pinia: {
    storesDirs: ['~/stores'],
  },
  routeRules: {
    // Проксирование /api/* на Laravel
    '/api/**': {
      proxy: (process.env.NUXT_PUBLIC_API_BACKEND || 'http://127.0.0.1:8000') + '/api/**',
    },
  },
})
