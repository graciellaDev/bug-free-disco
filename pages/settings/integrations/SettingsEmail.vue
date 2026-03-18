<script setup>
  import { ref, onMounted } from 'vue'
  import Popup from '~/components/custom/Popup.vue'
  import MyInput from '~/components/custom/MyInput.vue'
  import DotsDropdown from '~/components/custom/DotsDropdown.vue'
  import DeleteConfirmPopup from '~/components/custom/DeleteConfirmPopup.vue'
  import { getGmailAuthUrl, getConnectedEmails, disconnectConnectedEmail, updateConnectedEmail } from '~/utils/gmailAccount'
  import { getYandexAuthUrl } from '~/utils/yandexAccount'
  import { connectMailRu } from '~/utils/mailruAccount'
  import { connectRambler } from '~/utils/ramblerAccount'
  import { connectOtherMail } from '~/utils/otherMailAccount'
  import { employeesList } from '~/utils/executorsList'

  definePageMeta({
    layout: 'settings',
  })

  useHead({
    title: 'Настройки — Почта',
  })

  const emailProviders = [
    { id: 'google', name: 'Google' },
    { id: 'yandex', name: 'Yandex' },
    { id: 'mailru', name: 'Mail.ru' },
    { id: 'rambler', name: 'Rambler' },
    { id: 'naymix', name: '98109823@naymix.ru' },
    { id: 'other', name: 'Другая почта' },
  ]

  const isGmailPopupOpen = ref(false)
  const gmailEmail = ref('')
  const gmailLoading = ref(false)
  const gmailError = ref('')
  const isYandexPopupOpen = ref(false)
  const yandexEmail = ref('')
  const yandexLoading = ref(false)
  const yandexError = ref('')
  const messageFromQuery = ref('')
  const route = useRoute()
  const router = useRouter()

  const isMailRuPopupOpen = ref(false)
  const mailRuEmail = ref('')
  const mailRuPassword = ref('')
  const mailRuLoading = ref(false)
  const mailRuError = ref('')

  const isRamblerPopupOpen = ref(false)
  const ramblerEmail = ref('')
  const ramblerPassword = ref('')
  const ramblerLoading = ref(false)
  const ramblerError = ref('')

  const isOtherMailPopupOpen = ref(false)
  const otherMail = ref({
    email: '',
    password: '',
    imapServer: '',
    imapPort: '993',
    imapEncryption: 'none',
    smtpServer: '',
    smtpPort: '465',
    smtpEncryption: 'none',
  })
  const otherMailErrors = ref({ smtpServer: '' })
  const encryptionOptions = [
    { value: 'none', label: 'Без шифрования' },
    { value: 'ssl', label: 'SSL/TLS' },
    { value: 'tls', label: 'STARTTLS' },
  ]

  const connectedList = ref([])
  const connectedLoading = ref(false)
  const disconnectingId = ref(null)
  const itemToDelete = ref(null)

  const isEditPopupOpen = ref(false)
  const editItem = ref(null)
  const editAllowedIds = ref([])
  const editYandexPassword = ref('')
  const employeesForSelect = ref([])
  const editLoading = ref(false)
  const editError = ref('')

  async function loadConnected() {
    connectedLoading.value = true
    const { data, error } = await getConnectedEmails()
    connectedLoading.value = false
    if (!error) connectedList.value = data
  }

  onMounted(() => {
    loadConnected()
    const q = route.query
    if (q.mail_connected === '1') {
      if (q.provider === 'yandex') messageFromQuery.value = 'Почта Yandex успешно подключена.'
      else messageFromQuery.value = 'Почта Gmail успешно подключена.'
      loadConnected()
      clearSuccessErrorFromUrl()
    } else if (q.error) {
      const err = q.error
      if (err === 'missing_params') messageFromQuery.value = 'Ошибка: отсутствуют параметры от Google.'
      else if (err === 'invalid_state') messageFromQuery.value = 'Сессия истекла. Попробуйте подключить почту снова.'
      else if (err === 'token_exchange') messageFromQuery.value = 'Не удалось получить токен. Попробуйте ещё раз.'
      else if (err === 'no_token') messageFromQuery.value = 'Не получен токен доступа.'
      else if (err === 'no_email') messageFromQuery.value = 'Не удалось определить адрес почты. Попробуйте снова.'
      else messageFromQuery.value = 'Ошибка при подключении почты.'
      clearSuccessErrorFromUrl()
    }
  })

  function clearSuccessErrorFromUrl() {
    const q = { ...route.query }
    if (q.mail_connected !== undefined || q.error !== undefined || q.provider !== undefined) {
      delete q.mail_connected
      delete q.error
      delete q.provider
      router.replace({ path: route.path, query: Object.keys(q).length ? q : undefined })
    }
  }

  function selectProvider(id) {
    if (id === 'google') {
      gmailEmail.value = ''
      gmailError.value = ''
      isGmailPopupOpen.value = true
    }
    if (id === 'yandex') {
      yandexEmail.value = ''
      yandexError.value = ''
      isYandexPopupOpen.value = true
    }
    if (id === 'mailru') {
      mailRuEmail.value = ''
      mailRuPassword.value = ''
      mailRuError.value = ''
      isMailRuPopupOpen.value = true
    }
    if (id === 'rambler') {
      ramblerEmail.value = ''
      ramblerPassword.value = ''
      ramblerError.value = ''
      isRamblerPopupOpen.value = true
    }
    if (id === 'other') {
      otherMail.value = {
        email: '',
        password: '',
        imapServer: '',
        imapPort: '993',
        imapEncryption: 'none',
        smtpServer: '',
        smtpPort: '465',
        smtpEncryption: 'none',
      }
      otherMailErrors.value = { smtpServer: '' }
      isOtherMailPopupOpen.value = true
    }
  }

  function closeGmailPopup() {
    isGmailPopupOpen.value = false
    gmailError.value = ''
  }

  function closeYandexPopup() {
    isYandexPopupOpen.value = false
    yandexError.value = ''
  }

  function closeMailRuPopup() {
    isMailRuPopupOpen.value = false
    mailRuError.value = ''
  }

  function closeRamblerPopup() {
    isRamblerPopupOpen.value = false
    ramblerError.value = ''
  }

  async function submitMailRuConnect() {
    mailRuError.value = ''
    if (!mailRuEmail.value?.trim()) {
      mailRuError.value = 'Введите email'
      return
    }
    if (!mailRuPassword.value) {
      mailRuError.value = 'Введите пароль'
      return
    }
    mailRuLoading.value = true
    const { ok, message } = await connectMailRu(mailRuEmail.value, mailRuPassword.value)
    mailRuLoading.value = false
    if (ok) {
      messageFromQuery.value = message
      closeMailRuPopup()
      await loadConnected()
    } else {
      mailRuError.value = message
    }
  }

  async function submitRamblerConnect() {
    ramblerError.value = ''
    if (!ramblerEmail.value?.trim()) {
      ramblerError.value = 'Введите email'
      return
    }
    if (!ramblerPassword.value) {
      ramblerError.value = 'Введите пароль'
      return
    }
    ramblerLoading.value = true
    const { ok, message } = await connectRambler(ramblerEmail.value, ramblerPassword.value)
    ramblerLoading.value = false
    if (ok) {
      messageFromQuery.value = message
      closeRamblerPopup()
      await loadConnected()
    } else {
      ramblerError.value = message
    }
  }

  async function continueGmailAuth() {
    gmailError.value = ''
    gmailLoading.value = true
    const { url, error } = await getGmailAuthUrl(gmailEmail.value || undefined)
    gmailLoading.value = false
    if (error) {
      gmailError.value = error
      return
    }
    if (url) {
      window.location.href = url
    }
  }

  async function continueYandexAuth() {
    yandexError.value = ''
    yandexLoading.value = true
    const { url, error } = await getYandexAuthUrl(yandexEmail.value || undefined)
    yandexLoading.value = false
    if (error) {
      yandexError.value = error
      return
    }
    if (url) {
      window.location.href = url
    }
  }

  function closeOtherMailPopup() {
    isOtherMailPopupOpen.value = false
    otherMailErrors.value = { smtpServer: '' }
  }

  async function submitOtherMail() {
    otherMailErrors.value = { smtpServer: '' }
    if (!otherMail.value.email?.trim()) {
      otherMailErrors.value.smtpServer = 'Введите email'
      return
    }
    if (!otherMail.value.password) {
      otherMailErrors.value.smtpServer = 'Введите пароль'
      return
    }
    if (!otherMail.value.smtpServer?.trim()) {
      otherMailErrors.value.smtpServer = 'Сервер SMTP не может быть пустым'
      return
    }
    const port = otherMail.value.smtpPort?.trim() ? parseInt(otherMail.value.smtpPort, 10) : undefined
    if (otherMail.value.smtpPort?.trim() && (Number.isNaN(port) || port < 1 || port > 65535)) {
      otherMailErrors.value.smtpServer = 'Укажите корректный порт SMTP (1–65535)'
      return
    }
    const { ok, message } = await connectOtherMail({
      email: otherMail.value.email,
      password: otherMail.value.password,
      smtp_server: otherMail.value.smtpServer,
      smtp_port: port ?? otherMail.value.smtpPort,
      smtp_encryption: otherMail.value.smtpEncryption || undefined,
    })
    if (ok) {
      messageFromQuery.value = message
      closeOtherMailPopup()
      await loadConnected()
    } else {
      otherMailErrors.value.smtpServer = message
    }
  }

  function onConnectionMenuAction(item, action) {
    if (action === 'Удалить') {
      if (item.provider === 'naymix') return
      itemToDelete.value = item
    }
    if (action === 'Редактировать') {
      openEditPopup(item)
    }
  }

  function closeDeleteConfirm() {
    itemToDelete.value = null
  }

  async function confirmDeleteEmail() {
    if (!itemToDelete.value || itemToDelete.value.provider === 'naymix') return
    const item = itemToDelete.value
    disconnectingId.value = item.id
    const { error } = await disconnectConnectedEmail(item.id)
    disconnectingId.value = null
    closeDeleteConfirm()
    if (!error) await loadConnected()
    else messageFromQuery.value = error
  }

  function openEditPopup(row) {
    editItem.value = row
    editAllowedIds.value = Array.isArray(row.allowed_customer_ids) ? [...row.allowed_customer_ids] : []
    editYandexPassword.value = ''
    editError.value = ''
    isEditPopupOpen.value = true
    loadEmployeesForEdit()
  }

  function closeEditPopup() {
    isEditPopupOpen.value = false
    editItem.value = null
    editAllowedIds.value = []
    editYandexPassword.value = ''
  }

  async function loadEmployeesForEdit() {
    const list = await employeesList()
    employeesForSelect.value = Array.isArray(list) ? list : []
  }

  function toggleEditEmployee(id) {
    const idx = editAllowedIds.value.indexOf(id)
    if (idx === -1) editAllowedIds.value.push(id)
    else editAllowedIds.value.splice(idx, 1)
  }

  async function saveEditResponsibles() {
    if (!editItem.value) return
    editError.value = ''
    editLoading.value = true
    const payload = { allowed_customer_ids: editAllowedIds.value }
    if (editItem.value.provider === 'yandex') {
      payload.smtp_password = editYandexPassword.value.trim() || null
    }
    const { error } = await updateConnectedEmail(editItem.value.id, payload)
    editLoading.value = false
    if (!error) {
      closeEditPopup()
      await loadConnected()
      messageFromQuery.value = 'Ответственные сохранены.'
    } else {
      editError.value = error
    }
  }
</script>

<template>
  <div class="default-template">
    <h1 class="text-xl font-semibold text-space mb-6">Почта</h1>

    <div v-if="messageFromQuery" class="rounded-fifteen p-4 mb-6 text-sm font-medium"
      :class="(messageFromQuery.startsWith('Почта Gmail') || messageFromQuery.startsWith('Почта Yandex') || messageFromQuery.includes('Mail.ru подключена') || messageFromQuery.includes('Rambler подключена') || messageFromQuery.includes('Ответственные сохранены') || messageFromQuery.includes('Почта подключена')) ? 'bg-feta text-green' : 'bg-cinderella text-red-custom'">
      {{ messageFromQuery }}
    </div>

    <!-- Информационный баннер -->
    <div class="rounded-fifteen bg-zumthor border border-[#5898ff33] p-4 mb-6 flex gap-3">
      <div class="shrink-0 w-8 h-8 rounded-full bg-dodger flex items-center justify-center">
        <span class="text-white text-sm font-semibold leading-none">i</span>
      </div>
      <div class="min-w-0">
        <p class="text-sm text-space leading-150 mb-1">
          Подключите свой почтовый адрес и отправляйте письма прямо из системы.
        </p>
        <p class="text-sm text-bali leading-150 mb-1">
          Все отправленные письма будут сохраняться в папке «Отправленные» в вашем почтовом ящике.
        </p>
        <p class="text-sm text-bali leading-150">
          Входящие письма с подключённых ящиков подгружаются каждые 5 минут и отображаются в карточке кандидата в ленте событий.
        </p>
      </div>
    </div>

    <!-- Заголовок секции -->
    <h2 class="text-lg font-semibold text-space mb-5">
      Выберите почтовый сервис, с которого вы обычно отправляете письма кандидатам
    </h2>

    <!-- Сетка почтовых сервисов -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <button
        v-for="provider in emailProviders"
        :key="provider.id"
        type="button"
        class="email-card flex items-center gap-4 p-4 rounded-fifteen bg-white border border-athens text-left transition-colors hover:border-dodger hover:bg-zumthor/50 focus:outline-none focus:border-dodger"
        @click="selectProvider(provider.id)"
      >
        <div class="shrink-0 w-10 h-10 rounded-[10px] bg-athens-gray flex items-center justify-center text-bali">
          <svg-icon name="envelope20" width="20" height="20" class="text-current" />
        </div>
        <span class="text-sm font-medium text-space truncate">{{ provider.name }}</span>
      </button>
    </div>

    <!-- Подключённые аккаунты -->
    <section class="mt-10 pt-8 border-t border-athens">
      <h2 class="text-lg font-semibold text-space mb-4">Подключённые аккаунты</h2>
      <div v-if="connectedLoading" class="text-sm text-bali py-4">Загрузка...</div>
      <div v-else class="rounded-fifteen border border-athens overflow-visible">
        <table class="w-full text-left text-sm">
          <thead class="bg-athens-gray">
            <tr>
              <th class="py-3 px-4 font-medium text-space">Сервис</th>
              <th class="py-3 px-4 font-medium text-space">Email</th>
              <th class="py-3 px-4 font-medium text-space">Сотрудники</th>
              <th class="py-3 px-4 font-medium text-space">Статус</th>
              <th class="py-3 px-4 font-medium text-space w-20"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in connectedList"
              :key="item.id"
              class="border-t border-athens hover:bg-athens-gray/50"
            >
              <td class="py-3 px-4 text-space">{{ item.provider_name }}</td>
              <td class="py-3 px-4 text-bali">{{ item.email || '—' }}</td>
              <td class="py-3 px-4 text-bali">
                {{ (item.allowed_employee_names && item.allowed_employee_names.length) ? item.allowed_employee_names.join(', ') : 'Все' }}
              </td>
              <td class="py-3 px-4">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="item.status === 'connected' ? 'bg-feta text-green' : 'bg-cinderella text-red-custom'"
                >
                  {{ item.status_label }}
                </span>
              </td>
              <td class="py-3 px-4 relative z-20">
                <DotsDropdown
                  :items="item.provider === 'naymix' ? ['Редактировать'] : ['Редактировать', 'Удалить']"
                  @select-item="(action) => onConnectionMenuAction(item, action)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Подтверждение удаления почты (стиль как на странице «Сотрудники») -->
    <DeleteConfirmPopup
      :isOpen="!!itemToDelete"
      :loading="!!disconnectingId"
      confirm-label="Удалить"
      @close="closeDeleteConfirm"
      @confirm="confirmDeleteEmail"
    >
      Вы уверены, что хотите отключить почту
      <strong v-if="itemToDelete">{{ itemToDelete.email || itemToDelete.provider_name }}</strong>
      ? С этого адреса больше не получится отправлять письма кандидатам из системы.
    </DeleteConfirmPopup>

    <!-- Окно подключения Gmail -->
    <Popup :isOpen="isGmailPopupOpen" @close="closeGmailPopup" :width="'490px'" :contentPadding="false">
      <div class="popup-mail-content flex flex-col gap-y-6 p-[12.5px]">
        <p class="text-xl font-semibold text-space">Подключить Gmail</p>
        <p class="text-sm text-bali leading-150">Введите адрес почты Gmail, с которого будете отправлять письма кандидатам. После нажатия кнопки вы перейдёте на страницу авторизации Google.</p>
        <div>
          <label class="block text-sm font-medium text-space mb-2">Email</label>
          <MyInput
            v-model="gmailEmail"
            type="email"
            placeholder="example@gmail.com"
            class="w-full"
          />
        </div>
        <p v-if="gmailError" class="text-sm text-red-custom">{{ gmailError }}</p>
        <div class="flex gap-x-3 pt-1">
          <UiButton
            variant="action"
            size="semiaction"
            :disabled="gmailLoading"
            @click="continueGmailAuth"
          >
            {{ gmailLoading ? 'Загрузка...' : 'Войти через Google' }}
          </UiButton>
          <UiButton variant="back" size="second-back" @click="closeGmailPopup">Отмена</UiButton>
        </div>
      </div>
    </Popup>

    <!-- Окно подключения Yandex -->
    <Popup :isOpen="isYandexPopupOpen" @close="closeYandexPopup" :width="'490px'" :contentPadding="false">
      <div class="popup-mail-content flex flex-col gap-y-6 p-[12.5px]">
        <p class="text-xl font-semibold text-space">Подключить Yandex</p>
        <p class="text-sm text-bali leading-150">Введите адрес почты Yandex, с которого будете отправлять письма кандидатам. После нажатия кнопки вы перейдёте на страницу авторизации Yandex.</p>
        <div>
          <label class="block text-sm font-medium text-space mb-2">Email</label>
          <MyInput
            v-model="yandexEmail"
            type="email"
            placeholder="example@yandex.ru"
            class="w-full"
          />
        </div>
        <p v-if="yandexError" class="text-sm text-red-custom">{{ yandexError }}</p>
        <div class="flex gap-x-3 pt-1">
          <UiButton
            variant="action"
            size="semiaction"
            :disabled="yandexLoading"
            @click="continueYandexAuth"
          >
            {{ yandexLoading ? 'Загрузка...' : 'Войти через Yandex' }}
          </UiButton>
          <UiButton variant="back" size="second-back" @click="closeYandexPopup">Отмена</UiButton>
        </div>
      </div>
    </Popup>

    <!-- Окно подключения Mail.ru -->
    <Popup :isOpen="isMailRuPopupOpen" @close="closeMailRuPopup" :width="'490px'" :contentPadding="false">
      <div class="popup-mail-content flex flex-col gap-y-6 p-[12.5px]">
        <p class="text-xl font-semibold text-space">Подключить Mail.ru</p>
        <p class="text-sm text-bali leading-150">
          Укажите полный адрес ящика и пароль. При включённой двухфакторной аутентификации создайте в настройках Mail.ru пароль для внешнего приложения и используйте его здесь.
        </p>
        <div>
          <label class="block text-sm font-medium text-space mb-2">Email</label>
          <MyInput
            v-model="mailRuEmail"
            type="email"
            placeholder="example@mail.ru"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-space mb-2">Пароль</label>
          <MyInput
            v-model="mailRuPassword"
            type="password"
            placeholder="Пароль от почты"
            class="w-full"
            autocomplete="current-password"
          />
        </div>
        <p v-if="mailRuError" class="text-sm text-red-custom">{{ mailRuError }}</p>
        <div class="flex gap-x-3 pt-1">
          <UiButton
            variant="action"
            size="semiaction"
            :disabled="mailRuLoading"
            @click="submitMailRuConnect"
          >
            {{ mailRuLoading ? 'Проверка...' : 'Подключить' }}
          </UiButton>
          <UiButton variant="back" size="second-back" @click="closeMailRuPopup">Отмена</UiButton>
        </div>
      </div>
    </Popup>

    <!-- Окно подключения Rambler -->
    <Popup :isOpen="isRamblerPopupOpen" @close="closeRamblerPopup" :width="'490px'" :contentPadding="false">
      <div class="popup-mail-content flex flex-col gap-y-6 p-[12.5px]">
        <p class="text-xl font-semibold text-space">Подключить Rambler</p>
        <p class="text-sm text-bali leading-150">
          Укажите полный адрес (имя@rambler.ru) и пароль. В настройках почты включите доступ для почтовых программ: Настройки → Программы. Если включена двухфакторная аутентификация, нужен специальный пароль для клиента — его создают в Настройки → Безопасность.
          <a href="https://help.rambler.ru/mail/mail-pochtovye-klienty/1275" target="_blank" rel="noopener noreferrer" class="text-dodger hover:underline mt-1 inline-block">Подробнее в справке Rambler</a>
        </p>
        <div>
          <label class="block text-sm font-medium text-space mb-2">Email</label>
          <MyInput
            v-model="ramblerEmail"
            type="email"
            placeholder="example@rambler.ru"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-space mb-2">Пароль</label>
          <MyInput
            v-model="ramblerPassword"
            type="password"
            placeholder="Пароль от почты"
            class="w-full"
            autocomplete="current-password"
          />
        </div>
        <p v-if="ramblerError" class="text-sm text-red-custom">{{ ramblerError }}</p>
        <div class="flex gap-x-3 pt-1">
          <UiButton
            variant="action"
            size="semiaction"
            :disabled="ramblerLoading"
            @click="submitRamblerConnect"
          >
            {{ ramblerLoading ? 'Проверка...' : 'Подключить' }}
          </UiButton>
          <UiButton variant="back" size="second-back" @click="closeRamblerPopup">Отмена</UiButton>
        </div>
      </div>
    </Popup>

    <!-- Окно редактирования: ответственные сотрудники -->
    <Popup :isOpen="isEditPopupOpen" @close="closeEditPopup" :width="'490px'" :contentPadding="false">
      <div class="popup-mail-content flex flex-col gap-y-6 p-[12.5px]">
        <p class="text-xl font-semibold text-space">Редактировать подключение</p>
        <p v-if="editItem" class="text-sm text-bali leading-150">
          {{ editItem.provider_name }} — {{ editItem.email }}
        </p>
        <p class="text-sm text-bali leading-150">
          Выберите сотрудников, которые могут отправлять письма с этого ящика. Если никого не выбрать — ящик доступен всем.
        </p>
        <div v-if="editItem && editItem.provider === 'yandex'" class="rounded-ten border border-athens bg-athens-gray/30 p-3">
          <label class="block text-sm font-medium text-space mb-2">Пароль для отправки (Yandex)</label>
          <MyInput
            v-model="editYandexPassword"
            type="password"
            placeholder="Пароль приложения из Настройки → Пароль и безопасность"
            class="w-full"
            autocomplete="new-password"
          />
          <p class="text-xs text-bali mt-1.5">Нужен для отправки писем. Создайте в Yandex: Пароль и безопасность → Пароли приложений.</p>
        </div>
        <div class="max-h-48 overflow-y-auto rounded-ten border border-athens bg-athens-gray/30 p-3">
          <label
            v-for="emp in employeesForSelect"
            :key="emp.id"
            class="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-white/50 rounded px-2"
          >
            <input
              type="checkbox"
              :checked="editAllowedIds.includes(emp.id)"
              @change="toggleEditEmployee(emp.id)"
            />
            <span class="text-sm text-space">{{ emp.name || emp.email || '—' }}</span>
          </label>
          <p v-if="employeesForSelect.length === 0" class="text-sm text-bali py-2">Загрузка сотрудников...</p>
        </div>
        <p v-if="editError" class="text-sm text-red-custom">{{ editError }}</p>
        <div class="flex gap-x-3 pt-1">
          <UiButton
            variant="action"
            size="semiaction"
            :disabled="editLoading"
            @click="saveEditResponsibles"
          >
            {{ editLoading ? 'Сохранение...' : 'Сохранить' }}
          </UiButton>
          <UiButton variant="back" size="second-back" @click="closeEditPopup">Отмена</UiButton>
        </div>
      </div>
    </Popup>

    <!-- Окно «Другая почта» (IMAP/SMTP) -->
    <Popup :isOpen="isOtherMailPopupOpen" @close="closeOtherMailPopup" :width="'490px'" :contentPadding="false">
      <div class="popup-mail-content flex flex-col gap-y-5 p-[12.5px]">
        <div class="flex items-center gap-2">
          <div class="shrink-0 w-10 h-10 rounded-[10px] bg-athens-gray flex items-center justify-center text-bali">
            <svg-icon name="envelope20" width="20" height="20" class="text-current" />
          </div>
          <MyInput
            v-model="otherMail.email"
            type="email"
            placeholder="example@mail.ru"
            class="flex-1 min-w-0"
          />
        </div>
        <p class="text-sm text-bali leading-150">
          Письма, отправленные на <span v-if="otherMail.email" class="text-space font-medium">{{ otherMail.email }}</span><span v-else>указанный адрес</span> будут автоматически прикреплены к контактам прямо из списка писем.
        </p>
        <div>
          <label class="block text-sm font-medium text-space mb-2">Ваш пароль</label>
          <MyInput
            v-model="otherMail.password"
            type="password"
            placeholder="Пароль от Email"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-space mb-2">Сервер IMAP</label>
          <MyInput
            v-model="otherMail.imapServer"
            type="text"
            placeholder="imap.server.com"
            class="w-full"
          />
        </div>
        <div class="flex gap-3 items-end">
          <div class="flex-1">
            <label class="block text-sm font-medium text-space mb-2">Порт (IMAP)</label>
            <MyInput
              v-model="otherMail.imapPort"
              type="text"
              placeholder="993"
              class="w-full"
            />
          </div>
          <div class="flex-1 min-w-[140px]">
            <label class="block text-sm font-medium text-space mb-2">Шифрование</label>
            <select
              v-model="otherMail.imapEncryption"
              class="w-full min-h-10 rounded-ten border border-athens bg-athens-gray px-3 text-sm text-space focus:outline-none focus:border-dodger"
            >
              <option v-for="opt in encryptionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-space mb-2">Сервер SMTP</label>
          <MyInput
            v-model="otherMail.smtpServer"
            type="text"
            placeholder="smtp.server.com"
            class="w-full"
            :class="{ 'border-red-custom': otherMailErrors.smtpServer }"
          />
          <p v-if="otherMailErrors.smtpServer" class="text-sm text-red-custom mt-1">{{ otherMailErrors.smtpServer }}</p>
        </div>
        <div class="flex gap-3 items-end">
          <div class="flex-1">
            <label class="block text-sm font-medium text-space mb-2">Порт (SMTP)</label>
            <MyInput
              v-model="otherMail.smtpPort"
              type="text"
              placeholder="465"
              class="w-full"
            />
          </div>
          <div class="flex-1 min-w-[140px]">
            <label class="block text-sm font-medium text-space mb-2">Шифрование</label>
            <select
              v-model="otherMail.smtpEncryption"
              class="w-full min-h-10 rounded-ten border border-athens bg-athens-gray px-3 text-sm text-space focus:outline-none focus:border-dodger"
            >
              <option v-for="opt in encryptionOptions" :key="'smtp-' + opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>
        <div class="flex gap-x-3 pt-1">
          <UiButton variant="action" size="semiaction" @click="submitOtherMail">Подключить</UiButton>
          <UiButton variant="back" size="second-back" @click="closeOtherMailPopup">Отмена</UiButton>
        </div>
      </div>
    </Popup>
  </div>
</template>

<style scoped>
  .default-template {
    background-color: #fff;
    padding: 25px;
    border-radius: 15px;
  }
  .email-card:active {
    transform: scale(0.99);
  }
</style>
