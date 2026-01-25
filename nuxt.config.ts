// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  components: true,
  ssr: true,
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
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      apiEmail: process.env.NUXT_PUBLIC_API_EMAIL,
      apiPassword: process.env.NUXT_PUBLIC_API_PASSWORD,
    }
  },
  pinia: {
    storesDirs: ['~/stores'],
  }
})
