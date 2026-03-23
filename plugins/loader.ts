import { ref, computed } from 'vue'

/**
 * Глобальный перехват $fetch отключён: при открытии карточки кандидата уходит много параллельных
 * запросов — каждый вызывал show/hide и тяжёлые обновления ref, из‑за чего вкладка «зависала».
 * При необходимости лоадер вызывайте вручную через useNuxtApp().$loader.
 */
export default defineNuxtPlugin(() => {
  const loading = ref(false)
  let activeRequests = 0

  const loader = {
    show: () => {
      activeRequests++
      loading.value = true
    },
    hide: () => {
      activeRequests = Math.max(0, activeRequests - 1)
      if (activeRequests === 0) {
        loading.value = false
      }
    },
    isLoading: computed(() => loading.value),
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
