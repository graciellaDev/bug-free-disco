<script setup lang="ts">
  import { inject, ref, computed, onBeforeUnmount } from 'vue';
  import { useJoblyToastTopStyle } from '@/composables/useJoblyToastTopStyle';
  import ButtonSelector from '~/components/custom/ButtonSelector.vue';
  import BtnIcon from '~/components/custom/BtnIcon.vue';
  import MyTooltip from '~/components/custom/MyTooltip.vue';
  import DotsDropdown from '~/components/custom/DotsDropdown.vue';

  const props = withDefaults(
    defineProps<{
      isFunnel: boolean;
      options: string[];
      selectedLabel: string;
      dropdownOptions: string[];
      /** Скрыть кнопку отказа (например, кандидат уже на этапе «Отказ») */
      showRefuseButton?: boolean;
      /** E-mail для проверки перед письмом */
      candidateEmail?: string | null;
    }>(),
    {
      showRefuseButton: true,
      candidateEmail: null,
    }
  );

  const emit = defineEmits<{
    'select-item': [item: string];
    'add-comment': [];
    'new-task': [];
    email: [];
    refuse: [];
    'update:selectedLabel': [label: string];
    'confirm-transfer': [label: string];
  }>();

  const injectedToast = inject<
    ((message: string, variant?: 'success' | 'error') => void) | undefined
  >('showFieldsTabToast', undefined);

  const headerActionToast = ref<{
    show: boolean;
    text: string;
    variant: 'success' | 'error';
  }>({ show: false, text: '', variant: 'error' });
  let headerActionToastTimer: ReturnType<typeof setTimeout> | null = null;

  const headerActionToastTopStyle = useJoblyToastTopStyle(
    computed(() => headerActionToast.value.show)
  );

  function showActionToast(
    message: string,
    variant: 'success' | 'error' = 'error'
  ) {
    if (injectedToast) {
      injectedToast(message, variant);
      return;
    }
    headerActionToast.value = { show: true, text: message, variant };
    if (headerActionToastTimer) clearTimeout(headerActionToastTimer);
    headerActionToastTimer = setTimeout(() => {
      headerActionToast.value = { show: false, text: '', variant: 'error' };
      headerActionToastTimer = null;
    }, 4000);
  }

  onBeforeUnmount(() => {
    if (headerActionToastTimer) clearTimeout(headerActionToastTimer);
  });

  function emailHasAtAndDot(raw: string): boolean {
    const t = raw.trim();
    return t.includes('@') && t.includes('.');
  }

  function handleClickWriteEmail() {
    const t = (props.candidateEmail ?? '').trim();
    if (!t) {
      showActionToast('Введите адрес e-mail', 'error');
      return;
    }
    if (!emailHasAtAndDot(t)) {
      showActionToast(
        'Введите корректный e-mail (например, user@example.ru)',
        'error'
      );
      return;
    }
    emit('email');
  }
</script>

<template>
  <div
    class="mb-[41px] flex items-center"
    :class="{
      'justify-between': isFunnel || $slots.left,
      'justify-end': !isFunnel && !$slots.left,
    }"
  >
    <ButtonSelector
      v-if="isFunnel"
      :options="options"
      :modelValue="selectedLabel"
      @update:modelValue="emit('update:selectedLabel', $event)"
      @confirm-transfer="emit('confirm-transfer', $event)"
    />
    <slot v-else-if="$slots.left" name="left" />
    <div class="flex gap-x-2.5">
      <BtnIcon
        icon="message20"
        tooltipText="Добавить комментарий"
        @click="emit('add-comment')"
      />
      <BtnIcon
        icon="calendar20"
        tooltipText="Новая задача"
        @click="emit('new-task')"
      />
      <BtnIcon
        icon="email20"
        tooltipText="Написать письмо"
        @click="handleClickWriteEmail"
      />
      <BtnIcon
        v-if="props.showRefuseButton"
        icon="stop20"
        tooltipText="Отказать кандидату"
        classes="flex-center cursor-pointer rounded-ten border p-10.5px transition-colors"
        isHoveredClasses="border-red-custom bg-red-custom text-white"
        isNotHoveredClasses="border-border-pink bg-pink text-red-custom"
        @click="emit('refuse')"
      />
      <div>
        <MyTooltip text="Еще действия" />
        <DotsDropdown
          :items="dropdownOptions"
          @select-item="emit('select-item', $event)"
        />
      </div>
    </div>
  </div>
  <Teleport to="body">
    <Transition name="fields-tab-toast-fade">
      <div
        v-if="headerActionToast.show"
        class="fixed right-4 z-[10001] max-w-[min(90vw,420px)] rounded-fifteen px-6 py-3 text-center text-sm font-medium leading-150 text-space shadow-[0_0_15px_rgba(0,0,0,0.15)] sm:right-6"
        :style="headerActionToastTopStyle"
        :class="
          headerActionToast.variant === 'success'
            ? 'fields-tab-success-toast'
            : 'fields-tab-error-toast'
        "
        :role="
          headerActionToast.variant === 'success' ? 'status' : 'alert'
        "
      >
        {{ headerActionToast.text }}
      </div>
    </Transition>
  </Teleport>
</template>

<style>
  .fields-tab-error-toast {
    background-color: #fce7f3 !important;
    border: none !important;
    color: #212936 !important;
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }
  .fields-tab-success-toast {
    background-color: #ffffff !important;
    border: none !important;
    color: #212936 !important;
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }
  .fields-tab-toast-fade-enter-active,
  .fields-tab-toast-fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .fields-tab-toast-fade-enter-from,
  .fields-tab-toast-fade-leave-to {
    opacity: 0;
  }
</style>
