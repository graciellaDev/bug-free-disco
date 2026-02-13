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
import { getDepartments, createDepartment, createDivision } from '@/utils/executorsList'


const settingsTabs = ref('departments')
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

definePageMeta({
  layout: 'settings',
})

useHead({
  title: 'Настройки — Отделы и роли',
})

async function loadDepartments() {
  try {
    const apiData = await getDepartments(true)
    dataApi.value = Array.isArray(apiData) ? apiData : []
    data.value = []
    dataApi.value.forEach((element, index) => {
      const divisions = element?.divisions ?? []
      const subs = divisions.map((sub) => ({
        id: sub.id,
        name: sub.division ?? sub.name ?? '',
        checked: false,
        hover: false
      }))
      data.value.push({
        id: index,
        name: element.name ?? '',
        customId: element.id,
        checked: false,
        subDepartments: subs,
        newSubDep: ''
      })
    })
  } catch (e) {
    console.warn('getDepartments:', e?.message ?? e)
    dataApi.value = []
    data.value = []
  }
}

loadDepartments()

async function addSubDepartment(dep) {
  if (!dep.newSubDep || !dep.newSubDep.trim()) return
  const departmentId = dep.customId
  if (typeof departmentId !== 'number' && typeof departmentId !== 'string') return
  try {
    await createDivision(Number(departmentId), dep.newSubDep.trim())
    dep.newSubDep = ''
    await loadDepartments()
  } catch (e) {
    console.error('Ошибка создания подразделения:', e?.message ?? e)
    alert('Не удалось создать подразделение. Возможно, отдел с таким названием уже существует.')
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
  if (!newDepName.value || !newDepName.value.trim()) return
  try {
    await createDepartment(newDepName.value.trim())
    newDepName.value = ''
    settingsDepPopups.value.newDep = false
    await loadDepartments()
  } catch (err) {
    console.error('Ошибка создания департамента:', err)
    const msg = (err && err.data && err.data.message) || (err && err.message) || String(err)
    const hint = 'Убедитесь, что бэкенд (jobly-back) запущен и NUXT_PUBLIC_API_BASE в .env указывает на него.'
    alert('Не удалось создать департамент.\n\n' + msg + '\n\n' + hint)
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
            <p v-if="settingsTabs === 'departments'" class="text-xl font-semibold">Структура вашей организации
            </p>
            <p v-else-if="settingsTabs === 'roles'" class="text-xl font-semibold">Роли пользователей
            </p>
            <p v-else-if="settingsTabs === 'external'" class="text-xl font-semibold">Структура внешней
              организации
            </p>
          </div>
          <div>
            <p v-if="settingsTabs === 'departments'" class="text-sm font-normal text-bali">Управляйте департаментами
              и&nbsp;отделами, создавайте структуру
              вашей
              компании</p>
            <p v-if="settingsTabs === 'roles'" class="text-sm font-normal text-bali">Управляйте ролями и&nbsp;правами
              доступа</p>
            <p v-if="settingsTabs === 'external'" class="text-sm font-normal text-bali leading-normal">Управляйте
              внешними компаниями,
              департаментами и&nbsp;отделами, создавайте структуру внешних заказчиков</p>
          </div>
        </div>
        <div class="flex items-center">
          <UiButton v-if="settingsTabs === 'departments'" variant="action" size="semiaction" class="font-semibold"
            @click="handleOpenSettingsPopup('newDep')">Создать департамент
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
          { label: 'Департаменты', value: 'departments' },
          { label: 'Роли', value: 'roles' },
          { label: 'Внешние заказчики', value: 'external' },
        ]" v-model="settingsTabs" />
      </div>
    </div>
    <div v-if="settingsTabs === 'departments'">
      <div v-if="data.length > 0" class="leading-normal">
        <div class="w-full rounded-t-fifteen bg-catskill px-15px py-25px flex">
          <MyCheckbox v-model="departmentsCheck" :twenty-gap="true" :label="'Подразделение'" :id="'departmentsCheck'"
            :labelColor="'bali'" :fontWeight="'medium'" @change="toggleAllDepartments" />
        </div>
        <div class="w-full bg-athens h-1px"></div>
        <div class="[&>*:not(:last-child)]:mb-1px rounded-begin">
          <div v-for="(dep, index) in data" :key="index" class="flex flex-col bg-white last-of-type:rounded-b-fifteen">
            <div class="flex items-center py-19px px-15px" :class="{ 'border-b border-athens': dep.viewSubs }"
              @mouseover="dep.hover = true" @mouseleave="dep.hover = false">
              <MyCheckbox v-model="dep.checked" :twenty-gap="true" :id="dep.name"
                @change="toggleAllSubDepartments(dep)" />
              <div class="flex justify-between w-full">
                <div>
                  <div v-if="dep.correctMainDep">
                    <MyInput v-model="dep.editName" :placeholder="'Введите новое название'"
                      :ref="setEditInputRef(dep, index)" @keyup.enter="saveEditDep(dep)" @blur="cancelEditDep(dep)" />
                  </div>
                  <div v-else>
                    <div class="cursor-pointer flex items-center" @click="dep.viewSubs = !dep.viewSubs">
                      <p class="text-sm font-medium mr-5px select-none"
                        :class="[dep.viewSubs ? 'text-dodger' : 'text-space']">{{ dep.name }}</p>
                      <div :class="[dep.viewSubs ? 'text-dodger rotate-180' : 'text-space']"><svg-icon
                          name="dropdown-arrow" width="16" height="16" /></div>

                    </div>
                    <span class="text-xs text-bali font-normal leading-130">ID {{ dep.customId }}</span>
                  </div>
                </div>
                <div class="gap-x-2.5 flex" v-show="dep.hover">
                  <button @click="dep.correctMainDep ? cancelEditDep(dep) : startEditDep(dep)"
                    class="border border-ahtens bg-athens-gray rounded-ten p-9px text-slate-custom hover:text-dodger hover:bg-zumthor hover:border-zumthor h-fit"><svg-icon
                      name="pencil" width="20" height="20" /></button>
                  <button @click="removeDepartmentPopup(dep)"
                    class="border border-ahtens bg-athens-gray rounded-ten p-9px text-slate-custom hover:text-dodger hover:bg-zumthor hover:border-zumthor h-fit"><svg-icon
                      name="basket-basket" width="20" height="20" /></button>
                </div>
              </div>
            </div>
            <div v-show="dep.viewSubs" class="rounded-inter">
              <div class="bg-white rounded-target">
                <draggable v-model="dep.subDepartments" item-key="id" :animation="200" handle=".drag-handle">
                  <template #item="{ element: sub, index: subIndex }">
                    <div
                      class="flex items-center px-15px py-2.5 border-b border-athens last-of-type:rounded-b-fifteen last-of-type:border-b-0"
                      :key="sub.id" @mouseover="sub.hover = true" @mouseleave="sub.hover = false">
                      <span class="drag-handle cursor-grab p-2.5 mr-2 rounded-ten hover:bg-zumthor opacity-0"
                        :class="[{ 'opacity-100': sub.hover }]"><svg-icon name="drag-burger" width="20"
                          height="20" /></span>
                      <MyCheckbox v-model="sub.checked" :twenty-gap="true" :id="sub.name" :label="sub.name"
                        :fontSize="'13px'" />
                      <div class="flex ml-auto gap-x-2.5 opacity-0" :class="[{ 'opacity-100': sub.hover }]">
                        <button
                          class="border border-ahtens bg-athens-gray rounded-ten p-9px text-slate-custom hover:text-dodger hover:bg-zumthor hover:border-zumthor h-fit"><svg-icon
                            name="pencil" width="20" height="20" /></button>
                        <!-- <button @click="removeSubDepartment(dep, subIndex)" -->
                        <button @click="removeSubDepartment(dep, subIndex)"
                          class="border border-ahtens bg-athens-gray rounded-ten p-9px text-slate-custom hover:text-dodger hover:bg-zumthor hover:border-zumthor h-fit"><svg-icon
                            name="basket-basket" width="20" height="20" /></button>
                        <button
                          class="border border-ahtens bg-athens-gray rounded-ten p-9px text-slate-custom hover:text-dodger hover:bg-zumthor hover:border-zumthor h-fit"><svg-icon
                            name="more-plus" width="20" height="20" /></button>
                      </div>
                    </div>
                  </template>
                </draggable>
              </div>
              <div class="flex items-center pl-60px py-2.5"><svg-icon name="plus-blue20" width="20" height="20"
                  @click="addSubDepartment(dep)" class="mr-2.5 cursor-pointer" />
                <div class="w-full pr-60px">
                  <MyInputSecond v-model="dep.newSubDep" :placeholder="'Введите название нового отдела'"
                    placeholderFontSize="13px" @keyup.enter="addSubDepartment(dep)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-bali min-h-[223px] flex items-center justify-center bg-catskill rounded-fifteen">
        <p class="text-15px font-medium text-bali">Пока что вы не добавили ни одного подразделения</p>
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
      <Popup :isOpen="settingsDepPopups.newDep" @close="handleCloseSettingsPopup('newDep')" :width="'490px'">
        <div>
          <p class="text-xl font-semibold text-space mb-25px">Новый департамент</p>
          <p class="font-medium text-space mb-15px">Название департамента</p>
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
      <Popup :isOpen="!!detailedDep" @close="closeDepSettings()" :width="'400px'">
        <div>
          <p class="text-xl font-semibold text-space mb-2.5 leading-normal">Удаление департамента</p>
          <p class="font-normal text-sm text-bali mb-35px">Вы действительно хотите удалить департмент {{
            detailedDep.name
          }}?
          </p>
          <div class="flex gap-x-2.5">
            <UiButton variant="delete" size="delete" @click="deleteDep()">Удалить</UiButton>
            <UiButton variant="back" size="second-back" @click="closeDepSettings()">Отмена</UiButton>
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