<script setup lang="ts">
  import ButtonSelector from '~/components/custom/ButtonSelector.vue';
  import BtnIcon from '~/components/custom/BtnIcon.vue';
  import MyTooltip from '~/components/custom/MyTooltip.vue';
  import DotsDropdown from '~/components/custom/DotsDropdown.vue';

  const props = defineProps<{
    isFunnel: boolean;
    options: string[];
    selectedLabel: string;
    dropdownOptions: string[];
  }>();

  const emit = defineEmits<{
    'select-item': [item: string];
    'add-comment': [];
    'new-task': [];
    email: [];
    refuse: [];
    'update:selectedLabel': [label: string];
  }>();
</script>

<template>
  <div
    class="mb-[41px] flex"
    :class="{ 'justify-between': isFunnel, 'justify-end': !isFunnel }"
  >
    <ButtonSelector
      v-if="isFunnel"
      :options="options"
      :modelValue="selectedLabel"
      @update:modelValue="emit('update:selectedLabel', $event)"
    />
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
        @click="emit('email')"
      />
      <BtnIcon
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
</template>
