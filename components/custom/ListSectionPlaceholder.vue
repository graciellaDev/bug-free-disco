<script setup lang="ts">
  withDefaults(
    defineProps<{
      variant?: 'vacancy' | 'candidates' | 'applications' | 'reports';
      loading?: boolean;
      title?: string;
      description?: string;
      loadingTitle?: string;
      loadingDescription?: string;
    }>(),
    {
      variant: 'vacancy',
      loading: false,
      title: '',
      description: '',
      loadingTitle: '',
      loadingDescription: 'Подождите несколько секунд',
    }
  );

  const defaultCopy = {
    vacancy: {
      title: 'Пока нет вакансий',
      description:
        'Создайте вакансию, чтобы вести кандидатов и размещать объявления на работных сайтах.',
      loadingTitle: 'Загружаем вакансии…',
    },
    candidates: {
      title: 'Пока нет кандидатов',
      description:
        'Добавьте кандидата вручную или получайте отклики с работных сайтов — они появятся в этом списке.',
      loadingTitle: 'Загружаем кандидатов…',
    },
    applications: {
      title: 'Пока нет заявок',
      description:
        'Создайте заявку на подбор — отправьте приглашение заказчику и назначьте согласующего.',
      loadingTitle: 'Загружаем заявки…',
    },
    reports: {
      title: 'Настройте отчёт',
      description:
        'Выберите вакансию и период в фильтрах выше, затем нажмите «Применить».',
      loadingTitle: 'Загружаем отчёт…',
    },
  } as const;
</script>

<template>
  <div
    class="list-section-placeholder flex w-full flex-col items-center justify-center rounded-fifteen bg-white px-25px py-14 text-center sm:py-16"
    role="status"
    :aria-busy="loading"
    :aria-label="loading ? (loadingTitle || defaultCopy[variant].loadingTitle) : (title || defaultCopy[variant].title)"
  >
    <div
      class="list-section-placeholder__art mb-7 flex h-[168px] w-[220px] max-w-full items-center justify-center"
      :class="{ 'list-section-placeholder__art--loading': loading }"
      aria-hidden="true"
    >
      <!-- Вакансии -->
      <svg
        v-if="variant === 'vacancy'"
        class="h-full w-full"
        viewBox="0 0 220 168"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="110" cy="78" r="62" fill="#EEF4FF" />
        <circle cx="168" cy="42" r="18" fill="#D6E6FF" />
        <circle cx="48" cy="118" r="12" fill="#D6E6FF" />
        <rect x="62" y="52" width="96" height="72" rx="14" fill="#fff" stroke="#EDEFF5" stroke-width="1.5" />
        <path d="M78 72h64M78 86h48M78 100h56" stroke="#C5D0E0" stroke-width="4" stroke-linecap="round" />
        <rect x="88" y="38" width="44" height="22" rx="8" fill="#5898FF" />
        <path d="M98 49h24M98 55h16" stroke="#fff" stroke-width="3" stroke-linecap="round" />
        <circle cx="152" cy="108" r="20" fill="#5898FF" fill-opacity="0.12" />
        <path d="M146 108l4 4 8-9" stroke="#5898FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <!-- Заявки -->
      <svg
        v-else-if="variant === 'applications'"
        class="h-full w-full"
        viewBox="0 0 220 168"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="110" cy="84" r="62" fill="#EEF4FF" />
        <circle cx="164" cy="44" r="14" fill="#D6E6FF" />
        <circle cx="56" cy="120" r="10" fill="#D6E6FF" />
        <rect x="68" y="48" width="84" height="96" rx="14" fill="#fff" stroke="#EDEFF5" stroke-width="1.5" />
        <path d="M84 68h52M84 82h36M84 96h44M84 110h28" stroke="#C5D0E0" stroke-width="3" stroke-linecap="round" />
        <rect x="92" y="56" width="36" height="14" rx="6" fill="#5898FF" />
        <circle cx="148" cy="100" r="18" fill="#5898FF" fill-opacity="0.15" />
        <path d="M142 100l4 4 8-8" stroke="#5898FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <!-- Отчёты -->
      <svg
        v-else-if="variant === 'reports'"
        class="h-full w-full"
        viewBox="0 0 220 168"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="110" cy="84" r="62" fill="#EEF4FF" />
        <circle cx="168" cy="44" r="14" fill="#D6E6FF" />
        <circle cx="52" cy="124" r="10" fill="#D6E6FF" />
        <rect x="56" y="108" width="108" height="44" rx="12" fill="#fff" stroke="#EDEFF5" stroke-width="1.5" />
        <rect x="68" y="72" width="18" height="56" rx="6" fill="#5898FF" fill-opacity="0.2" />
        <rect x="68" y="96" width="18" height="32" rx="6" fill="#5898FF" />
        <rect x="96" y="60" width="18" height="68" rx="6" fill="#5898FF" fill-opacity="0.35" />
        <rect x="96" y="84" width="18" height="44" rx="6" fill="#5898FF" />
        <rect x="124" y="80" width="18" height="48" rx="6" fill="#FFBA08" fill-opacity="0.25" />
        <rect x="124" y="100" width="18" height="28" rx="6" fill="#FFBA08" />
        <rect x="148" y="56" width="36" height="20" rx="8" fill="#fff" stroke="#EDEFF5" stroke-width="1.5" />
        <path d="M156 66h20M156 72h14" stroke="#C5D0E0" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="166" cy="48" r="10" fill="#5898FF" fill-opacity="0.15" />
        <path d="M162 48l3 3 7-7" stroke="#5898FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <!-- Кандидаты -->
      <svg
        v-else
        class="h-full w-full"
        viewBox="0 0 220 168"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="110" cy="84" r="62" fill="#EEF4FF" />
        <circle cx="168" cy="40" r="16" fill="#D6E6FF" />
        <circle cx="52" cy="124" r="10" fill="#D6E6FF" />
        <circle cx="110" cy="72" r="32" fill="#5898FF" fill-opacity="0.15" />
        <circle cx="110" cy="72" r="24" fill="#fff" stroke="#EDEFF5" stroke-width="1.5" />
        <circle cx="110" cy="66" r="10" fill="#D6E6FF" />
        <path
          d="M94 88c4-8 22-8 32 0"
          stroke="#C5D0E0"
          stroke-width="3"
          stroke-linecap="round"
        />
        <rect x="138" y="58" width="52" height="64" rx="12" fill="#fff" stroke="#EDEFF5" stroke-width="1.5" />
        <path d="M150 78h28M150 92h20M150 106h24" stroke="#C5D0E0" stroke-width="3" stroke-linecap="round" />
        <circle cx="158" cy="68" r="6" fill="#5898FF" />
      </svg>
    </div>

    <p class="mb-2 text-lg font-semibold leading-snug text-space">
      {{
        loading
          ? (loadingTitle || defaultCopy[variant].loadingTitle)
          : (title || defaultCopy[variant].title)
      }}
    </p>
    <p class="max-w-[420px] text-sm font-normal leading-relaxed text-slate-custom">
      {{
        loading
          ? loadingDescription
          : (description || defaultCopy[variant].description)
      }}
    </p>

    <div v-if="!loading && $slots.default" class="mt-7">
      <slot />
    </div>

    <div
      v-if="loading"
      class="mt-6 flex items-center gap-2 text-sm text-slate-custom"
    >
      <span class="list-section-placeholder__dot" />
      <span class="list-section-placeholder__dot list-section-placeholder__dot--2" />
      <span class="list-section-placeholder__dot list-section-placeholder__dot--3" />
    </div>
  </div>
</template>

<style scoped>
  .list-section-placeholder__art--loading {
    animation: list-section-placeholder-pulse 1.6s ease-in-out infinite;
  }

  @keyframes list-section-placeholder-pulse {
    0%,
    100% {
      opacity: 1;
      transform: translateY(0);
    }
    50% {
      opacity: 0.72;
      transform: translateY(4px);
    }
  }

  .list-section-placeholder__dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #5898ff;
    animation: list-section-placeholder-bounce 1.2s ease-in-out infinite;
  }

  .list-section-placeholder__dot--2 {
    animation-delay: 0.15s;
  }

  .list-section-placeholder__dot--3 {
    animation-delay: 0.3s;
  }

  @keyframes list-section-placeholder-bounce {
    0%,
    80%,
    100% {
      transform: scale(0.85);
      opacity: 0.45;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
