<template>
    <div class="container pb-72 pt-6">
        <div class="flex justify-between bg-white rounded-fifteen p-25px items-center mb-15px">
            <div>
                <p class="text-xl font-semibold text-space mb-2.5">Ваша команда</p>
                <p class="text-sm font-normal text-slate-custom">
                    Вы можете пригласить как пользователя, уже зарегистрированного в системе, так и нового пользователя (по E-mail)
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
          :parentRounded="true"
          :contentRounded="false"
          :contentPadding="false"
        >
            <!-- Первое окно: Новый участник -->
            <div class="team-invite-popup__content flex flex-col gap-y-5">
                <p class="text-xl font-semibold text-space">Новый участник</p>
                <p class="text-sm font-normal leading-relaxed text-slate-custom">
                    Выберите роль в вакансии и укажите человека — из вашей команды в Наймикс или пригласите по email нового участника.
                    На почту уйдёт письмо с доступом.
                </p>

                <div>
                <div class="flex gap-x-1 mb-3 items-center">
                    <span class="text-red">*</span>
                    <p class="text-sm font-medium text-space leading-normal">Роль в вакансии</p>
                </div>
                <MultiDropdown
                  v-model="selectedRole"
                  :options="optionsData"
                  placeholder="Выберите роль"
                  class="w-full"
                />
                </div>

                <div>
                    <p class="text-sm font-medium text-space mb-3">Кого добавить</p>
                    <BtnTab
                      v-model="inviteMode"
                      :tabs="inviteModeTabs"
                    />
                </div>

                <template v-if="inviteMode === 'existing'">
                    <p class="text-sm text-slate-custom">
                        Найдите сотрудника, который уже есть в вашей организации.
                    </p>
                    <div>
                        <div class="flex gap-x-1 mb-3 items-center">
                            <span class="text-red">*</span>
                            <p class="text-sm font-medium text-space leading-normal">Сотрудник</p>
                        </div>
                        <response-input
                          placeholder="Имя или email"
                          :modelValue="selectedEmployee?.name ?? ''"
                          :responses="employeesNotInTeam"
                          :showRoles="true"
                          notFound="Никого не найдено — пригласите по email"
                          @update:modelValue="onSelectExistingEmployee"
                        />
                    </div>
                </template>

                <template v-else>
                    <div>
                        <p class="text-sm text-slate-custom mb-3">
                            Отправим приглашение на почту. После регистрации человек появится в команде вакансии.
                        </p>
                        <div>
                            <div class="flex gap-x-1 mb-3 items-center">
                                <span class="text-red">*</span>
                                <p class="text-sm font-medium text-space leading-normal">Email</p>
                            </div>
                            <MyInput
                              v-model="emailInvoice"
                              type="email"
                              placeholder="name@company.ru"
                              class="w-full"
                              @input="errorMessage = null"
                            />
                        </div>
                        <div class="mt-4">
                            <p class="text-sm font-medium text-space mb-3">Телефон</p>
                            <PhoneInput
                              v-model="externalInvitePhone"
                              class="w-full"
                              @input="errorMessage = null"
                            />
                        </div>
                        <div class="mt-4">
                            <p class="text-sm font-medium text-space mb-3">Фамилия и имя пользователя</p>
                            <MyInput
                              v-model="externalInviteName"
                              placeholder="Иванов Иван"
                              class="w-full"
                            />
                        </div>
                    </div>
                </template>

                <div class="flex gap-x-3">
                    <UiButton
                      variant="action"
                      size="action"
                      :disabled="isInviting"
                      @click="submitInvite"
                    >
                      {{ isInviting ? 'Отправка…' : 'Пригласить' }}
                    </UiButton>
                    <UiButton variant="back" size="back" :disabled="isInviting" @click="closePopup">
                      Отмена
                    </UiButton>
                </div>
                <p v-if="errorMessage" class="text-red-500 text-xs">
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
          :parentRounded="true"
          :contentRounded="false"
          :contentPadding="false"
        >
            <!-- Второе окно: Приглашение отправлено -->
            <div v-if="activePopup === 'confirmation'" class="team-invite-popup__content flex flex-col gap-y-6">
                <p class="text-xl font-semibold text-space">Готово</p>
                <p class="text-sm font-normal leading-relaxed text-slate-custom">
                    <template v-if="confirmationWasExternal">
                        На адрес <span class="font-medium text-space">{{ confirmationEmail }}</span> отправлено письмо
                        с регистрацией. После входа участник появится в команде вакансии.
                    </template>
                    <template v-else>
                        <span class="font-medium text-space">{{ confirmationName }}</span> добавлен в команду вакансии.
                    </template>
                </p>
                <div class="flex gap-x-3">
                    <UiButton variant="action" size="semiaction" @click="closePopup">Хорошо</UiButton>
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

import Popup from '~/components/custom/Popup.vue';
import MultiDropdown from '~/components/custom/MultiDropdown.vue';
import BtnTab from '~/components/custom/BtnTab.vue';
import MyInput from '~/components/custom/MyInput.vue';
import PhoneInput from '~/components/custom/PhoneInput.vue';
import { teamList, employeesList, removeFromTeam } from '@/utils/executorsList';
import ResponseInput from '~/components/custom/ResponseInput.vue';
import TableUsers from '@/components/custom/TableUsers.vue';
import { useRoute } from 'vue-router';
import { updateVacancyApi as updateVacancy } from '@/utils/getVacancies';
import { registerClient } from '@/utils/registerUser';

const props = defineProps({
    id: { type: [String, Number], default: null },
});

const selected = ref({}); // Выбранные чекбоксы
const allSelected = ref(false);
const hoveredIndex = ref(null);
const isPopupOpen = ref(false); // control visibility popup
const emailInvoice = ref('');
const externalInviteName = ref('');
const externalInvitePhone = ref('');
const inviteMode = ref('existing');
const inviteModeTabs = [
    { label: 'Уже в системе', value: 'existing' },
    { label: 'Нового по email', value: 'email' },
];
const isInviting = ref(false);
const confirmationEmail = ref('');
const confirmationName = ref('');
const confirmationWasExternal = ref(false);
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

watch(inviteMode, () => {
    selectedEmployee.value = null;
    emailInvoice.value = '';
    externalInviteName.value = '';
    externalInvitePhone.value = '';
    errorMessage.value = null;
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
    inviteMode.value = 'existing';
    externalInviteName.value = '';
    externalInvitePhone.value = '';
}

function closePopup() {
    isPopupOpen.value = false;
    activePopup.value = 'invite';
    resetForm();
    emailInvoice.value = '';
    confirmationEmail.value = '';
    confirmationName.value = '';
    confirmationWasExternal.value = false;
    isInviting.value = false;
    userToDelete.value = null;
    deleteErrorMessage.value = null;
    enableBodyScroll();
}

function onSelectExistingEmployee(name, id, email) {
    emailInvoice.value = email ?? '';
    selectedEmployee.value =
        id != null
            ? employeesNotInTeam.value.find((emp) => emp.id === id) || null
            : null;
    errorMessage.value = null;
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function formatPhoneForApi(phone) {
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('8')) {
        digits = '7' + digits.slice(1);
    }
    if (digits.length === 10) {
        digits = '7' + digits;
    }
    if (digits.length === 11 && digits.startsWith('7')) {
        return `+${digits}`;
    }
    return String(phone || '').trim() || undefined;
}

/** CRM role_id для регистрации нового пользователя по типу доступа в вакансии */
function crmRoleIdForVacancyAccess(vacancyRoleId) {
    if (vacancyRoleId === 5) return 5;
    return 3;
}

function registerPathForVacancyAccess(vacancyRoleId) {
    return vacancyRoleId === 5 ? 'register-client' : 'register-recruiter';
}

async function resolveCustomerIdByEmail(email) {
    const normalized = email.trim().toLowerCase();
    let list = employees.value;
    let found = list.find((e) => (e.email || '').toLowerCase() === normalized);
    if (found?.id) return found.id;

    const refreshed = await employeesList();
    employees.value = Array.isArray(refreshed) ? refreshed : [];
    found = employees.value.find((e) => (e.email || '').toLowerCase() === normalized);
    return found?.id ?? null;
}

async function inviteByEmail() {
    const email = emailInvoice.value.trim();
    if (!isValidEmail(email)) {
        errorMessage.value = 'Укажите корректный email';
        return null;
    }

    const name =
        externalInviteName.value.trim() ||
        email.split('@')[0]?.replace(/[._-]/g, ' ') ||
        email;

    const vacancyRoleId = Number(selectedRole.value?.id);
    const path = registerPathForVacancyAccess(vacancyRoleId);
    const phoneValue = formatPhoneForApi(externalInvitePhone.value);
    const payload = {
        name,
        email,
        login: email,
        role_id: crmRoleIdForVacancyAccess(vacancyRoleId),
        ...(phoneValue ? { phone: phoneValue } : {}),
    };

    const { error, message } = await registerClient(path, payload);
    if (error) {
        const existingId = await resolveCustomerIdByEmail(email);
        if (existingId) return existingId;
        errorMessage.value =
            message || 'Не удалось отправить приглашение. Проверьте email или выберите «Уже в системе».';
        return null;
    }

    const customerId = await resolveCustomerIdByEmail(email);
    if (!customerId) {
        errorMessage.value =
            'Приглашение отправлено, но не удалось добавить в вакансию. Обновите страницу и попробуйте снова.';
        return null;
    }
    return customerId;
}

async function addMemberToVacancyTeam(customerId, displayEmail, displayName, wasExternal) {
    const updateData = {
        role_id: selectedRole.value?.id ? Number(selectedRole.value.id) : null,
        customer_role: Number(customerId),
    };

    const result = await updateVacancy(currectVacancyId.value, updateData);
    if (result.error) {
        errorMessage.value =
            typeof result.error === 'string' ? result.error : 'Не удалось добавить в команду вакансии';
        return false;
    }

    const addedRoleName = selectedRole.value?.title ?? selectedRole.value?.name ?? '';
    let newList = await teamList(String(currectVacancyId.value));
    if (customerId && !newList.some((u) => u.id === customerId)) {
        newList = [
            ...newList,
            {
                id: customerId,
                name: displayName,
                email: displayEmail,
                role: addedRoleName,
                invitationPending: wasExternal,
            },
        ];
    }
    users.value = newList;

    confirmationEmail.value = displayEmail;
    confirmationName.value = displayName;
    confirmationWasExternal.value = wasExternal;
    resetForm();
    activePopup.value = 'confirmation';
    return true;
}

async function submitInvite() {
    errorMessage.value = null;

    if (!selectedRole.value) {
        errorMessage.value = 'Выберите роль в вакансии';
        return;
    }
    if (!currectVacancyId.value) {
        errorMessage.value = 'Сначала сохраните вакансию';
        return;
    }

    isInviting.value = true;
    try {
        if (inviteMode.value === 'existing') {
            if (!selectedEmployee.value?.id) {
                errorMessage.value = 'Выберите сотрудника из списка';
                return;
            }
            await addMemberToVacancyTeam(
                selectedEmployee.value.id,
                selectedEmployee.value.email ?? '',
                selectedEmployee.value.name ?? '',
                false
            );
            return;
        }

        const customerId = await inviteByEmail();
        if (!customerId) return;

        const email = emailInvoice.value.trim();
        const name =
            externalInviteName.value.trim() ||
            email.split('@')[0]?.replace(/[._-]/g, ' ') ||
            email;
        await addMemberToVacancyTeam(customerId, email, name, true);
    } catch (err) {
        console.error('Ошибка при приглашении:', err);
        const body = err?.data ?? err?.response?.data ?? err?.response?._data;
        const serverMsg = body?.message ?? body?.error;
        errorMessage.value = serverMsg
            ? typeof serverMsg === 'string'
                ? serverMsg
                : JSON.stringify(serverMsg)
            : 'Произошла ошибка при приглашении';
    } finally {
        isInviting.value = false;
    }
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

.team-invite-popup__content {
    padding: 0;
}
</style>