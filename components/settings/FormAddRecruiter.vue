<template>
  <!-- -mr-[15px] компенсирует pr-[15px] у scrollContainer в Popup, чтобы отступы слева и справа были по 25px -->
  <div class="invite-recruiter-form flex flex-col max-h-[70vh] overflow-hidden -mr-[15px]">
    <div class="invite-recruiter-form__content flex flex-col min-h-0 min-w-0 flex-1">
      <header class="shrink-0 bg-white pb-4">
        <p class="text-xl font-semibold text-space mb-2.5">
          {{ isEditMode ? 'Редактирование сотрудника' : 'Приглашение сотрудника' }}
        </p>
        <p v-if="!isEditMode" class="text-sm font-normal text-bali mb-0">
          Приглашенному участнику придет письмо с доступом, которое нужно подтвердить.
        </p>
      </header>
      <!-- Скролл у правого края окна, контент формы с отступом справа -->
      <div class="invite-recruiter-form__scroll min-h-0 flex-1 overflow-y-auto -mr-[25px] pr-[25px]">
      <form @submit.prevent="isEditMode ? saveClient() : createClient()" class="pb-2">
        <!-- Основные поля — каждое с новой строки -->
        <div class="w-full mb-4">
          <p class="text-sm font-medium text-space mb-3.5">
            Имя <span class="text-red-500">*</span>
          </p>
          <MyInput
            v-model="data.firstName"
            placeholder="Имя"
            class="w-full"
            :error="touched.firstName && !data.firstName?.trim()"
            @blur="touched.firstName = true"
          />
          <p v-if="(touched.firstName && !data.firstName?.trim()) || errors.firstName" class="text-red-500 text-xs mt-1">
            {{ errors.firstName || 'Укажите имя' }}
          </p>
        </div>
        <div class="w-full mb-4">
          <p class="text-sm font-medium text-space mb-3.5">
            Фамилия <span class="text-red-500">*</span>
          </p>
          <MyInput
            v-model="data.lastName"
            placeholder="Фамилия"
            class="w-full"
            :error="touched.lastName && !data.lastName?.trim()"
            @blur="touched.lastName = true"
          />
          <p v-if="(touched.lastName && !data.lastName?.trim()) || errors.lastName" class="text-red-500 text-xs mt-1">
            {{ errors.lastName || 'Укажите фамилию' }}
          </p>
        </div>
        <div class="w-full mb-4">
          <p class="text-sm font-medium text-space mb-3.5">
            Почта, куда придет письмо с приглашением <span class="text-red-500">*</span>
          </p>
          <MyInput
            v-model="data.email"
            type="email"
            placeholder="email@example.com"
            class="w-full"
            :error="touched.email && !data.email?.trim()"
            @blur="touched.email = true"
          />
          <p v-if="(touched.email && !data.email?.trim()) || errors.email" class="text-red-500 text-xs mt-1">
            {{ errors.email || 'Укажите email' }}
          </p>
        </div>
        <div class="w-full mb-4">
          <p class="text-sm font-medium text-space mb-3.5">
            Телефон <span class="text-red-500">*</span>
          </p>
          <PhoneInput
            v-model="data.phone"
            class="w-full"
            :invalid="touched.phone && !data.phone?.trim()"
            @blur="touched.phone = true"
          />
          <p v-if="(touched.phone && !data.phone?.trim()) || errors.phone" class="text-red-500 text-xs mt-1">
            {{ errors.phone || 'Укажите телефон' }}
          </p>
        </div>
        <div class="w-full mb-6">
          <p class="text-sm font-medium text-space mb-3.5">
            Роль <span class="text-red-500">*</span>
          </p>
          <MyDropdown
            v-model="data.role"
            :options="roleOptions"
            placeholder="Выберите роль"
            class="w-full"
            :error="touched.role && !data.role"
            @open="touched.role = true"
          />
          <p v-if="(touched.role && !data.role) || errors.role" class="text-red-500 text-xs mt-1">
            {{ errors.role || 'Выберите роль' }}
          </p>
        </div>

      <!-- Дополнительная информация -->
      <p class="text-space text-xl font-semibold mb-4">
        Дополнительная информация
      </p>
      <div class="w-full mb-4">
        <p class="text-sm font-medium text-space mb-3.5">
          Должность
        </p>
        <MyInput
          v-model="data.position"
          placeholder="Должность"
          class="w-full"
        />
      </div>
      <div class="w-full mb-4">
        <p class="text-sm font-medium text-space mb-3.5">
          Отдел
        </p>
        <ResponseInput
          class="w-full"
          :responses="departments"
          :model-value="data.division ? data.division.name : ''"
          :showRoles="true"
          not-found="Отдел не найден"
          placeholder="Название отдела"
          @update:model-value="(name, id) => { data.division = (id != null && name != null) ? { id, name } : null }"
        />
      </div>
      <div class="w-full mb-6">
        <p class="text-sm font-medium text-space mb-3.5">
          Город
        </p>
        <CityAutocomplete
          :options="citiesOptions"
          :model-value="cityIdForAutocomplete"
          placeholder="Например, Москва, Санкт-Петербург"
          class="w-full"
          @update:model-value="onCitySelect"
        />
      </div>

      <!-- Кнопки -->
      <div class="flex gap-x-4 items-center flex-wrap">
        <button
          type="submit"
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-dodger text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-bold"
        >
          {{ isEditMode ? 'Сохранить' : 'Пригласить' }}
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
          @click="emit('close')"
        >
          Отмена
        </button>
        <p v-if="errors.response" class="text-red-500 text-xs">
          {{ errors.response }}
        </p>
      </div>
      <p v-if="success.status" class="text-green-500 text-xs mt-2">
        {{ success.message }}
      </p>
    </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import MyInput from '@/components/custom/MyInput.vue';
import PhoneInput from '@/components/custom/PhoneInput.vue';
import MyDropdown from '@/components/custom/MyDropdown.vue';
import ResponseInput from '@/components/custom/ResponseInput.vue';
import CityAutocomplete from '@/components/custom/CityAutocomplete.vue';
import { registerClient } from '@/utils/registerUser';
import { getDepartments } from '@/utils/executorsList';
import { getAreas } from '@/utils/hhAccount';

const ROLE_OPTIONS = [
  { id: 1, name: 'Администратор', value: 1 },
  { id: 3, name: 'Рекрутер', value: 3 },
  { id: 5, name: 'Заказчик', value: 5 },
];

const props = defineProps({
  mode: {
    type: String,
    default: 'invite', // 'invite' | 'edit'
  },
  initialData: {
    type: Object,
    default: null,
  },
});

const isEditMode = computed(() => props.mode === 'edit');

const emit = defineEmits(['update', 'close', 'save']);

const errors = ref({});
const touched = ref({
  firstName: false,
  lastName: false,
  email: false,
  phone: false,
  role: false,
});
const data = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: null,
  position: '',
  division: null,
  city: '',
});
const departments = ref([]);
const roleOptions = ref([]);
const citiesOptions = ref([]);
const success = ref({
  status: false,
  message: '',
});

/** id города для CityAutocomplete (по имени data.city ищется в citiesOptions) */
const cityIdForAutocomplete = computed(() => {
  const name = (data.value.city || '').trim();
  if (!name || !citiesOptions.value.length) return null;
  const found = citiesOptions.value.find(
    (c) => (c.name || c.city || '').toString().trim().toLowerCase() === name.toLowerCase()
  );
  return found ? found.id : null;
});

function onCitySelect(id) {
  if (id == null) {
    data.value.city = '';
    return;
  }
  const c = citiesOptions.value.find((x) => String(x.id) === String(id));
  data.value.city = c ? (c.name || c.city || '').toString() : '';
}

onMounted(async () => {
  try {
    departments.value = await getDepartments();
  } catch (e) {
    console.warn('getDepartments:', e?.message || e);
    departments.value = [];
  }
  roleOptions.value = [...ROLE_OPTIONS];
  const { data: areasData } = await getAreas();
  if (areasData && Array.isArray(areasData)) {
    citiesOptions.value = [...areasData];
  }
  if (props.mode === 'edit' && props.initialData) {
    fillFromInitialData(props.initialData);
  }
  const name = (data.value.city || '').trim();
  if (name && citiesOptions.value.length && !citiesOptions.value.some((c) => (c.name || '').trim().toLowerCase() === name.toLowerCase())) {
    citiesOptions.value = [{ id: name, name }, ...citiesOptions.value];
  }
});

watch(() => props.initialData, (val) => {
  if (props.mode === 'edit' && val) {
    fillFromInitialData(val);
  }
}, { immediate: true });

function fillFromInitialData(item) {
  const parts = (item.name || '').trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  const roleId = item.role_id ?? item.role?.id ?? item.role?.value ?? item.role;
  const roleOption = ROLE_OPTIONS.find(r => r.id === roleId || r.value === roleId) || null;
  data.value = {
    firstName,
    lastName,
    email: item.email || '',
    phone: item.phone || '',
    role: roleOption,
    position: item.position || '',
    division: item.division ? { id: item.division.id, name: item.division.name } : (item.departmentName ? { id: item.division_id, name: item.departmentName } : null),
    city: item.city || '',
  };
}

async function saveClient() {
  clearErrors();
  if (!data.value.firstName?.trim()) {
    errors.value.firstName = 'Укажите имя';
    return;
  }
  if (!data.value.lastName?.trim()) {
    errors.value.lastName = 'Укажите фамилию';
    return;
  }
  if (!data.value.email?.trim()) {
    errors.value.email = 'Укажите email';
    return;
  }
  if (!data.value.phone?.trim()) {
    errors.value.phone = 'Укажите телефон';
    return;
  }
  if (!data.value.role) {
    errors.value.role = 'Выберите роль';
    return;
  }
  const divisionId = data.value.division?.id ?? data.value.division;
  let phone = (data.value.phone || '').replace(/\D/g, '');
  if (phone.length === 11 && phone.startsWith('8')) {
    phone = '7' + phone.slice(1);
  }
  if (phone.length === 10) {
    phone = '7' + phone;
  }
  const phoneValue = phone.length === 11 && phone.startsWith('7') ? `+${phone}` : (data.value.phone || '').trim() || undefined;
  const roleId = data.value.role?.id ?? data.value.role?.value ?? data.value.role;
  const payload = {
    id: props.initialData?.id,
    name: `${data.value.firstName.trim()} ${data.value.lastName.trim()}`.trim(),
    email: data.value.email.trim(),
    phone: phoneValue,
    role_id: roleId != null ? Number(roleId) : null,
    department: divisionId != null ? Number(divisionId) : null,
    position: (data.value.position?.trim() ?? '') || null,
    city: (data.value.city?.trim() ?? '') || null,
  };
  emit('save', payload);
  emit('close');
}

function clearErrors() {
  errors.value = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    response: '',
  };
}

async function createClient() {
  clearErrors();

  if (!data.value.firstName?.trim()) {
    errors.value.firstName = 'Укажите имя';
    return;
  }
  if (!data.value.lastName?.trim()) {
    errors.value.lastName = 'Укажите фамилию';
    return;
  }
  if (!data.value.email?.trim()) {
    errors.value.email = 'Укажите email';
    return;
  }
  if (!data.value.phone?.trim()) {
    errors.value.phone = 'Укажите телефон';
    return;
  }
  if (!data.value.role) {
    errors.value.role = 'Выберите роль';
    return;
  }

  const roleId = data.value.role?.id ?? data.value.role?.value ?? data.value.role
  const divisionId = data.value.division?.id ?? data.value.division
  let phone = (data.value.phone || '').replace(/\D/g, '')
  if (phone.length === 11 && phone.startsWith('8')) {
    phone = '7' + phone.slice(1)
  }
  if (phone.length === 10) {
    phone = '7' + phone
  }
  const phoneValue = phone.length === 11 && phone.startsWith('7') ? `+${phone}` : (data.value.phone || '').trim() || undefined
  const payload = {
    name: `${data.value.firstName.trim()} ${data.value.lastName.trim()}`.trim(),
    email: data.value.email.trim(),
    login: data.value.email.trim(),
    phone: phoneValue ?? null,
    role_id: roleId != null ? Number(roleId) : null,
    department: divisionId != null ? Number(divisionId) : null,
    position: (data.value.position?.trim() ?? '') || null,
    city: (data.value.city?.trim() ?? '') || null,
  };
  if (payload.phone === null) delete payload.phone;

  const { data: response, error, message } = await registerClient(
    'register-recruiter',
    payload
  )

  if (error) {
    errors.value.response = message || 'Не удалось отправить приглашение. Проверьте данные и попробуйте снова.'
    success.value.status = false;
    success.value.message = '';
    return;
  }

  data.value = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: null,
    position: '',
    division: null,
    city: '',
  };
  touched.value = {
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    role: false,
  };
  clearErrors();
  success.value.status = true;
  success.value.message = message || 'Приглашение отправлено';
  emit('update');
  emit('close');
}
</script>

<style scoped>
.invite-recruiter-form {
  min-width: 0;
}
.invite-recruiter-form__content {
  width: 100%;
}
/* Полоса прокрутки у правого края окна */
.invite-recruiter-form__scroll {
  scrollbar-gutter: stable;
}
</style>
