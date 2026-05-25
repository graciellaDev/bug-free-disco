<script setup>
import { ref, watch, nextTick } from 'vue'
import BtnTab from '~/components/custom/BtnTab.vue'
import MyCheckbox from '~/components/custom/MyCheckbox.vue'
import MyInputSecond from '~/components/custom/MyInputSecond.vue'
import DotsDropdown from '~/components/custom/DotsDropdown.vue'
import Popup from '~/components/custom/Popup.vue'
import MyInput from '~/components/custom/MyInput.vue'
import CheckboxGroup from '~/components/custom/CheckboxGroup.vue'
import draggable from 'vuedraggable'
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/utils/executorsList'
import {
  getRejectionReasons,
  createRejectionReason,
  updateRejectionReason,
  deleteRejectionReason,
} from '@/src/api/rejectionReasons'
import {
  getCandidateSources,
  createCandidateSource,
  updateCandidateSource,
  deleteCandidateSource,
} from '@/src/api/candidateSources'


const route = useRoute()
const settingsTabs = ref(
  route.query.tab === 'candidateSources' ? 'candidateSources' : 'rejectionReasons'
)
const departmentsCheck = ref(false)
const externalCheck = ref(false)
const settingsDepPopups = ref({
  newDep: false,
  newRole: false,
  newCompany: false,
})
const newDepName = ref('')
const newRoleName = ref('')
const rolesCheck = ref([])
const detailedRole = ref(null)
const detailedRights = ref(null)
const newCompanyName = ref('')
const detailedDep = ref(null)
const removeRoleData = ref(null)
const removeExternalData = ref(null)
const editInputs = ref({})
const externalInputs = ref({})
const dataApi = ref([])
const data = ref([])

const rejectionReasonsLoading = ref(true)
const rejectionReasons = ref([])
const rejectionReasonsMessage = ref(null)
const rejectionReasonsError = ref(null)
const rejectionReasonEditPopupOpen = ref(false)
const rejectionReasonEditingId = ref(null)
const rejectionReasonFormName = ref('')
const rejectionReasonFormSaving = ref(false)
const rejectionReasonDeletePopupOpen = ref(false)
const rejectionReasonDeletingRow = ref(null)
const rejectionReasonDeleteLoading = ref(false)

const candidateSourcesLoading = ref(true)
const candidateSources = ref([])
const candidateSourcesMessage = ref(null)
const candidateSourcesError = ref(null)
const candidateSourceEditPopupOpen = ref(false)
const candidateSourceEditingId = ref(null)
const candidateSourceFormName = ref('')
const candidateSourceFormSaving = ref(false)
const candidateSourceDeletePopupOpen = ref(false)
const candidateSourceDeletingRow = ref(null)
const candidateSourceDeleteLoading = ref(false)
const departmentsLoading = ref(true)
const departmentsMessage = ref(null)
const departmentsError = ref(null)
const departmentEditPopupOpen = ref(false)
const departmentEditingId = ref(null)
const departmentFormName = ref('')
const departmentFormSaving = ref(false)
const departmentDeletePopupOpen = ref(false)
const departmentDeletingRow = ref(null)
const departmentDeleteLoading = ref(false)
const INTEGRATION_SOURCES = new Set([
  'avito',
  'avito.ru',
  'avitoru',
  'hh',
  'hh.ru',
  'hhru',
  'headhunter',
  'headhunter.ru',
  'headhunterru',
  'rabota',
  'rabota.ru',
  'rabotaru',
])

function normalizeSourceKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
}

function isIntegrationSource(row) {
  return (
    INTEGRATION_SOURCES.has(normalizeSourceKey(row?.name)) ||
    INTEGRATION_SOURCES.has(normalizeSourceKey(row?.code))
  )
}

definePageMeta({
  layout: 'settings',
})

useHead({
  title: 'Настройки — Справочники',
})

async function loadDepartments() {
  departmentsLoading.value = true
  departmentsError.value = null
  try {
    const apiData = await getDepartments(true)
    dataApi.value = Array.isArray(apiData) ? apiData : []
    data.value = dataApi.value.map((element, index) => ({
      id: index,
      name: String(element?.name ?? ''),
      customId: Number(element?.id),
      checked: false,
    }))
  } catch (e) {
    console.warn('getDepartments:', e?.message ?? e)
    dataApi.value = []
    data.value = []
    departmentsError.value = 'Не удалось загрузить отделы'
  } finally {
    departmentsLoading.value = false
  }
}

loadDepartments()

async function loadRejectionReasons() {
  rejectionReasonsLoading.value = true
  rejectionReasonsError.value = null
  try {
    const res = await getRejectionReasons()
    const payload = res.data
    rejectionReasons.value = Array.isArray(payload?.reasons) ? [...payload.reasons] : []
  } catch (e) {
    rejectionReasonsError.value = 'Не удалось загрузить причины отказа'
    console.error(e)
  } finally {
    rejectionReasonsLoading.value = false
  }
}

loadRejectionReasons()

async function loadCandidateSources() {
  candidateSourcesLoading.value = true
  candidateSourcesError.value = null
  try {
    const res = await getCandidateSources()
    const payload = res.data
    candidateSources.value = Array.isArray(payload?.sources) ? [...payload.sources] : []
  } catch (e) {
    candidateSourcesError.value = 'Не удалось загрузить источники кандидатов'
    console.error(e)
  } finally {
    candidateSourcesLoading.value = false
  }
}

loadCandidateSources()

function openCandidateSourceCreate() {
  candidateSourceEditingId.value = null
  candidateSourceFormName.value = ''
  candidateSourceEditPopupOpen.value = true
}

function openCandidateSourceEdit(row) {
  if (isIntegrationSource(row)) return
  candidateSourceEditingId.value = row.id
  candidateSourceFormName.value = row.name
  candidateSourceEditPopupOpen.value = true
}

function closeCandidateSourceEdit() {
  candidateSourceEditPopupOpen.value = false
}

async function saveCandidateSourceForm() {
  const name = String(candidateSourceFormName.value || '').trim()
  if (!name) {
    candidateSourcesError.value = 'Введите название источника'
    return
  }

  candidateSourceFormSaving.value = true
  candidateSourcesError.value = null
  candidateSourcesMessage.value = null
  try {
    if (candidateSourceEditingId.value == null) {
      await createCandidateSource({ name })
    } else {
      await updateCandidateSource(candidateSourceEditingId.value, { name })
    }
    candidateSourcesMessage.value =
      candidateSourceEditingId.value == null ? 'Источник добавлен' : 'Изменения сохранены'
    candidateSourceEditPopupOpen.value = false
    await loadCandidateSources()
  } catch (e) {
    candidateSourcesError.value = 'Не удалось сохранить'
    console.error(e)
  } finally {
    candidateSourceFormSaving.value = false
  }
}

function confirmCandidateSourceDelete(row) {
  if (isIntegrationSource(row)) return
  candidateSourceDeletingRow.value = row
  candidateSourceDeletePopupOpen.value = true
}

async function doDeleteCandidateSource() {
  if (!candidateSourceDeletingRow.value) return
  candidateSourceDeleteLoading.value = true
  candidateSourcesError.value = null
  try {
    await deleteCandidateSource(candidateSourceDeletingRow.value.id)
    candidateSourcesMessage.value = 'Источник удалён'
    candidateSourceDeletePopupOpen.value = false
    candidateSourceDeletingRow.value = null
    await loadCandidateSources()
  } catch (e) {
    candidateSourcesError.value = 'Не удалось удалить'
    console.error(e)
  } finally {
    candidateSourceDeleteLoading.value = false
  }
}

function openRejectionReasonCreate() {
  rejectionReasonEditingId.value = null
  rejectionReasonFormName.value = ''
  rejectionReasonEditPopupOpen.value = true
}

function openRejectionReasonEdit(row) {
  rejectionReasonEditingId.value = row.id
  rejectionReasonFormName.value = row.name
  rejectionReasonEditPopupOpen.value = true
}

function closeRejectionReasonEdit() {
  rejectionReasonEditPopupOpen.value = false
}

async function saveRejectionReasonForm() {
  const name = String(rejectionReasonFormName.value || '').trim()
  if (!name) {
    rejectionReasonsError.value = 'Введите название причины'
    return
  }

  rejectionReasonFormSaving.value = true
  rejectionReasonsError.value = null
  rejectionReasonsMessage.value = null
  try {
    if (rejectionReasonEditingId.value == null) {
      await createRejectionReason({ name })
    } else {
      await updateRejectionReason(rejectionReasonEditingId.value, { name })
    }
    rejectionReasonsMessage.value =
      rejectionReasonEditingId.value == null ? 'Причина добавлена' : 'Изменения сохранены'
    rejectionReasonEditPopupOpen.value = false
    await loadRejectionReasons()
  } catch (e) {
    rejectionReasonsError.value = 'Не удалось сохранить'
    console.error(e)
  } finally {
    rejectionReasonFormSaving.value = false
  }
}

function confirmRejectionReasonDelete(row) {
  rejectionReasonDeletingRow.value = row
  rejectionReasonDeletePopupOpen.value = true
}

async function doDeleteRejectionReason() {
  if (!rejectionReasonDeletingRow.value) return
  rejectionReasonDeleteLoading.value = true
  rejectionReasonsError.value = null
  try {
    await deleteRejectionReason(rejectionReasonDeletingRow.value.id)
    rejectionReasonsMessage.value = 'Причина удалена'
    rejectionReasonDeletePopupOpen.value = false
    rejectionReasonDeletingRow.value = null
    await loadRejectionReasons()
  } catch (e) {
    rejectionReasonsError.value = 'Не удалось удалить'
    console.error(e)
  } finally {
    rejectionReasonDeleteLoading.value = false
  }
}

function removeSubDepartment(dep, subIndex) {
  dep.subDepartments.splice(subIndex, 1)
}

// const roles = ref(null)

const roles = ref([
  {
    id: 1,
    name: 'Рекрутер',
    rights: [1, 2, 3, 4, 5, 6, 7],
    userCount: 12,
  },
  {
    id: 2,
    name: 'HR Менеджер',
    rights: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    userCount: 4,
  },
  {
    id: 3,
    name: 'Сотрудник СБ',
    rights: [1],
    userCount: 2,
  }
])

const external = ref([
  {
    id: 1,
    name: 'ООО СБЕР',
    customId: '29139123812',
    checked: false,
    subDivision: [
      {
        id: 1,
        name: 'Сбер Бизнес',
        checked: false,
        hover: false,
      },
      {
        id: 2,
        name: 'Сбер ИТ',
        checked: false,
        hover: false,
      }
    ],
    newSubDiv: '',
  },
  {
    id: 2,
    name: 'МегаФон',
    customId: '29139123812',
    checked: false,
    subDivision: [
      {
        id: 1,
        name: 'МегаФон Бизнес',
        checked: false,
        hover: false,
      },
      {
        id: 2,
        name: 'МегаФон ИТ',
        checked: false,
        hover: false,
      },
      {
        id: 3,
        name: 'МегаФон Маркетинг',
        checked: false,
        hover: false,
      },
    ],
    newSubDiv: '',
  },
  {
    id: 3,
    name: 'Яндекс',
    customId: '29139123812',
    checked: false,
    subDivision: [
      {
        id: 1,
        name: 'Яндекс Маркет',
        checked: false,
        hover: false,
      },
      {
        id: 2,
        name: 'Яндекс ИТ',
        checked: false,
        hover: false,
      },
      {
        id: 3,
        name: 'Яндекс Реклама',
        checked: false,
        hover: false,
      },
    ],
    newSubDiv: '',
  }
])

function addExternalCompany(ex) {
  if (!ex.newSubDiv || !ex.newSubDiv.trim()) return
  ex.subDivision.push({
    id: ex.subDivision.length + 1,
    name: ex.newSubDiv.trim(),
  })
  ex.newSubDiv = ''
  console.log(`Добавлена новая внешняя компания: ${ex.newSubDiv.trim()} в компанию ${ex.name}`)
}

function removeExternalCompany(ex, subIndex) {
  ex.subDivision.splice(subIndex, 1)
}

function handleOpenSettingsPopup(popupKey) {
  settingsDepPopups.value[popupKey] = true;
}

function handleCloseSettingsPopup(popupKey) {
  settingsDepPopups.value[popupKey] = false;
}

async function addNewDep() {
  const name = String(newDepName.value || '').trim()
  if (!name) return
  try {
    await createDepartment(name)
    newDepName.value = ''
    settingsDepPopups.value.newDep = false
    departmentsMessage.value = 'Отдел добавлен'
    await loadDepartments()
  } catch (err) {
    console.error('Ошибка создания департамента:', err)
    const msg = (err && err.data && err.data.message) || (err && err.message) || String(err)
    departmentsError.value = String(msg || 'Не удалось создать отдел')
  }
}

function openDepartmentEdit(row) {
  departmentEditingId.value = row.customId
  departmentFormName.value = row.name
  departmentEditPopupOpen.value = true
}

function closeDepartmentEdit() {
  departmentEditPopupOpen.value = false
}

async function saveDepartmentEdit() {
  const name = String(departmentFormName.value || '').trim()
  if (!name || !departmentEditingId.value) {
    departmentsError.value = 'Введите название отдела'
    return
  }

  departmentFormSaving.value = true
  departmentsError.value = null
  try {
    await updateDepartment(Number(departmentEditingId.value), name)
    departmentEditPopupOpen.value = false
    departmentsMessage.value = 'Изменения сохранены'
    await loadDepartments()
  } catch (err) {
    const msg = (err && err.data && err.data.message) || (err && err.message) || String(err)
    departmentsError.value = String(msg || 'Не удалось сохранить изменения')
  } finally {
    departmentFormSaving.value = false
  }
}

function confirmDepartmentDelete(row) {
  departmentDeletingRow.value = row
  departmentDeletePopupOpen.value = true
}

async function doDeleteDepartment() {
  if (!departmentDeletingRow.value?.customId) return
  departmentDeleteLoading.value = true
  departmentsError.value = null
  try {
    await deleteDepartment(Number(departmentDeletingRow.value.customId))
    departmentDeletePopupOpen.value = false
    departmentsMessage.value = 'Отдел удалён'
    departmentDeletingRow.value = null
    await loadDepartments()
  } catch (err) {
    const msg = (err && err.data && err.data.message) || (err && err.message) || String(err)
    departmentsError.value = String(msg || 'Не удалось удалить отдел')
  } finally {
    departmentDeleteLoading.value = false
  }
}

const newRoleChecks = [
  {
    id: 1,
    label: 'Просматривать все вакансии',
  },
  {
    id: 2,
    label: 'Управлять вакансиями',
  },
  {
    id: 3,
    label: 'Удалять вакансии',
  },
  {
    id: 4,
    label: 'Назначать ответственных на вакансии',
  },
  {
    id: 5,
    label: 'Приглашать и назначать заказчиков',
  },
  {
    id: 6,
    label: 'Удалять кандидатов',
  },
  {
    id: 7,
    label: 'Управлять общими шаблонами писем',
  },
  {
    id: 8,
    label: 'Управлять тегами',
  },
  {
    id: 9,
    label: 'Получать заявки на вакансии',
  }
]

function addNewRole() {
  if (!newRoleName.value || !newRoleName.value.trim()) return

  roles.value.push({
    id: roles.value.length + 1,
    name: newRoleName.value,
    rights: [...rolesCheck.value], // Сохраняем массив выбранных id
    userCount: 0,
  })

  if (rolesCheck.value.length === 0) {
    alert('Выберите хотя бы одно право')
    return
  }

  newRoleName.value = ''
  rolesCheck.value = []
  settingsDepPopups.value.newRole = false
}

const roleSettings = (role) => {
  try {
    const fullData = roles.value.find(r => r.id === role.id)
    detailedRole.value = { ...fullData }
    detailedRights.value = [...fullData.rights] // Убедимся, что это новый массив
    console.log('Detailed role rights:', detailedRights.value)
    console.log('Detailed role rights type:', Array.isArray(detailedRights.value))
  } catch (error) {
    console.error('Error loading role:', error)
  }
}

const removeDepartmentPopup = (departmemt) => {
  try {
    const fullDepData = data.value.find(d => d.id === departmemt.id)
    detailedDep.value = { ...fullDepData }
  } catch (e) {
    console.error(e)
  }
}

const closeDepSettings = () => {
  detailedDep.value = null
}

const closeRoleSettings = () => {
  detailedRole.value = null
  detailedRights.value = []
}

function updateRole() {
  const index = roles.value.findIndex(r => r.id === detailedRole.value.id)
  if (index !== -1) {
    roles.value[index] = { ...detailedRole.value, rights: [...detailedRights.value] }
  }
  closeRoleSettings()
}

function addNewCompany() {
  if (!newCompanyName.value || !newCompanyName.value.trim()) return

  external.value.push({
    id: external.value.length + 1,
    name: newCompanyName.value,
    customId: (Date.now() + Math.random()).toString().slice(0, 11),
    subDivision: [],
    newSubDiv: '',
  })

  newCompanyName.value = ''
  settingsDepPopups.value.newCompany = false
}

function deleteDep() {
  const index = data.value.findIndex(d => d.id === detailedDep.value.id)
  data.value.splice(index, 1)
  detailedDep.value = null
  closeDepSettings()
}

const selectRole = (item, role) => {
  if (item === 'Удалить') {
    console.log('Role for removing, ID:', role.id)
    removeRoleData.value = role
  }
}

function removeRole() {
  const index = roles.value.findIndex(r => r.id === removeRoleData.value.id)
  roles.value.splice(index, 1)
  closeRemoveRole()
}

function closeRemoveRole() {
  removeRoleData.value = null
}

const removeExternalPopup = (externalCompanies) => {
  const fullExData = external.value.find(e => e.id === externalCompanies.id)
  removeExternalData.value = { ...fullExData }
}

function removeExternalItem() {
  const index = external.value.findIndex(e => e.id === removeExternalData.id)
  external.value.splice(index, 1)
  removeExternalData.value = null
}

function closeRemoveExternal() {
  removeExternalData.value = null
}

function toggleAllDepartments() {
  data.value.forEach(dep => {
    dep.checked = departmentsCheck.value
    dep.subDepartments.forEach(subDep => {
      subDep.checked = dep.checked
    })
  })
}

watch(
  () => data.value.map(dep => dep.checked),
  (checkedList) => {
    departmentsCheck.value = checkedList.every(Boolean)
  }
)

function toggleAllSubDepartments(dep) {
  dep.subDepartments.forEach(subDep => {
    subDep.checked = dep.checked
  })
}

function toggleAllExternal() {
  external.value.forEach(ex => {
    ex.checked = externalCheck.value
    ex.subDivision.forEach(subEx => {
      subEx.checked = ex.checked
    })
  })
}

watch(
  () => external.value.map(ex => ex.checked),
  (exCheckList) => {
    externalCheck.value = exCheckList.every(Boolean)
  }
)

function toggleAllSubExternal(ex) {
  ex.subDivision.forEach(subEx => {
    subEx.checked = ex.checked
  })
}

function startEditDep(dep) {
  data.value.forEach(d => {
    if (d !== dep) {
      d.correctMainDep = false
    }
  })
  dep.editName = dep.name
  dep.correctMainDep = true
  nextTick(() => {
    const inputComp = editInputs.value[dep.id]
    if (inputComp && inputComp.focus) {
      inputComp.focus()
    }
  })
}

function saveEditDep(dep) {
  if (dep.editName && dep.editName.trim()) {
    dep.name = dep.editName.trim()
  }
  dep.correctMainDep = false
}

function cancelEditDep(dep) {
  dep.editName = dep.name
  dep.correctMainDep = false
}

function setEditInputRef(dep, index) {
  return (el) => {
    if (el) {
      editInputs.value[dep.id] = el
    }
  }
}

function saveEditEx(ex) {
  if (ex.editName && ex.editName.trim()) {
    ex.name = ex.editName.trim()
  }
  ex.correctMainEx = false
}

function cancelEditEx(ex) {
  ex.editName = ex.name
  ex.correctMainEx = false
}

function setEditExInputRef(ex, index) {
  return (el) => {
    if (el) {
      externalInputs.value[ex.id] = el
    }
  }
}

function startEditEx(ex) {
  external.value.forEach(e => {
    if (e !== ex) {
      e.correctMainEx = false
    }
  })
  ex.editName = ex.name
  ex.correctMainEx = true
  nextTick(() => {
    const inputComp = externalInputs.value[ex.id]
    if (inputComp && inputComp.focus) {
      inputComp.focus()
    }
  })
}
</script>

<template>
  <div class="w-full">
    <div class="mb-15px">
      <div class="w-full bg-white rounded-t-fifteen p-25px flex justify-between gap-2.5 pb-23px">
        <div>
          <div class="mb-2">
            <p v-if="settingsTabs === 'rejectionReasons'" class="text-xl font-semibold text-space">Причины отказа
            </p>
            <p v-else-if="settingsTabs === 'candidateSources'" class="text-xl font-semibold text-space">Источники кандидатов
            </p>
            <p v-else-if="settingsTabs === 'departments'" class="text-xl font-semibold text-space">Структура вашей организации
            </p>
            <p v-else-if="settingsTabs === 'roles'" class="text-xl font-semibold text-space">Роли пользователей
            </p>
            <p v-else-if="settingsTabs === 'external'" class="text-xl font-semibold text-space">Структура внешней
              организации
            </p>
          </div>
          <div>
            <p v-if="settingsTabs === 'rejectionReasons'" class="text-sm font-normal text-bali">
              Справочник причин, по которым кандидат может быть отклонён. При переводе на этап «Отказ»
              рекрутер выбирает причину из этого списка (если в воронке вакансии включены причины отказа).
            </p>
            <p v-if="settingsTabs === 'candidateSources'" class="text-sm font-normal text-bali">
              Справочник источников, из которых приходят кандидаты (например: hh.ru, avito, рекомендации).
              Эти значения можно использовать как единый стандарт для команды.
            </p>
            <p v-if="settingsTabs === 'departments'" class="text-sm font-normal text-bali">
              Управляйте департаментами и&nbsp;отделами, создавайте структуру вашей компании
            </p>
            <p v-if="settingsTabs === 'roles'" class="text-sm font-normal text-bali">Управляйте ролями и&nbsp;правами
              доступа</p>
            <p v-if="settingsTabs === 'external'" class="text-sm font-normal text-bali leading-normal">Управляйте
              внешними компаниями,
              департаментами и&nbsp;отделами, создавайте структуру внешних заказчиков</p>
          </div>
        </div>
        <div class="flex items-center">
          <UiButton v-if="settingsTabs === 'rejectionReasons'" variant="action" size="semiaction" class="font-semibold"
            @click="openRejectionReasonCreate">Добавить причину
          </UiButton>
          <UiButton v-if="settingsTabs === 'candidateSources'" variant="action" size="semiaction" class="font-semibold"
            @click="openCandidateSourceCreate">Добавить источник
          </UiButton>
          <UiButton v-if="settingsTabs === 'departments'" variant="action" size="semiaction" class="font-semibold"
            @click="handleOpenSettingsPopup('newDep')">Создать отдел
          </UiButton>
          <UiButton v-if="settingsTabs === 'roles'" variant="action" size="semiaction"
            @click="handleOpenSettingsPopup('newRole')">Создать роль</UiButton>
          <UiButton v-if="settingsTabs === 'external'" variant="action" size="semiaction"
            @click="handleOpenSettingsPopup('newCompany')">Создать компанию</UiButton>
        </div>
      </div>
      <div class="w-full bg-athens h-[1px]"></div>
      <div class="bg-catskill w-full px-25px py-15px rounded-b-fifteen">
        <BtnTab :tabs="[
          { label: 'Причины отказа', value: 'rejectionReasons' },
          { label: 'Источники кандидатов', value: 'candidateSources' },
          { label: 'Отделы', value: 'departments' },
        ]" v-model="settingsTabs" />
      </div>
    </div>
    <div v-if="settingsTabs === 'rejectionReasons'">
      <div class="rounded-fifteen bg-white px-25px">
        <div
          v-if="rejectionReasonsMessage"
          class="mb-4 rounded-ten bg-[#e8f1ff] px-15px py-10px text-sm text-space"
        >
          {{ rejectionReasonsMessage }}
        </div>
        <div
          v-if="rejectionReasonsError"
          class="mb-4 rounded-ten bg-red-50 px-15px py-10px text-sm text-red-700"
        >
          {{ rejectionReasonsError }}
        </div>

        <div v-if="rejectionReasonsLoading" class="py-10 text-center text-sm text-bali">Загрузка…</div>

        <template v-else>
          <div
            v-if="rejectionReasons.length === 0"
            class="rounded-ten border border-dashed border-athens bg-athens-gray px-15px py-20px text-center text-sm text-bali"
          >
            Список пуст. Добавьте причины отказа — они появятся в форме при переводе кандидата на этап
            «Отклонённые».
          </div>

          <div v-else class="-mx-25px overflow-hidden">
            <ul class="m-0 list-none divide-y divide-athens p-0">
              <li
                v-for="row in rejectionReasons"
                :key="row.id"
                class="grid min-h-[52px] grid-cols-[minmax(0,1fr)_240px] items-center gap-4 px-25px py-12px"
              >
                <span class="min-w-0 truncate text-sm font-medium leading-150 text-space">{{ row.name }}</span>
                <div class="flex shrink-0 items-center justify-end gap-1.5">
                  <button
                    type="button"
                    class="group/btn flex items-center gap-0.5 rounded text-sm font-normal leading-150 text-[#92989B] transition-colors hover:text-dodger"
                    title="Удалить"
                    @click="confirmRejectionReasonDelete(row)"
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
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </span>
                    <span class="text-sm font-normal leading-150 text-[#92989B] transition-colors group-hover/btn:text-dodger">Удалить</span>
                  </button>
                  <button
                    type="button"
                    class="group/btn flex items-center gap-0.5 rounded text-sm font-normal leading-150 text-[#92989B] transition-colors hover:text-dodger"
                    title="Изменить"
                    @click="openRejectionReasonEdit(row)"
                  >
                    <span class="flex h-6 w-6 items-center justify-center text-dodger transition-colors group-hover/btn:text-dodger">
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
                    <span class="text-sm font-normal leading-150 text-[#92989B] transition-colors group-hover/btn:text-dodger">Изменить</span>
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </template>
      </div>
    </div>
    <div v-else-if="settingsTabs === 'candidateSources'">
      <div class="rounded-fifteen bg-white px-25px">
        <div
          v-if="candidateSourcesMessage"
          class="mb-4 rounded-ten bg-[#e8f1ff] px-15px py-10px text-sm text-space"
        >
          {{ candidateSourcesMessage }}
        </div>
        <div
          v-if="candidateSourcesError"
          class="mb-4 rounded-ten bg-red-50 px-15px py-10px text-sm text-red-700"
        >
          {{ candidateSourcesError }}
        </div>

        <div v-if="candidateSourcesLoading" class="py-10 text-center text-sm text-bali">Загрузка…</div>

        <template v-else>
          <div
            v-if="candidateSources.length === 0"
            class="rounded-ten border border-dashed border-athens bg-athens-gray px-15px py-20px text-center text-sm text-bali"
          >
            Список пуст. Добавьте источники, чтобы использовать единый справочник по команде.
          </div>

          <div v-else class="-mx-25px overflow-hidden">
            <ul class="m-0 list-none divide-y divide-athens p-0">
              <li
                v-for="row in candidateSources"
                :key="row.id"
                class="grid min-h-[52px] grid-cols-[minmax(0,1fr)_140px_240px] items-center gap-4 px-25px py-12px"
              >
                <span class="min-w-0 truncate text-sm font-medium leading-150 text-space">{{ row.name }}</span>
                <span class="text-sm font-normal text-bali">
                  {{ isIntegrationSource(row) ? 'Интеграция' : 'Пользовательский' }}
                </span>
                <div class="flex shrink-0 items-center justify-end gap-1.5">
                  <button
                    v-if="!isIntegrationSource(row)"
                    type="button"
                    class="group/btn flex items-center gap-0.5 rounded text-sm font-normal leading-150 text-[#92989B] transition-colors hover:text-dodger"
                    title="Удалить"
                    @click="confirmCandidateSourceDelete(row)"
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
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </span>
                    <span class="text-sm font-normal leading-150 text-[#92989B] transition-colors group-hover/btn:text-dodger">Удалить</span>
                  </button>
                  <button
                    v-if="!isIntegrationSource(row)"
                    type="button"
                    class="group/btn flex items-center gap-0.5 rounded text-sm font-normal leading-150 text-[#92989B] transition-colors hover:text-dodger"
                    title="Изменить"
                    @click="openCandidateSourceEdit(row)"
                  >
                    <span class="flex h-6 w-6 items-center justify-center text-dodger transition-colors group-hover/btn:text-dodger">
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
                    <span class="text-sm font-normal leading-150 text-[#92989B] transition-colors group-hover/btn:text-dodger">Изменить</span>
                  </button>
                  <span
                    v-if="isIntegrationSource(row)"
                    class="rounded bg-athens px-10px py-6px text-xs font-medium text-bali"
                  >
                    Без изменений
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </template>
      </div>
    </div>
    <div v-else-if="settingsTabs === 'departments'">
      <div class="rounded-fifteen bg-white px-25px">
        <div
          v-if="departmentsMessage"
          class="mb-4 rounded-ten bg-[#e8f1ff] px-15px py-10px text-sm text-space"
        >
          {{ departmentsMessage }}
        </div>
        <div
          v-if="departmentsError"
          class="mb-4 rounded-ten bg-red-50 px-15px py-10px text-sm text-red-700"
        >
          {{ departmentsError }}
        </div>

        <div v-if="departmentsLoading" class="py-10 text-center text-sm text-bali">Загрузка…</div>
        <template v-else>
          <div
            v-if="data.length === 0"
            class="rounded-ten border border-dashed border-athens bg-athens-gray px-15px py-20px text-center text-sm text-bali"
          >
            Список пуст. Добавьте отделы, чтобы использовать структуру компании.
          </div>

          <div v-else class="-mx-25px overflow-hidden">
            <ul class="m-0 list-none divide-y divide-athens p-0">
              <li
                v-for="(dep, index) in data"
                :key="dep.customId || index"
                class="grid min-h-[52px] grid-cols-[minmax(0,1fr)_240px] items-center gap-4 px-25px py-12px"
              >
                <span class="min-w-0 truncate text-sm font-medium leading-150 text-space">{{ dep.name }}</span>
                <div class="flex shrink-0 items-center justify-end gap-1.5">
                  <button
                    type="button"
                    class="group/btn flex items-center gap-0.5 rounded text-sm font-normal leading-150 text-[#92989B] transition-colors hover:text-dodger"
                    title="Удалить"
                    @click="confirmDepartmentDelete(dep)"
                  >
                    <span class="flex h-6 w-6 items-center justify-center text-red-500 transition-colors group-hover/btn:text-red-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </span>
                    <span class="text-sm font-normal leading-150 text-[#92989B] transition-colors group-hover/btn:text-dodger">Удалить</span>
                  </button>
                  <button
                    type="button"
                    class="group/btn flex items-center gap-0.5 rounded text-sm font-normal leading-150 text-[#92989B] transition-colors hover:text-dodger"
                    title="Изменить"
                    @click="openDepartmentEdit(dep)"
                  >
                    <span class="flex h-6 w-6 items-center justify-center text-dodger transition-colors group-hover/btn:text-dodger">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </span>
                    <span class="text-sm font-normal leading-150 text-[#92989B] transition-colors group-hover/btn:text-dodger">Изменить</span>
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </template>
      </div>
    </div>
    <div v-else-if="settingsTabs === 'roles'">
      <div v-if="roles.length > 0">
        <div class="bg-catskill rounded-t-fifteen px-25px py-25px custom-grid mb-1px">
          <p class="text-sm font-normal text-bali leading-150 pl-[11px]">Роль</p>
          <p class="text-sm font-normal text-bali leading-150 pl-[11px]">Права</p>
          <p class="text-sm font-normal text-bali leading-150 pl-[11px]">Пользователей</p>
          <div></div>
        </div>
        <div class="[&>*:not(:last-child)]:border-b [&>*:not(:last-child)]:border-athens">
          <div v-for="(role, index) in roles" :key="index"
            class="custom-grid px-25px py-11px bg-white last:rounded-b-fifteen items-center">
            <button class="text-left text-sm text-dodger font-medium w-fit hover:underline h-fit ml-[11px]"
              @click="roleSettings(role)">{{
                role.name
              }}</button>
            <p class="text-sm font-normal text-space leading-150 flex items-center pl-11px">{{ role.rights.length }} из
              10
            </p>
            <p class="text-sm font-normal text-space leading-150 flex items-center pl-11px">{{ role.userCount }}</p>
            <DotsDropdown :width="'fit'" :items="[
              'Информация', 'Удалить'
            ]" @select-item="selectedItem => selectRole(selectedItem, role)" />
          </div>
        </div>
      </div>
      <div v-else class="text-bali min-h-[223px] flex items-center justify-center bg-catskill rounded-fifteen">
        <p class="text-15px font-medium text-bali">У вас нет ни одной роли</p>
      </div>
    </div>
    <div v-else-if="settingsTabs === 'external'">
      <div v-if="external.length > 0">
        <div class="w-full rounded-t-fifteen bg-catskill px-15px py-25px flex">
          <MyCheckbox v-model="externalCheck" :twenty-gap="true" :label="'Компания'" :id="'externalCheck'"
            :labelColor="'bali'" :fontWeight="'medium'" @change="toggleAllExternal" />
        </div>
        <div class="w-full bg-athens h-1px"></div>
        <div class="[&>*:not(:last-child)]:mb-1px rounded-begin">
          <div v-for="(ex, index) in external" :key="index" @mouseover="ex.hover = true" @mouseleave="ex.hover = false"
            class="flex flex-col bg-white last-of-type:rounded-b-fifteen">
            <div class="flex justify-between items-center pr-15px">
              <div class="flex items-center py-17px px-15px" :class="{ 'border-b border-athens': ex.viewSubs }">
                <MyCheckbox v-model="ex.checked" :twenty-gap="true" :id="ex.name" @change="toggleAllSubExternal(ex)" />
                <div>
                  <div v-if="ex.correctMainEx">
                    <MyInput v-model="ex.editName" :placeholder="'Введите новое значение'"
                      :ref="setEditExInputRef(ex, index)" @keyup.enter="saveEditEx(ex)" @blur="cancelEditEx(ex)" />
                  </div>
                  <div v-else>
                    <div class="cursor-pointer flex items-center" @click="ex.viewSubs = !ex.viewSubs">
                      <p class="text-sm font-medium mr-5px select-none"
                        :class="[ex.viewSubs ? 'text-dodger' : 'text-space']">
                        {{ ex.name }}</p>
                      <div :class="[ex.viewSubs ? 'text-dodger rotate-180' : 'text-space']"><svg-icon
                          name="dropdown-arrow" width="16" height="16" /></div>

                    </div>
                    <span class="text-xs text-bali font-normal leading-130">ID {{ ex.customId }}</span>
                  </div>
                </div>
              </div>
              <div class="gap-x-2.5 flex" v-show="ex.hover">
                <button @click="ex.correctMainEx ? cancelEditEx(ex) : startEditEx(ex)"
                  class="border border-ahtens bg-athens-gray rounded-ten p-9px text-slate-custom hover:text-dodger hover:bg-zumthor hover:border-zumthor h-fit"><svg-icon
                    name="pencil" width="20" height="20" /></button>
                <button @click="removeExternalPopup(ex)"
                  class="border border-ahtens bg-athens-gray rounded-ten p-9px text-slate-custom hover:text-dodger hover:bg-zumthor hover:border-zumthor h-fit"><svg-icon
                    name="basket-basket" width="20" height="20" /></button>
              </div>
            </div>
            <div v-show="ex.viewSubs" class="rounded-inter">
              <div class="bg-white rounded-target">
                <div v-for="(sub, subIndex) in ex.subDivision" class="border-b border-athens">
                  <div
                    class="flex items-center px-15px py-2.5 pl-[63px] last-of-type:rounded-b-fifteen last-of-type:border-b-0"
                    :key="sub.id" @mouseover="sub.hover = true" @mouseleave="sub.hover = false">
                    <MyCheckbox v-model="sub.checked" :twenty-gap="true" :id="sub.name" :label="sub.name" />
                    <div class="flex ml-auto gap-x-2.5 opacity-0" :class="[{ 'opacity-100': sub.hover }]">
                      <button
                        class="border border-ahtens bg-athens-gray rounded-ten p-9px text-slate-custom hover:text-dodger hover:bg-zumthor hover:border-zumthor h-fit"><svg-icon
                          name="pencil" width="20" height="20" /></button>
                      <button @click="removeExternalCompany(ex, subIndex)"
                        class="border border-ahtens bg-athens-gray rounded-ten p-9px text-slate-custom hover:text-dodger hover:bg-zumthor hover:border-zumthor h-fit"><svg-icon
                          name="basket-basket" width="20" height="20" /></button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex items-center pl-60px py-2.5"><svg-icon name="plus-blue20" width="20" height="20"
                  @click="addExternalCompany(ex)" class="mr-2.5 cursor-pointer" />
                <div class="w-full pr-60px">
                  <MyInputSecond v-model="ex.newSubDiv" :placeholder="'Новое подразделение'"
                    @keyup.enter="addExternalCompany(ex)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-bali min-h-[223px] flex items-center justify-center bg-catskill rounded-fifteen">
        <p class="text-15px font-medium text-bali">Пока что вы не добавили ни одной внешней компании</p>
      </div>
    </div>
    <transition name="fade">
      <Popup
        :isOpen="rejectionReasonEditPopupOpen"
        :showCloseButton="false"
        :width="'490px'"
        :lgSize="true"
        :parentRounded="true"
        :contentRounded="false"
        :contentPadding="false"
        @close="closeRejectionReasonEdit"
      >
        <div class="flex min-w-0 flex-col gap-y-6">
          <h2 class="text-xl font-semibold text-space">
            {{ rejectionReasonEditingId == null ? 'Новая причина отказа' : 'Редактирование' }}
          </h2>
          <div class="min-w-0">
            <p class="mb-2 text-sm font-medium text-space">Название</p>
            <MyInput
              v-model="rejectionReasonFormName"
              placeholder="Например: Не подходит по опыту"
              class="w-full min-w-0"
              @keydown.enter.prevent="saveRejectionReasonForm"
            />
          </div>
          <div class="flex flex-wrap gap-x-3">
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-dodger hover:opacity-90 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold disabled:opacity-50"
              :disabled="rejectionReasonFormSaving"
              @click="saveRejectionReasonForm"
            >
              {{ rejectionReasonFormSaving ? 'Сохранение…' : 'Сохранить' }}
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
              @click="closeRejectionReasonEdit"
            >
              Отмена
            </button>
          </div>
        </div>
      </Popup>
    </transition>
    <transition name="fade">
      <Popup
        :isOpen="rejectionReasonDeletePopupOpen"
        :showCloseButton="false"
        :width="'490px'"
        :lgSize="true"
        :parentRounded="true"
        :contentRounded="false"
        :contentPadding="false"
        @close="rejectionReasonDeletePopupOpen = false"
      >
        <div class="flex min-w-0 flex-col gap-y-6">
          <h2 class="text-xl font-semibold text-space">Удалить причину?</h2>
          <p class="text-sm text-slate-custom">
            «{{ rejectionReasonDeletingRow?.name }}» будет удалена из справочника. Для уже отклонённых кандидатов
            связь может обнулиться.
          </p>
          <div class="flex gap-x-3">
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-red-500 hover:bg-red-600 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold disabled:opacity-50"
              :disabled="rejectionReasonDeleteLoading"
              @click="doDeleteRejectionReason"
            >
              {{ rejectionReasonDeleteLoading ? 'Удаление…' : 'Удалить' }}
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
              @click="rejectionReasonDeletePopupOpen = false"
            >
              Отмена
            </button>
          </div>
        </div>
      </Popup>
    </transition>
    <transition name="fade">
      <Popup
        :isOpen="candidateSourceEditPopupOpen"
        :showCloseButton="false"
        :width="'490px'"
        :lgSize="true"
        :parentRounded="true"
        :contentRounded="false"
        :contentPadding="false"
        @close="closeCandidateSourceEdit"
      >
        <div class="flex min-w-0 flex-col gap-y-6">
          <h2 class="text-xl font-semibold text-space">
            {{ candidateSourceEditingId == null ? 'Новый источник' : 'Редактирование' }}
          </h2>
          <div class="min-w-0">
            <p class="mb-2 text-sm font-medium text-space">Название</p>
            <MyInput
              v-model="candidateSourceFormName"
              placeholder="Например: hh.ru"
              class="w-full min-w-0"
              @keydown.enter.prevent="saveCandidateSourceForm"
            />
          </div>
          <div class="flex flex-wrap gap-x-3">
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-dodger hover:opacity-90 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold disabled:opacity-50"
              :disabled="candidateSourceFormSaving"
              @click="saveCandidateSourceForm"
            >
              {{ candidateSourceFormSaving ? 'Сохранение…' : 'Сохранить' }}
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
              @click="closeCandidateSourceEdit"
            >
              Отмена
            </button>
          </div>
        </div>
      </Popup>
    </transition>
    <transition name="fade">
      <Popup
        :isOpen="candidateSourceDeletePopupOpen"
        :showCloseButton="false"
        :width="'490px'"
        :lgSize="true"
        :parentRounded="true"
        :contentRounded="false"
        :contentPadding="false"
        @close="candidateSourceDeletePopupOpen = false"
      >
        <div class="flex min-w-0 flex-col gap-y-6">
          <h2 class="text-xl font-semibold text-space">Удалить источник?</h2>
          <p class="text-sm text-slate-custom">
            «{{ candidateSourceDeletingRow?.name }}» будет удалён из справочника.
          </p>
          <div class="flex gap-x-3">
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-red-500 hover:bg-red-600 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold disabled:opacity-50"
              :disabled="candidateSourceDeleteLoading"
              @click="doDeleteCandidateSource"
            >
              {{ candidateSourceDeleteLoading ? 'Удаление…' : 'Удалить' }}
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
              @click="candidateSourceDeletePopupOpen = false"
            >
              Отмена
            </button>
          </div>
        </div>
      </Popup>
    </transition>
    <transition name="fade">
      <Popup :isOpen="departmentEditPopupOpen" @close="closeDepartmentEdit" :width="'490px'" :content-padding="false">
        <div>
          <p class="text-xl font-semibold text-space mb-25px">Изменение отдела</p>
          <p class="font-medium text-space mb-15px">Название отдела</p>
          <MyInput v-model="departmentFormName" class="mb-35px" :placeholder="'Например, Маркетинг'" />
          <div>
            <UiButton variant="action" size="semiaction" class="mr-15px" :disabled="departmentFormSaving" @click="saveDepartmentEdit()">
              {{ departmentFormSaving ? 'Сохранение…' : 'Сохранить' }}
            </UiButton>
            <UiButton variant="back" size="second-back" @click="closeDepartmentEdit()">Отмена</UiButton>
          </div>
        </div>
      </Popup>
    </transition>
    <transition name="fade">
      <Popup :isOpen="departmentDeletePopupOpen" @close="departmentDeletePopupOpen = false" :width="'400px'">
        <div>
          <p class="text-xl font-semibold text-space mb-2.5 leading-normal">Удаление отдела</p>
          <p class="font-normal text-sm text-bali mb-35px">Вы действительно хотите удалить отдел {{
            departmentDeletingRow?.name
          }}?
          </p>
          <div class="flex gap-x-2.5">
            <UiButton variant="delete" size="delete" :disabled="departmentDeleteLoading" @click="doDeleteDepartment()">
              {{ departmentDeleteLoading ? 'Удаление…' : 'Удалить' }}
            </UiButton>
            <UiButton variant="back" size="second-back" @click="departmentDeletePopupOpen = false">Отмена</UiButton>
          </div>
        </div>
      </Popup>
    </transition>
    <transition name="fade">
      <Popup
        :isOpen="settingsDepPopups.newDep"
        @close="handleCloseSettingsPopup('newDep')"
        :width="'490px'"
        :content-padding="false"
      >
        <div>
          <p class="text-xl font-semibold text-space mb-25px">Новый отдел</p>
          <p class="font-medium text-space mb-15px">Название отдела</p>
          <MyInput v-model="newDepName" class="mb-35px" :placeholder="'Например, Маркетинг'" />
          <div>
            <UiButton variant="action" size="semiaction" class="mr-15px" @click="addNewDep()">Создать</UiButton>
            <UiButton variant="back" size="second-back" @click="handleCloseSettingsPopup('newDep')">Отмена</UiButton>
          </div>
        </div>
      </Popup>
    </transition>
    <transition name="fade">
      <Popup :isOpen="settingsDepPopups.newRole" @close="handleCloseSettingsPopup('newRole')" :width="'490px'">
        <div>
          <p class="text-xl font-semibold text-space mb-25px">Создание роли</p>
          <p class="font-medium text-space mb-15px text-sm">Название роли</p>
          <MyInput v-model="newRoleName" class="mb-25px" :placeholder="'Назовите роль'" />
          <p class="text-sm font-medium text-space mb-15px">Пользователь может:</p>
          <div class="gap-y-15px flex flex-col mb-35px">
            <CheckboxGroup v-model="rolesCheck" :options="newRoleChecks"
              @update:modelValue="val => console.log('rolesCheck.value', val)" />
          </div>
          <div>
            <UiButton variant="action" size="semiaction" class="mr-15px" @click="addNewRole()">Создать роль</UiButton>
            <UiButton variant="back" size="second-back" @click="handleCloseSettingsPopup('newRole')">Отмена</UiButton>
          </div>
        </div>
      </Popup>
    </transition>
    <transition name="fade">
      <Popup :isOpen="!!detailedRole" @close="closeRoleSettings()" :width="'490px'">
        <div>
          <!-- <p>{{ detailedRole.name }}</p> -->
          <p class="text-xl font-semibold text-space mb-25px">Настройки роли</p>
          <p class="font-medium text-space mb-15px text-sm">Название роли</p>
          <MyInput v-model="detailedRole.name" class="mb-25px" :placeholder="'Назовите роль'" />
          <p class="text-sm font-medium text-space mb-15px">Пользователь может:</p>
          <div class="gap-y-15px flex flex-col mb-35px">
            <CheckboxGroup v-model="detailedRights" :options="newRoleChecks" />
          </div>
          <div>
            <UiButton variant="action" size="semiaction" class="mr-15px" @click="updateRole()">Сохранить изменения
            </UiButton>
            <UiButton variant="back" size="second-back" @click="closeRoleSettings()">Отмена</UiButton>
          </div>
        </div>
      </Popup>
    </transition>
    <transition name="fade">
      <Popup :isOpen="settingsDepPopups.newCompany" @close="handleCloseSettingsPopup('newCompany')" :width="'490px'">
        <div>
          <p class="text-xl font-semibold text-space mb-25px">Новый внешний заказчик</p>
          <p class="font-medium text-space mb-15px text-sm">Название компании</p>
          <MyInput v-model="newCompanyName" class="mb-35px" :placeholder="'Введите название компании'" />
          <div>
            <UiButton variant="action" size="semiaction" class="mr-15px" @click="addNewCompany()">Создать
            </UiButton>
            <UiButton variant="back" size="second-back" @click="handleCloseSettingsPopup('newCompany')">Отмена
            </UiButton>
          </div>
        </div>
      </Popup>
    </transition>
    <transition name="fade">
      <Popup :isOpen="!!removeRoleData" @close="closeRemoveRole()" :width="'400px'">
        <div>
          <p class="text-xl font-semibold text-space mb-2.5 leading-normal">Удаление роли</p>
          <p class="font-normal text-sm text-bali mb-35px">Вы действительно хотите удалить роль {{
            removeRoleData.name }}?
          </p>
          <div class="flex gap-x-2.5">
            <UiButton variant="delete" size="delete" @click="removeRole()">Удалить</UiButton>
            <UiButton variant="back" size="second-back" @click="closeRemoveRole()">Отмена</UiButton>
          </div>
        </div>
      </Popup>
    </transition>
    <transition name="fade">
      <Popup :isOpen="!!removeExternalData" @close="closeRemoveExternal()" :width="'400px'">
        <div>
          <p class="text-xl font-semibold text-space mb-25px">Удаление внешнего заказчика</p>
          <p class="font-normal text-sm text-bali mb-35px">Вы действительно хотите удалить компанию {{
            removeExternalData.name }}?
          </p>
          <div class="flex gap-x-2.5">
            <UiButton variant="delete" size="delete" @click="removeExternalItem()">Удалить</UiButton>
            <UiButton variant="back" size="second-back" @click="closeRemoveExternal()">Отмена</UiButton>
          </div>
        </div>
      </Popup>
    </transition>
  </div>
</template>

<style scoped>
.rounded-begin:last-child .rounded-inter .rounded-target {
  border-bottom-left-radius: 15px;
  border-bottom-right-radius: 15px;
}

.custom-grid {
  display: grid;
  grid-template-columns: 0.3378378378378378fr 0.1621621621621622fr 0.5fr 40px;
  gap: 15px;
}

/* Анимация появления и скрытия */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-leave-from {
  opacity: 1;
}
</style>