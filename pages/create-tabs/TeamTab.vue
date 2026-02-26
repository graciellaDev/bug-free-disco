<template>
    <div class="container pb-72 pt-6">
        <div class="flex justify-between bg-white rounded-fifteen p-25px items-center mb-15px">
            <div>
                <p class="text-xl font-semibold text-space mb-2.5">Ваша команда</p>
                <p class="text-sm font-normal text-slate-custom">
                    Назначьте рекрутеров или заказчиков, которые будут взаимодействовать с&nbsp;этой вакансией
                </p>
            </div>
            <UiButton variant="black" size="black" class="font-bold" @click="openPopup">Добавить участников</UiButton>
        </div>
        <TableUsers variant="vacancyTeam" :users="users" :dropdownOptions="dropdownOptions" @delete-user="openDeletePopup" />
    </div>
    <transition v-if="activePopup === 'invite'" name="fade" @after-leave="enableBodyScroll">
        <Popup
          :isOpen="isPopupOpen"
          @close="closePopup"
          :showCloseButton="false"
          width="490px"
          :height="'fit-content'"
          :disableOverflowHidden="true"
          :contentPadding="false"
        >
            <!-- Первое окно: Новый участник -->
            <div>
                <p class="text-xl font-semibold text-space mb-2.5">Новый участник</p>
                <p class="text-sm font-normal text-slate-custom mb-25px">
                    Приглашенному участнику придет письмо с&nbsp;доступом, которое нужно подтвердить.
                </p>
                <div class="flex gap-x-1 mb-15px items-center">
                    <span class="text-red">*</span>
                    <p class="text-sm font-medium text-space leading-normal">Доступ</p>
                </div>
                <MultiDropdown v-model="selectedRole" :options="optionsData" class="mb-25px" />
                <div class="flex gap-x-1 mb-15px items-center">
                    <span class="text-red">*</span>
                    <p class="text-sm font-medium text-space leading-normal">Пользователь</p>
                </div>
                <response-input
                  class="mb-15px"
                  placeholder="Выберите рекрутера"
                  :modelValue="selectedEmployee?.name ?? ''"
                  :responses="employeesNotInTeam"
                  :showRoles="true"
                  @update:modelValue="(name, id, email) => {
                    emailInvoice = email ?? '';
                    selectedEmployee = id != null ? (employeesNotInTeam.find(emp => emp.id === id) || null) : null;
                  }"
                 />
                <!-- <EmailInput v-model="emailInvoice" class="mb-15px" /> -->
                <div class="flex gap-x-15px">
                    <UiButton variant="action" size="action" @click="switchToConfirmation">Пригласить</UiButton>
                    <UiButton variant="back" size="back" @click="closePopup">Отмена</UiButton>
                </div>
                <p class="text-red-500 text-xs mt-1" v-if="errorMessage">
                    {{ errorMessage }}
                </p>
            </div>
        </Popup>
    </transition>
    <transition v-if="activePopup === 'confirmation'" name="fade" @after-leave="enableBodyScroll">
        <Popup
          :isOpen="isPopupOpen"
          @close="closePopup"
          :showCloseButton="false"
          width="490px"
          :height="'fit-content'"
          :disableOverflowHidden="true"
          :contentPadding="false"
        >
            <!-- Второе окно: Приглашение отправлено -->
            <div v-if="activePopup === 'confirmation'">
                <p class="text-xl font-semibold text-space mb-2.5">Приглашение отправлено</p>
                <p class="text-sm font-normal text-slate-custom mb-25px">
                    Пользователю {{ emailInvoice }} направлено письмо с регистрацией в системе.
                    Вы получите уведомление, как только он примет ваше приглашение.
                </p>
                <div class="flex gap-x-15px">
                    <UiButton variant="action" size="semiaction" @click="closePopup">Хорошо</UiButton>
                    <UiButton variant="delete" size="delete" @click="cancelInvitation">Отменить приглашение</UiButton>
                </div>
            </div>
        </Popup>
    </transition>
    <transition v-if="activePopup === 'delete'" name="fade" @after-leave="enableBodyScroll">
        <Popup
          :isOpen="isPopupOpen"
          @close="closePopup"
          width="490px"
          :showCloseButton="false"
          :lgSize="true"
          :parentRounded="true"
          :contentRounded="false"
          :contentPadding="false"
        >
            <div class="popup-delete-content flex flex-col gap-y-6">
                <h2 class="text-xl font-semibold text-space">
                    Подтверждение удаления
                </h2>
                <p class="text-sm text-slate-custom">
                    Вы уверены, что хотите удалить сотрудника
                    <strong v-if="userToDelete">{{ userToDelete.name }}</strong>
                    из команды?
                </p>
                <p class="text-red-500 text-xs" v-if="deleteErrorMessage">
                    {{ deleteErrorMessage }}
                </p>
                <div class="flex gap-x-3">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-red-500 hover:bg-red-600 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold"
                      @click="confirmDelete"
                      :disabled="isDeleting"
                    >
                        {{ isDeleting ? 'Удаление...' : 'Удалить' }}
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
                      @click="closePopup"
                    >
                        Отмена
                    </button>
                </div>
            </div>
        </Popup>
    </transition>

</template>

<script setup>
import { ref, computed, onBeforeUnmount, watch, onMounted, onActivated, inject } from "vue";

import MyCheckbox from "~/components/custom/MyCheckbox.vue";
import DotsDropdonw from '~/components/custom/DotsDropdown.vue';
import CardIcon from '~/components/custom/CardIcon.vue';
import Popup from '~/components/custom/Popup.vue';
import MultiDropdown from '~/components/custom/MultiDropdown.vue';
import { teamList, employeesList, removeFromTeam } from "@/utils/executorsList";
import ResponseInput from "~/components/custom/ResponseInput.vue";
import TableUsers from "@/components/custom/TableUsers.vue";
import { useRoute } from 'vue-router'
import { updateVacancy } from '@/utils/getVacancies';

const props = defineProps({
    id: { type: [String, Number], default: null },
});

const selected = ref({}); // Выбранные чекбоксы
const allSelected = ref(false);
const hoveredIndex = ref(null);
const isPopupOpen = ref(false); // control visibility popup
const emailInvoice = ref('');
const activePopup = ref('invite'); // Текущее активное окно ('invite' or 'confirmation')
const employees = ref([]);
const users = ref([]);
const filterEmployees = ref('');
const selectedRole = ref(null);
const selectedEmployee = ref(null);
const errorMessage = ref(null);
const userToDelete = ref(null);
const isDeleting = ref(false);
const deleteErrorMessage = ref(null);
const route = useRoute();
// id вакансии: приоритет у prop от родителя (актуален после создания), затем route
const currectVacancyId = computed(() => props.id ?? route.params?.id ?? route.query?.id ?? null);
const saveAndContinueHandler = inject('saveAndContinueHandler', null);

async function loadTeamData() {
    try {
        const list = await employeesList();
        employees.value = Array.isArray(list) ? list : [];
    } catch (e) {
        console.error('Ошибка загрузки списка сотрудников:', e);
        employees.value = [];
    }
    const id = currectVacancyId.value;
    try {
        if (id) {
            users.value = await teamList(String(id));
        } else {
            // До сохранения вакансии показываем создателя (текущего пользователя) через GET /team/0
            users.value = await teamList('0');
        }
    } catch (e) {
        console.error('Ошибка загрузки команды вакансии:', e);
        users.value = [];
    }
}

onMounted(() => {
    if (saveAndContinueHandler) {
      saveAndContinueHandler.value = async () => {};
    }
    loadTeamData();
});

// Перезагрузка команды при появлении id вакансии (например после сохранения и редиректа)
watch(currectVacancyId, (id) => {
    if (id) loadTeamData();
}, { immediate: false });

// При переключении на вкладку «Команда» перезагружаем список (актуально после создания вакансии)
onActivated(() => {
    if (currectVacancyId.value) loadTeamData();
});

// В списке добавления показываем только тех, кто ещё не в команде
const employeesNotInTeam = computed(() => {
    const teamIds = new Set(users.value.map((u) => u.id));
    return employees.value.filter((emp) => !teamIds.has(emp.id));
});

// Функции для управления прокруткой
function disableBodyScroll() {
    document.body.style.overflow = 'hidden'; // Отключаем прокрутку
}

function enableBodyScroll() {
    document.body.style.overflow = ''; // Восстанавливаем прокрутку
}

function openPopup() {
    isPopupOpen.value = true;
    activePopup.value = 'invite';
    disableBodyScroll();
}

function resetForm() {
    errorMessage.value = null;
    selectedRole.value = null;
    selectedEmployee.value = null;
}

function closePopup() {
    isPopupOpen.value = false;
    activePopup.value = 'invite';
    resetForm();
    emailInvoice.value = '';
    userToDelete.value = null;
    deleteErrorMessage.value = null;
    enableBodyScroll();
}

async function switchToConfirmation() {
    if (selectedRole.value === null || selectedEmployee.value === null) {
        errorMessage.value = 'Пожалуйста, выберите роль и пользователя';
        return;
    }

    // Проверяем наличие ID вакансии
    if (!currectVacancyId.value) {
        errorMessage.value = 'ID вакансии не найден';
        return;
    }

    console.log('selectedEmployee', selectedEmployee);
    // Подготавливаем данные для обновления вакансии
    const updateData = {
        // executor_id: selectedEmployee.value.id || null,
        // executor_name: selectedEmployee.value.name || null,
        // executor_email: emailInvoice.value || selectedEmployee.value.email || null,
        // executor_phone: selectedEmployee.value.phone || null,
        role_id: selectedRole.value.id ? Number(selectedRole.value.id) : null,
        customer_role: selectedEmployee.value.id ? Number(selectedEmployee.value.id) : null,
    };

    try {
        // Отправляем запрос на обновление вакансии
        const result = await updateVacancy(currectVacancyId.value, updateData);

        if (result.error) {
            errorMessage.value = typeof result.error === 'string'
                ? result.error
                : 'Ошибка при обновлении вакансии';
            return;
        }

        const addedId = selectedEmployee.value?.id;
        const addedName = selectedEmployee.value?.name;
        const addedEmail = selectedEmployee.value?.email ?? emailInvoice.value;
        const addedRoleName = selectedRole.value?.title ?? selectedRole.value?.name ?? '';

        let newList = await teamList(currectVacancyId.value);
        if (addedId && !newList.some((u) => u.id === addedId)) {
            newList = [...newList, { id: addedId, name: addedName, email: addedEmail, role: addedRoleName }];
        }
        users.value = newList;

        // Очищаем форму только после успешного обновления
        resetForm();

        // Переключаемся на окно confirmation
        activePopup.value = 'confirmation';
    } catch (err) {
        console.error('Ошибка при обновлении вакансии:', err);
        const body = err?.data ?? err?.response?.data ?? err?.response?._data;
        const serverMsg = body?.message ?? body?.error;
        errorMessage.value = serverMsg
            ? (typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg))
            : 'Произошла ошибка при обновлении вакансии';
    }
}

function cancelInvitation() {
    alert('Приглашение отменено');
}

function openDeletePopup(user) {
    userToDelete.value = user;
    deleteErrorMessage.value = null;
    isPopupOpen.value = true;
    activePopup.value = 'delete';
    disableBodyScroll();
}

async function confirmDelete() {
    if (!userToDelete.value || !currectVacancyId.value) {
        deleteErrorMessage.value = 'Ошибка: не удалось определить сотрудника или вакансию';
        return;
    }

    isDeleting.value = true;
    deleteErrorMessage.value = null;

    try {
        const result = await removeFromTeam(currectVacancyId.value, userToDelete.value.id);

        if (result.error) {
            deleteErrorMessage.value = typeof result.error === 'string'
                ? result.error
                : 'Ошибка при удалении сотрудника';
            return;
        }

        // Обновляем список команды после успешного удаления
        users.value = await teamList(currectVacancyId.value);
        
        // Закрываем попап
        closePopup();
    } catch (error) {
        console.error('Ошибка при удалении сотрудника:', error);
        deleteErrorMessage.value = 'Произошла ошибка при удалении сотрудника';
    } finally {
        isDeleting.value = false;
    }
}

// Убедимся, что при размонтировании компонента скролл включится
onBeforeUnmount(() => {
    if (saveAndContinueHandler) {
      saveAndContinueHandler.value = null;
    }
    enableBodyScroll();
});

const optionsData = [
    {
        "id": 1,
        "title": "Согласующий",
        "description": "Могут участвовать в подборе, но не должны видеть зарплатные ожидания кандидатов"
    },
    {
        "id": 3,
        "title": "Рекрутер",
        "description": "Имеет доступ к кандидатам, комментариям и электронной почте. Может добавить вакансию  и команду."
    },
    {
        "id": 5,
        "title": "Заказчик",
        "description": "Имеет доступ к статистики, может оставлять комментарии и оценивать кандидатов."
    }
]

const dropdownOptions = ["Удалить"];

const toggleAll = (isChecked) => {
    users.value.forEach((item) => {
        selected.value[item.id] = isChecked;
    });
};

// Следить за изменениями состояния частных чекбоксов
watch(selected, (newSelected) => {
    // Проверяем, выбраны ли все элементы
    const allChecked = users.value.every(item => newSelected[item.id]);
    const noneChecked = users.value.every(item => !newSelected[item.id]);

    allSelected.value = allChecked; // Обновляем общий чекбокс

    // Логика для состояния "частично выбрано" (например, при необходимости в будущем)
    if (!allChecked && !noneChecked) {
        console.log("Частично выбрано"); // Для добавления UI-реакции
    }
}, { deep: true }); // Обязательно deep, так как мы следим за вложенными объектами
</script>

<style scoped>
/* Анимация появления и скрытия */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    /* transform: scale(0.95); */
    /* Небольшое уменьшение */
}

.fade-leave-from {
    opacity: 1;
    /* transform: scale(1); */
}
</style>