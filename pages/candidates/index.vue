<script lang="ts" setup>
  import { ref, watch, nextTick } from 'vue';
  import { useRouter } from 'vue-router';
  import { getCandidates, createCandidate } from '@/src/api/candidates';
  // import { disableBodyScroll, enableBodyScroll } from '@/utils/bodyScoll';
  import UiDotsLoader from '~/components/custom/UiDotsLoader.vue';
  import MyInput from '~/components/custom/MyInput.vue';
  import MyCheckbox from '~/components/custom/MyCheckbox.vue';
  import Popup from '~/components/custom/Popup.vue';
  import CardIcon from '~/components/custom/CardIcon.vue';
  import Pagination from '@/components/custom/Pagination.vue';
  import DynamicForm from '@/components/custom/DynamicForm.vue';
  import BtnIcon from '@/components/custom/BtnIcon.vue';
  import { usePopup } from '@/composables/usePopup';

  import type { Candidate } from '@/types/candidates';
  import type { UserRole } from '@/types/roles';
  import type { FormConfig } from '@/types/form';
  import type { CandidateCreateRequest } from '@/types/candidates';

  const router = useRouter();
  const isHoveredFunnel = ref(false);
  const isActiveFunnel = ref(false);
  const isHoveredSort = ref(false);
  const isActiveSort = ref(false);
  const selected = ref<Record<number, boolean>>({});
  const allSelected = ref(false);
  const itemsPerPage = 10;
  const currentPage = ref(1);
  const candidatesList = ref<Candidate[] | null>(null);
  const userRole = ref<UserRole>('admin');
  const lastPage = ref(1);
  const loadingCandidates = ref(false);
  // const isAddCandidatePopup = ref(false);
  const actionSort = ref<'Включить сортировку' | 'Отключить сортировку'>(
    'Включить сортировку'
  );
  const actionFunnel = ref<'Включить фильтрацию' | 'Отключить фильтрацию'>(
    'Включить фильтрацию'
  );

  const data = ref<Candidate[]>([]);

  // Данные формы
  const candidateFormData = ref<Record<string, any>>({});
  const serverErrors = ref<Record<string, string>>({});
  const isSubmitting = ref(false);
  const isSuccess = ref(false);
  const successMessage = ref('');

  // Конфигурация формы добавления кандидата
  const candidateFormConfig: FormConfig = {
    fields: [
      {
        name: 'firstname',
        label: 'Имя',
        type: 'text',
        placeholder: 'Введите имя',
        required: true,
        row: 1, // Первая строка
        colSpan: 6, // Половина ширины (6 из 12)
        validation: {
          required: true,
          message: 'Имя обязательно для заполнения',
          minLength: 3,
        },
      },
      {
        name: 'surname',
        label: 'Фамилия',
        type: 'text',
        placeholder: 'Введите фамилию',
        required: false,
        row: 1, // Первая строка (рядом с Имя)
        colSpan: 6, // Половина ширины (6 из 12)
        validation: {
          required: false,
        },
      },
      {
        name: 'resume',
        label: 'Название резюме',
        type: 'text',
        placeholder: 'Например, Менеджер по продажам',
        row: 2, // Вторая строка
      },
      {
        name: 'email',
        label: 'Электронная почта',
        type: 'email',
        placeholder: 'Введите email',
        required: true,
        row: 3, // Третья строка
        validation: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Введите корректный email',
        },
      },
      {
        name: 'phone',
        label: 'Телефон',
        type: 'tel',
        placeholder: '+7',
        defaultValue: '+7',
        row: 4, // Четвертая строка
        validation: {
          pattern: /^\+7\d{10}$/,
          message: 'Введите корректный номер телефона (+7XXXXXXXXXX)',
        },
      },
    ],
    submitButtonText: 'Добавить кандидата',
    cancelButtonText: 'Отмена',
    showCancelButton: true,
  };

  const addCandidatePopup = usePopup('addCandidate', {
    manageBodyScroll: true,
    onClose: () => {
      ((candidateFormData.value = {}),
        (serverErrors.value = {}),
        (isSuccess.value = false),
        (successMessage.value = ''));
      isSubmitting.value = false;

      if (data.value) {
        data.value = [];
      }
    },
  });

  const handlePageChange = async (page: number) => {
    currentPage.value = page;
    // TODO: Разобрать
    const { candidates, pagination } = await getCandidates(page);
    candidatesList.value = candidates;
    lastPage.value = pagination.lastPage;
  };

  const funnelToggleActive = () => {
    isActiveFunnel.value = !isActiveFunnel.value;
    actionFunnel.value = isActiveFunnel.value
      ? 'Отключить фильтрацию'
      : 'Включить фильтрацию';
  };

  const sortToggleActive = () => {
    isActiveSort.value = !isActiveSort.value;
    actionSort.value = isActiveSort.value
      ? 'Отключить сортировку'
      : 'Включить сортировку';
  };

  const toggleAll = (isChecked: boolean) => {
    data.value.forEach(item => {
      selected.value[item.id] = isChecked;
    });
  };

  const closeAddCandidatePopup = () => {
    addCandidatePopup.close();
  };

  function goToCandidate(id: number) {
    // console.log('[goToCandidate] Переходим к кандидату:', id);
    router.push(`/candidates/${id}`);
  }

  const getCandidatesData = async () => {
    try {
      loadingCandidates.value = true;
      const { candidates, pagination } = await getCandidates(currentPage.value);
      candidatesList.value = candidates;
      lastPage.value = pagination.lastPage;
    } catch (error) {
      console.error('Ошибка при загрузке кандидатов:', error);
    } finally {
      loadingCandidates.value = false;
    }
  };

  // Парсинг ошибок сервера
  const parseServerErrors = (error: any): Record<string, string> => {
    const serverErrors: Record<string, string> = {};

    // Ошибка 409 - дубликат (email/телефон уже существует)
    if (error.response?.status === 409) {
      const message = error.response._data?.message || error.message || '';

      // Определяем, какое поле дублируется
      if (message.toLowerCase().includes('email')) {
        serverErrors.email = 'Кандидат с таким email уже существует';
      }
      if (
        message.toLowerCase().includes('телефон') ||
        message.toLowerCase().includes('phone')
      ) {
        serverErrors.phone = 'Кандидат с таким номером телефона уже существует';
      }
      // Если не удалось определить, показываем общее сообщение
      if (Object.keys(serverErrors).length === 0) {
        serverErrors._general =
          message || 'Кандидат с такими данными уже существует';
      }
    }

    // Ошибка 422 - валидация (Laravel обычно возвращает errors объект)
    if (error.response?.status === 422) {
      const errors = error.response._data?.errors || {};
      Object.keys(errors).forEach(field => {
        serverErrors[field] = Array.isArray(errors[field])
          ? errors[field][0]
          : errors[field];
      });
    }

    // Другие ошибки
    if (!serverErrors._general && error.message) {
      serverErrors._general = error.message;
    }

    return serverErrors;
  };

  // Обработка отправки формы (получаем валидированные данные)
  const handleFormSubmit = async (formData: Record<string, any>) => {
    if (!addCandidatePopup.isOpen.value) {
      console.warn('[handleFormSubmit] Попап закрыт, прерываем обработку');
      return;
    }

    isSubmitting.value = true;
    serverErrors.value = {}; // Очищаем предыдущие ошибки

    try {
      const candidateData: CandidateCreateRequest = {
        firstname: formData.firstname,
        surname: formData.surname || null,
        patronymic: formData.patronymic || null,
        email: formData.email,
        phone:
          formData.phone && formData.phone !== '+7' ? formData.phone : null,
        resume: formData.resume || null,
      };

      const response = await createCandidate(candidateData);

      if (response && typeof response === 'object' && response.data) {
        await getCandidatesData();

        addCandidatePopup.close();
      } else {
        // Если ответ не является объектом с data, это ошибка
        console.warn('[handleFormSubmit] Неожиданный формат ответа:', response);
        const errorMessage =
          typeof response === 'string'
            ? response
            : response?.message || 'Неизвестная ошибка сервера';

        const errors = parseServerErrors({
          message: errorMessage,
          response: {
            status: 500,
            _data: { message: errorMessage },
          },
        });
        serverErrors.value = errors;
      }
    } catch (error: any) {
      console.error('[handleFormSubmit] Ошибка при создании кандидата:', error);
      // Обработка ошибок сервера
      const errors = parseServerErrors(error);
      console.log('[handleFormSubmit] Распарсенные ошибки:', errors);
      serverErrors.value = errors; // Передаем ошибки в форму
    } finally {
      isSubmitting.value = false;
    }
  };

  // Обработка отмены формы
  const handleFormCancel = () => {
    addCandidatePopup.close();
  };

  getCandidatesData();

  watch(
    selected,
    newSelected => {
      const allChecked = data.value.every(item => newSelected[item.id]);
      const noneChecked = data.value.every(item => !newSelected[item.id]);

      allSelected.value = allChecked;

      if (!allChecked && !noneChecked) {
        console.log('Частично выбрано');
      }
    },
    { deep: true }
  );

  // watch(
  //   isAddCandidatePopup,
  //   newValue => {
  //     if (newValue) {
  //       disableBodyScroll();
  //     } else {
  //       nextTick(() => {
  //         enableBodyScroll();
  //       });
  //     }
  //   },
  //   { immediate: false }
  // );
</script>

<template>
  <div class="container pb-28 pt-6">
    <div class="relative mb-15px rounded-fifteen bg-white p-25px">
      <div class="mb-50px flex items-center justify-between">
        <div class="flex flex-col gap-2.5">
          <h2 class="mb-2.5 text-xl font-semibold leading-normal text-space">
            Кандидаты
          </h2>
          <p class="text-sm font-normal text-slate-custom">
            Раздел для управления кандидатами
          </p>
        </div>
        <UiButton
          v-if="userRole === 'admin'"
          size="semiaction"
          variant="action"
          @click="addCandidatePopup.open()"
        >
          Добавить кандидата
        </UiButton>
      </div>
      <div class="absolute left-0 top-[103px] h-[1px] w-full bg-athens"></div>
      <div class="flex gap-x-15px">
        <MyInput
          placeholder="Поиск по кандидатам или ключевым фразам"
          :search="true"
        />
        <div class="flex gap-x-15px">
          <BtnIcon
            icon="sort-list"
            :isActive="isActiveSort"
            :tooltipText="actionSort"
            @click="sortToggleActive()"
          />
          <BtnIcon
            icon="funnel"
            :isActive="isActiveFunnel"
            :tooltipText="actionFunnel"
            @click="funnelToggleActive()"
          />
        </div>
      </div>
    </div>
    <div>
      <div v-if="loadingCandidates" class="absolute left-1/2 top-1/2">
        <UiDotsLoader />
      </div>
      <!-- table cans on grid -->
      <div class="table-container" v-else>
        <!-- header -->
        <div class="table-header">
          <div>
            <MyCheckbox
              id="select-all"
              :label="''"
              v-model="allSelected"
              @update:modelValue="toggleAll"
              :emptyLabel="true"
            />
          </div>
          <div class="px-2.5">Кандидат</div>
          <div class="px-2.5">Источник</div>
          <div class="px-2.5">Резюме</div>
          <div class="px-2.5">Вакансия</div>
          <div class="px-2.5">Этап</div>
        </div>

        <!-- body -->
        <div class="table-body">
          <div v-for="item in candidatesList" :key="item.id" class="table-row">
            <div>
              <MyCheckbox
                :id="item.id"
                :label="''"
                v-model="selected[item.id]"
                :emptyLabel="true"
              />
            </div>
            <div class="flex items-center gap-2.5 p-2.5">
              <UiAvatar size="candidate">
                <UiAvatarImage
                  src="https://github.com/radix-vue.png"
                  alt="@radix-vue"
                />
                <UiAvatarFallback>
                  {{ item.surname[0]
                  }}{{ item.firstname ? item.firstname[0] : '' }}
                </UiAvatarFallback>
              </UiAvatar>
              <div>
                <p
                  class="mb-5px cursor-pointer text-sm font-medium leading-[170%] text-space"
                  @click="goToCandidate(item.id)"
                >
                  {{ item.surname }} {{ item.firstname }}
                </p>
                <div class="flex gap-2.5">
                  <span
                    v-for="tag in item.tags"
                    :key="tag.id"
                    class="text-13px font-normal text-dodger"
                  >
                    {{ tag.name }}
                  </span>
                </div>
              </div>
            </div>
            <div class="px-2.5">
              <CardIcon
                icon="hh"
                :isPng="false"
                imagePath="hh"
                :width="21"
                :height="21"
              />
            </div>
            <div class="px-2.5 text-sm font-normal text-space">
              {{ item.resume }}
            </div>
            <div class="px-2.5 text-sm font-normal text-space">
              {{ item.vacancy }}
            </div>
            <div class="px-2.5 text-sm font-normal text-space">
              {{ 'Новый' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- pagination block -->
    <Pagination
      v-if="lastPage > 1"
      :currentPage="currentPage"
      :lastPage="lastPage"
      @page-changed="handlePageChange"
    />
    <!-- popup -->
    <div v-if="userRole === 'admin'">
      <transition name="fade">
        <Popup
          :isOpen="addCandidatePopup.isOpen"
          @close="addCandidatePopup.close"
          :width="'490px'"
          :showCloseButton="false"
          :disableOverflowHidden="true"
          :overflowContainer="true"
          maxHeight
          :lgSize="true"
        >
          <!-- администратор -->
          <p class="mb-[39px] text-xl font-semibold leading-normal text-space">
            Новый кандидат
          </p>

          <div
            v-if="isSuccess"
            class="border-green-200 bg-green-50 text-green-700 mb-4 rounded-ten border p-4"
          >
            {{ successMessage }}
          </div>

          <div
            v-if="serverErrors._general"
            class="mb-4 rounded-ten border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {{ serverErrors._general }}
          </div>

          <DynamicForm
            :config="candidateFormConfig"
            :model-value="candidateFormData"
            :server-errors="serverErrors"
            :loading="isSubmitting"
            @submit="handleFormSubmit"
            @cancel="handleFormCancel"
          />
        </Popup>
      </transition>
    </div>
  </div>
</template>

<style scoped>
  .table-container {
    display: grid;
    grid-template-rows: auto;
    gap: 1px;
  }

  .table-header,
  .table-row {
    display: grid;
    grid-template-columns: 1.778% 26.667% 8% 17.778% 17.778% 23.556%;
    gap: 10px;
    padding: 26px 25px;
    align-items: center;
  }

  .table-row {
    padding-top: 0;
    padding-bottom: 0;
  }

  .table-header {
    background-color: #f5f7fa;
    border-radius: 15px 15px 0 0;
    font-weight: 500;
    font-size: 14px;
    color: #79869a;
    text-align: left;
  }

  .table-row {
    background-color: #ffffff;
  }

  .table-row:not(:last-child) {
    margin-bottom: 1px;
  }

  .table-row:last-child {
    border-radius: 0 0 15px 15px;
  }
</style>
