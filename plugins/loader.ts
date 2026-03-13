import { ref, computed } from 'vue'

export default defineNuxtPlugin((nuxtApp) => {
  const loading = ref(false)
  let activeRequests = 0

  // Создаем объект с методами
  const loader = {
    show: () => {
      activeRequests++
      console.log('Show loader, active requests:', activeRequests)
      loading.value = true
    },
    hide: () => {
      activeRequests = Math.max(0, activeRequests - 1)
      console.log('Hide loader, active requests:', activeRequests)
      if (activeRequests === 0) {
        loading.value = false
      }
    },
    isLoading: computed(() => loading.value)
  }

  // Перехват $fetch только на клиенте; на сервере globalProperties.$fetch может быть недоступен и вызывал 503 при SSR
  if (import.meta.client) {
    const originalUseFetch = nuxtApp.vueApp.config.globalProperties.$fetch
    if (typeof originalUseFetch === 'function') {
      nuxtApp.vueApp.config.globalProperties.$fetch = async (...args: any[]) => {
        const options = args[1] || {}
        const skipLoader = options.skipLoader || false

        if (!skipLoader) {
          loader.show()
        }

        try {
          const result = await originalUseFetch(...args)
          return result
        } finally {
          if (!skipLoader) {
            loader.hide()
          }
        }
      }
    }
  }

  return {
    provide: {
      loader,
    },
  }
})

export const loadScript = (url: string) => {
  console.log('Загрузка яндекс-скрипта для городов', document.querySelector(`script[src="${url}"]`));
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve(); // Скрипт уже загружен, не дублируем
      return;
    }
    const script = document.createElement('script');
    script.src = url;
    // script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Не удалось загрузить скрипт: ${url}`));
    document.body.appendChild(script);
  });

};
