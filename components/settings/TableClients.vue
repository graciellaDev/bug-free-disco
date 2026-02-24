<template>
    <div v-if="props.list.length === 0" class="w-full min-h-[223px] bg-white rounded-fifteen flex justify-center items-center text-bali">
        {{ props.emptyText }}
    </div>
    <div v-else class="w-full h-full bg-white rounded-fifteen overflow-hidden flex flex-col min-h-0">
        <TableUsers
          :users="groupedSections.length ? [] : props.list"
          :groupedSections="groupedSections"
          :dropdownOptions="['Удалить', 'Редактировать', 'Изменить пароль']"
          :statusText="statusText"
          @delete-user="openDeleteConfirm"
          @edit-user="openEditPopup"
          @change-password="openPasswordPopup"
        />
    </div>

    <!-- Подтверждение удаления -->
    <Popup
      :isOpen="!!userToDelete"
      @close="userToDelete = null"
      width="490px"
      :showCloseButton="false"
      :lgSize="true"
      :parentRounded="true"
      :contentPadding="false"
    >
      <div class="popup-delete-content flex flex-col gap-y-6">
        <h2 class="text-xl font-semibold text-space">
          Подтверждение удаления
        </h2>
        <p class="text-sm text-slate-custom">
          Вы уверены, что хотите удалить сотрудника
          <strong v-if="userToDelete">{{ userToDelete.name }}</strong>
          из списка?
        </p>
        <div class="flex gap-x-3">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-red-500 hover:bg-red-600 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold"
            @click="confirmDelete"
          >
            Удалить
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
            @click="userToDelete = null"
          >
            Отмена
          </button>
        </div>
      </div>
    </Popup>

    <!-- Редактирование сотрудника -->
    <Popup
      :isOpen="!!userToEdit"
      @close="userToEdit = null"
      :width="'490px'"
      :showCloseButton="false"
      :lgSize="true"
      :parentRounded="true"
      :contentPadding="false"
      :disableOverflowHidden="true"
      :overflowVisible="true"
    >
      <FormAddRecruiter
        v-if="userToEdit"
        mode="edit"
        :initialData="userToEdit"
        @close="userToEdit = null"
        @save="onSaveEdit"
      />
    </Popup>

    <!-- Смена пароля сотрудника -->
    <Popup
      :isOpen="!!userToChangePassword"
      @close="closePasswordPopup"
      width="490px"
      :showCloseButton="false"
      :lgSize="true"
      :parentRounded="true"
      :contentPadding="false"
      :disableOverflowHidden="true"
      :overflowVisible="true"
    >
      <div v-if="userToChangePassword" class="popup-password-form flex flex-col">
        <p class="text-xl font-semibold text-space mb-6">Смена пароля</p>
        <form @submit.prevent="submitPasswordChange" class="flex flex-col gap-0">
          <div class="w-full mb-4">
            <p class="text-sm font-medium text-space mb-3.5">
              Новый пароль <span class="text-red-500">*</span>
            </p>
            <PasswordInput
              v-model="passwordForm.password"
              placeholder="Введите новый пароль"
              :invalid="(passwordForm.touchedPassword && !passwordForm.password) || (passwordForm.submitted && !passwordForm.password) || (!!passwordForm.password && passwordForm.password.length < 6)"
              @blur="passwordForm.touchedPassword = true"
            />
            <p v-if="(passwordForm.touchedPassword || passwordForm.submitted) && !passwordForm.password" class="text-red-500 text-xs mt-1">
              Введите новый пароль
            </p>
            <p v-if="passwordForm.password && passwordForm.password.length < 6" class="text-red-500 text-xs mt-1">
              Пароль должен быть не менее 6 символов
            </p>
          </div>
          <div class="w-full mb-6">
            <p class="text-sm font-medium text-space mb-3.5">
              Пароль еще раз <span class="text-red-500">*</span>
            </p>
            <PasswordInput
              v-model="passwordForm.passwordAgain"
              placeholder="Повторите пароль"
              :invalid="(passwordForm.touchedPasswordAgain && !passwordForm.passwordAgain) || (passwordForm.submitted && !passwordForm.passwordAgain) || (!!passwordForm.password && !!passwordForm.passwordAgain && passwordForm.password !== passwordForm.passwordAgain)"
              @blur="passwordForm.touchedPasswordAgain = true"
            />
            <p v-if="(passwordForm.touchedPasswordAgain || passwordForm.submitted) && !passwordForm.passwordAgain" class="text-red-500 text-xs mt-1">
              Повторите пароль
            </p>
            <p v-if="passwordForm.password && passwordForm.passwordAgain && passwordForm.password !== passwordForm.passwordAgain" class="text-red-500 text-xs mt-1">
              Пароли не совпадают
            </p>
          </div>
          <div class="flex gap-x-3">
            <button
              type="submit"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-dodger text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold"
            >
              Сохранить
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
              @click="closePasswordPopup"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </Popup>
</template>

<script setup>
import TableUsers from '../custom/TableUsers.vue';
import Popup from '@/components/custom/Popup.vue';
import FormAddRecruiter from './FormAddRecruiter.vue';
import PasswordInput from '@/components/custom/PasswordInput.vue';
import { groupClientsByRoleSection } from '@/utils/clientsList';
import { changeEmployeePassword } from '@/utils/registerUser';

const props = defineProps({
    typeList: {
        type: String,
        default: 'list'
    },
    list: {
        type: Array,
        default: () => []
    },
    emptyText: {
        type: String,
        default: 'Список пуст'
    }
});

const emit = defineEmits(['update', 'delete-user', 'save-edit']);

const statusText = computed(() => {
  return props.typeList === 'invites'
    ? 'Сотрудник еще не принял приглашение, отправленное на почту'
    : 'Активен';
});

/** Для вкладки «Все сотрудники» — группировка по ролям (Администраторы, Рекрутеры, Заказчики). Пустые разделы не показываются. */
const groupedSections = computed(() => {
  if (props.typeList !== 'list' || !props.list?.length) return [];
  return groupClientsByRoleSection(props.list);
});

const userToDelete = ref(null);
const userToEdit = ref(null);
const userToChangePassword = ref(null);
const passwordForm = reactive({
  password: '',
  passwordAgain: '',
  touchedPassword: false,
  touchedPasswordAgain: false,
  submitted: false,
  error: '',
});

function openDeleteConfirm(user) {
  userToDelete.value = user;
}

function openEditPopup(user) {
  userToEdit.value = user;
}

function openPasswordPopup(user) {
  userToChangePassword.value = user;
  passwordForm.password = '';
  passwordForm.passwordAgain = '';
  passwordForm.touchedPassword = false;
  passwordForm.touchedPasswordAgain = false;
  passwordForm.submitted = false;
  passwordForm.error = '';
}

function closePasswordPopup() {
  userToChangePassword.value = null;
  passwordForm.password = '';
  passwordForm.passwordAgain = '';
  passwordForm.error = '';
}

async function submitPasswordChange() {
  passwordForm.touchedPassword = true;
  passwordForm.touchedPasswordAgain = true;
  passwordForm.submitted = true;
  if (!passwordForm.password || !passwordForm.passwordAgain) {
    return;
  }
  if (passwordForm.password !== passwordForm.passwordAgain) {
    return;
  }
  if (passwordForm.password.length < 6) return;
  const userId = userToChangePassword.value?.id ?? userToChangePassword.value?.user_id;
  if (!userId) return;
  const { error, message } = await changeEmployeePassword(Number(userId), {
    password: passwordForm.password,
    password_confirmation: passwordForm.passwordAgain,
  });
  if (error) {
    passwordForm.error = message || 'Ошибка смены пароля';
    return;
  }
  closePasswordPopup();
  emit('update');
}

function confirmDelete() {
  const user = userToDelete.value;
  if (!user) return;
  const id = user.id ?? user.user_id;
  if (id == null || id === undefined) {
    console.warn('Удаление: у сотрудника нет id', user);
    userToDelete.value = null;
    return;
  }
  userToDelete.value = null;
  emit('delete-user', { ...user, id: Number(id) });
}

function onSaveEdit(payload) {
  emit('save-edit', payload);
  userToEdit.value = null;
  emit('update');
}
</script>

<style scoped>
/* При contentPadding=false в Popup один слой 25px — контент уже на 25px от края, свой padding не добавляем */
.popup-delete-content {
  padding: 0;
}
</style>
