<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import MyInput from '~/components/custom/MyInput.vue';
  import Popup from '~/components/custom/Popup.vue';
  import {
    getRejectionReasons,
    createRejectionReason,
    updateRejectionReason,
    deleteRejectionReason,
    type RejectionReasonRow,
  } from '@/src/api/rejectionReasons';

  definePageMeta({
    layout: 'settings',
  });

  useHead({
    title: 'Настройки — Причины отказа',
  });

  const loading = ref(true);
  const reasons = ref<RejectionReasonRow[]>([]);

  const message = ref<string | null>(null);
  const error = ref<string | null>(null);

  const editPopupOpen = ref(false);
  const editingId = ref<number | null>(null);
  const formName = ref('');
  const formSaving = ref(false);

  const deletePopupOpen = ref(false);
  const deletingRow = ref<RejectionReasonRow | null>(null);
  const deleteLoading = ref(false);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      const res = await getRejectionReasons();
      const payload = res.data;
      reasons.value = Array.isArray(payload?.reasons) ? [...payload.reasons] : [];
    } catch (e: unknown) {
      error.value = 'Не удалось загрузить причины отказа';
      console.error(e);
    } finally {
      loading.value = false;
    }
  }

  function openCreate() {
    editingId.value = null;
    formName.value = '';
    editPopupOpen.value = true;
  }

  function openEdit(row: RejectionReasonRow) {
    editingId.value = row.id;
    formName.value = row.name;
    editPopupOpen.value = true;
  }

  function closeEdit() {
    editPopupOpen.value = false;
  }

  async function saveForm() {
    const name = formName.value.trim();
    if (!name) {
      error.value = 'Введите название причины';
      return;
    }
    formSaving.value = true;
    error.value = null;
    message.value = null;
    try {
      if (editingId.value == null) {
        await createRejectionReason({ name });
      } else {
        await updateRejectionReason(editingId.value, { name });
      }
      message.value = editingId.value == null ? 'Причина добавлена' : 'Изменения сохранены';
      editPopupOpen.value = false;
      await load();
    } catch (e: unknown) {
      error.value = 'Не удалось сохранить';
      console.error(e);
    } finally {
      formSaving.value = false;
    }
  }

  function confirmDelete(row: RejectionReasonRow) {
    deletingRow.value = row;
    deletePopupOpen.value = true;
  }

  async function doDelete() {
    if (!deletingRow.value) return;
    deleteLoading.value = true;
    error.value = null;
    try {
      await deleteRejectionReason(deletingRow.value.id);
      message.value = 'Причина удалена';
      deletePopupOpen.value = false;
      deletingRow.value = null;
      await load();
    } catch (e: unknown) {
      error.value = 'Не удалось удалить';
      console.error(e);
    } finally {
      deleteLoading.value = false;
    }
  }

  onMounted(() => load());
</script>

<template>
  <div>
    <div class="mb-15px rounded-fifteen bg-white p-25px">
      <p class="mb-2.5 text-xl font-semibold text-space">Причины отказа</p>
      <p class="text-sm font-normal leading-150 text-bali">
        Справочник причин, по которым кандидат может быть отклонён. При переводе на этап «Отказ»
        рекрутер выбирает причину из этого списка (если в воронке вакансии включены причины отказа).
      </p>
    </div>

    <div class="rounded-fifteen bg-white p-25px">
      <div
        v-if="message"
        class="mb-4 rounded-ten bg-[#e8f1ff] px-15px py-10px text-sm text-space"
      >
        {{ message }}
      </div>
      <div
        v-if="error"
        class="mb-4 rounded-ten bg-red-50 px-15px py-10px text-sm text-red-700"
      >
        {{ error }}
      </div>

      <div
        class="mb-25px flex flex-wrap items-center justify-end gap-4 border-b border-athens pb-25px"
      >
        <button
          type="button"
          class="rounded-ten bg-dodger px-20px py-10px text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          :disabled="loading"
          @click="openCreate"
        >
          Добавить причину
        </button>
      </div>

      <div v-if="loading" class="py-10 text-center text-sm text-bali">Загрузка…</div>

      <template v-else>
        <div
          v-if="reasons.length === 0"
          class="rounded-ten border border-dashed border-athens bg-athens-gray px-15px py-20px text-center text-sm text-bali"
        >
          Список пуст. Добавьте причины отказа — они появятся в форме при переводе кандидата на этап
          «Отклонённые».
        </div>

        <ul v-else class="divide-y divide-athens">
          <li
            v-for="row in reasons"
            :key="row.id"
            class="flex min-h-[52px] items-center justify-between gap-4 py-15px"
          >
            <span
              class="min-w-0 flex-1 text-base font-medium leading-150 text-space"
            >{{ row.name }}</span>
            <div class="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                class="group/btn flex items-center gap-0.5 rounded text-sm font-normal leading-150 text-[#92989B] transition-colors hover:text-dodger"
                title="Удалить"
                @click="confirmDelete(row)"
              >
                <span
                  class="flex h-6 w-6 items-center justify-center text-red-500 transition-colors group-hover/btn:text-red-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z"
                    />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </span>
                <span
                  class="text-sm font-normal leading-150 text-[#92989B] transition-colors group-hover/btn:text-dodger"
                >Удалить</span>
              </button>
              <button
                type="button"
                class="group/btn flex items-center gap-0.5 rounded text-sm font-normal leading-150 text-[#92989B] transition-colors hover:text-dodger"
                title="Изменить"
                @click="openEdit(row)"
              >
                <span
                  class="flex h-6 w-6 items-center justify-center text-dodger transition-colors group-hover/btn:text-dodger"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </span>
                <span
                  class="text-sm font-normal leading-150 text-[#92989B] transition-colors group-hover/btn:text-dodger"
                >Изменить</span>
              </button>
            </div>
          </li>
        </ul>
      </template>
    </div>

    <Popup
      :is-open="editPopupOpen"
      width="490px"
      :show-close-button="false"
      :lg-size="true"
      :parent-rounded="true"
      :content-rounded="false"
      :content-padding="false"
      @close="closeEdit"
    >
      <div class="flex min-w-0 flex-col gap-y-6">
        <h2 class="text-xl font-semibold text-space">
          {{ editingId == null ? 'Новая причина отказа' : 'Редактирование' }}
        </h2>
        <div class="min-w-0">
          <p class="mb-2 text-sm font-medium text-space">Название</p>
          <MyInput
            v-model="formName"
            placeholder="Например: Не подходит по опыту"
            class="w-full min-w-0"
            @keydown.enter.prevent="saveForm"
          />
        </div>
        <div class="flex flex-wrap gap-x-3">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-dodger hover:opacity-90 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold disabled:opacity-50"
            :disabled="formSaving"
            @click="saveForm"
          >
            {{ formSaving ? 'Сохранение…' : 'Сохранить' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
            @click="closeEdit"
          >
            Отмена
          </button>
        </div>
      </div>
    </Popup>

    <Popup
      :is-open="deletePopupOpen"
      width="490px"
      :show-close-button="false"
      :lg-size="true"
      :parent-rounded="true"
      :content-rounded="false"
      :content-padding="false"
      @close="deletePopupOpen = false"
    >
      <div class="flex min-w-0 flex-col gap-y-6">
        <h2 class="text-xl font-semibold text-space">Удалить причину?</h2>
        <p class="text-sm text-slate-custom">
          «{{ deletingRow?.name }}» будет удалена из справочника. Для уже отклонённых кандидатов
          связь может обнулиться.
        </p>
        <div class="flex gap-x-3">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-red-500 hover:bg-red-600 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold disabled:opacity-50"
            :disabled="deleteLoading"
            @click="doDelete"
          >
            {{ deleteLoading ? 'Удаление…' : 'Удалить' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
            @click="deletePopupOpen = false"
          >
            Отмена
          </button>
        </div>
      </div>
    </Popup>
  </div>
</template>
