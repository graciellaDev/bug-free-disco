<script setup>
import { ref, onMounted, watch } from 'vue'
import BtnTab from '~/components/custom/BtnTab.vue'
import DotsDropdown from '~/components/custom/DotsDropdown.vue'
import Popup from '~/components/custom/Popup.vue'
import MyInput from '~/components/custom/MyInput.vue'
import TiptapEditor from '~/components/TiptapEditor.vue'
import UiButton from '@/components/ui/button/Button.vue'
import { getEmailTemplates, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '@/src/api/emailTemplates'

const templatesTabs = ref('email')

definePageMeta({
  layout: 'settings',
})

useHead({
  title: 'Настройки — Шаблоны',
})

/** Шаблоны с сервера: content = body из API для совместимости с формой */
const emailTemplates = ref([])
const emailTemplatesLoading = ref(false)

const messengersTemplates = ref([
  {
    id: 1,
    name: 'Отказ',
  },
  {
    id: 2,
    name: 'Приглашение'
  },
  {
    id: 3,
    name: 'Отказ'
  }
])

const formsTemplates = ref([
  {
    id: 1,
    name: 'Отказ',
  },
  {
    id: 2,
    name: 'Приглашение'
  },
  {
    id: 3,
    name: 'Отказ'
  }
])

const templatesTemplates = ref([
  {
    id: 1,
    name: 'Отказ',
  },
  {
    id: 2,
    name: 'Приглашение'
  },
  {
    id: 3,
    name: 'Отказ'
  }
])

const smsTemplates = ref([
  {
    id: 1,
    name: 'Отказ',
  },
  {
    id: 2,
    name: 'Приглашение'
  },
  {
    id: 3,
    name: 'Отказ'
  }
])
const templatePopupOpen = ref(false)
/** null = создание, иначе редактирование шаблона с этим id */
const editingTemplateId = ref(null)
const templateName = ref('')
const templateSubject = ref('')
const templateContent = ref('<p></p>')

const isEditMode = () => editingTemplateId.value != null
const popupTitle = () => (isEditMode() ? 'Редактирование шаблона' : 'Новый шаблон')

const EMAIL_VARIABLES = [
  { key: '{{contact.name}}', label: 'Имя кандидата' },
  { key: '{{profile.name}}', label: 'Имя профиля пользователя' },
  { key: '{{profile.phone}}', label: 'Телефон профиля пользователя' },
]

function openCreateTemplate() {
  editingTemplateId.value = null
  templateName.value = ''
  templateSubject.value = ''
  templateContent.value = '<p></p>'
  templatePopupOpen.value = true
}

function openEditTemplate(template) {
  editingTemplateId.value = template.id
  templateName.value = template.name || ''
  templateSubject.value = template.subject ?? ''
  const raw = (template.content ?? template.body) && String(template.content ?? template.body).trim() ? (template.content ?? template.body) : '<p></p>'
  templateContent.value = sanitizeEditorContent(raw)
  templatePopupOpen.value = true
}

function closeTemplatePopup() {
  templatePopupOpen.value = false
  editingTemplateId.value = null
}

async function loadEmailTemplates() {
  emailTemplatesLoading.value = true
  try {
    const list = await getEmailTemplates()
    emailTemplates.value = (list || []).map((t) => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      content: t.body ?? '',
    }))
  } catch {
    emailTemplates.value = []
  } finally {
    emailTemplatesLoading.value = false
  }
}

function handleTemplateAction(template, item) {
  if (item === 'Настроить') {
    openEditTemplate(template)
  }
  if (item === 'Удалить') {
    if (confirm('Удалить шаблон «' + template.name + '»?')) {
      deleteEmailTemplate(template.id)
        .then(() => loadEmailTemplates())
        .catch(() => {})
    }
  }
}

/** Разрешённые теги редактора (Bold, Italic, списки, ссылки). Убирает подчёркивания, style, class и прочее. */
function sanitizeEditorContent(html) {
  if (typeof html !== 'string' || !html.trim()) return '<p></p>'
  if (typeof document === 'undefined') return html
  const allowedTags = new Set(['p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'a'])
  const allowedAttrs = { a: ['href'] }
  const div = document.createElement('div')
  div.innerHTML = html.trim()

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.cloneNode(true)
    if (node.nodeType !== Node.ELEMENT_NODE) return null
    const tag = node.tagName.toLowerCase()
    if (!allowedTags.has(tag)) {
      const frag = document.createDocumentFragment()
      node.childNodes.forEach((child) => {
        const c = walk(child)
        if (c) frag.appendChild(c)
      })
      const wrap = document.createElement('p')
      wrap.appendChild(frag)
      return wrap
    }
    const el = document.createElement(tag)
    if (tag === 'a' && allowedAttrs.a) {
      const href = node.getAttribute('href')
      if (href) el.setAttribute('href', href)
    }
    node.childNodes.forEach((child) => {
      const c = walk(child)
      if (c) el.appendChild(c)
    })
    return el
  }

  const out = document.createElement('div')
  div.childNodes.forEach((child) => {
    const c = walk(child)
    if (c) out.appendChild(c)
  })
  return out.innerHTML || '<p></p>'
}

async function submitTemplate() {
  const body = sanitizeEditorContent(templateContent.value)
  const name = templateName.value.trim()
  const subject = templateSubject.value
  if (!name) return
  try {
    if (isEditMode()) {
      await updateEmailTemplate(editingTemplateId.value, { name, subject, body })
    } else {
      await createEmailTemplate({ name, subject, body })
    }
    await loadEmailTemplates()
    closeTemplatePopup()
  } catch {
    // ошибка уже обработана в api client
  }
}

onMounted(() => {
  loadEmailTemplates()
})
watch(templatesTabs, (tab) => {
  if (tab === 'email') loadEmailTemplates()
})
</script>

<template>
  <div>
    <div class="mb-6px">
      <div class="flex justify-between mb-1px bg-white rounded-t-fifteen p-25px gap-2.5 pb-23px items-center">
        <div>
          <p class="text-xl text-space mb-2.5 font-semibold">Шаблоны писем</p>
          <p class="text-sm text-bali font-normal leading-150">Редактируйте и&nbsp;настраивайте автоотправку писем</p>
        </div>
        <UiButton variant="action" size="semiaction" class="font-semibold" @click="openCreateTemplate">Создать
          шаблон</UiButton>
      </div>
      <div class="bg-catskill w-full px-25px py-15px rounded-b-fifteen">
        <BtnTab :tabs="[
          { label: 'Email', value: 'email' },
          { label: 'Мессенджеры', value: 'messenger' },
          { label: 'Анкеты', value: 'forms' },
          { label: 'Формы', value: 'templates' },
          { label: 'Смс', value: 'sms' }
        ]" v-model="templatesTabs" />
      </div>
    </div>
    <div v-if="templatesTabs === 'email'">
      <div v-if="emailTemplates.length > 0">
        <div class="bg-catskill rounded-t-fifteen py-25px px-35px mb-1px">
          <p class="text-sm font-medium text-bali leading-normal">Название шаблона</p>
        </div>
        <div
          class="bg-white last:rounded-b-fifteen [&>*:not(:last-child)]:border-b [&>*:not(:last-child)]:border-athens">
          <div v-for="(template, index) in emailTemplates" :key="template.id">
            <div class="flex justify-between items-center py-[10.5px] px-25px">
              <p class="text-sm font-medium text-space leading-150 pl-2.5">{{ template.name }}</p>
              <DotsDropdown :width="'fit'" :items="['Настроить', 'Удалить']" @select-item="(item) => handleTemplateAction(template, item)" />
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-bali min-h-[223px] flex items-center justify-center bg-catskill rounded-fifteen">
        <p class="text-15px font-medium text-bali">Вы еще не создавали шаблоны</p>
      </div>
    </div>
    <div v-else-if="templatesTabs === 'messenger'">
      <div v-if="messengersTemplates.length > 0">
        <div class="bg-catskill rounded-t-fifteen py-25px px-35px mb-1px">
          <p class="text-sm font-medium text-bali leading-150">Название шаблона</p>
        </div>
        <div
          class="bg-white last:rounded-b-fifteen [&>*:not(:last-child)]:border-b [&>*:not(:last-child)]:border-athens">
          <div v-for="(template, index) in messengersTemplates" :key="index">
            <div class="flex justify-between items-center py-[10.5px] px-25px">
              <p class="text-sm font-medium text-space leading-150 pl-2.5">{{ template.name }}</p>
              <DotsDropdown :width="'fit'" :items="['Настроить', 'Удалить']" />
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-bali min-h-[223px] flex items-center justify-center bg-catskill rounded-fifteen">
        <p class="text-15px font-medium text-bali">Вы еще не создавали шаблоны</p>
      </div>
    </div>
    <div v-else-if="templatesTabs === 'forms'">
      <div v-if="formsTemplates.length > 0">
        <div class="bg-catskill rounded-t-fifteen py-25px px-35px mb-1px">
          <p class="text-sm font-medium text-bali leading-150">Название шаблона</p>
        </div>
        <div
          class="bg-white last:rounded-b-fifteen [&>*:not(:last-child)]:border-b [&>*:not(:last-child)]:border-athens">
          <div v-for="(template, index) in formsTemplates" :key="index">
            <div class="flex justify-between items-center py-[10.5px] px-25px">
              <p class="text-sm font-medium text-space leading-150 pl-2.5">{{ template.name }}</p>
              <DotsDropdown :width="'fit'" :items="['Настроить', 'Удалить']" />
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-bali min-h-[223px] flex items-center justify-center bg-catskill rounded-fifteen">
        <p class="text-15px font-medium text-bali">Вы еще не создавали шаблоны</p>
      </div>
    </div>
    <div v-else-if="templatesTabs === 'templates'">
      <div v-if="templatesTemplates.length > 0">
        <div class="bg-catskill rounded-t-fifteen py-25px px-35px mb-1px">
          <p class="text-sm font-medium text-bali leading-150">Название шаблона</p>
        </div>
        <div
          class="bg-white last:rounded-b-fifteen [&>*:not(:last-child)]:border-b [&>*:not(:last-child)]:border-athens">
          <div v-for="(template, index) in templatesTemplates" :key="index">
            <div class="flex justify-between items-center py-[10.5px] px-25px">
              <p class="text-sm font-medium text-space leading-150 pl-2.5">{{ template.name }}</p>
              <DotsDropdown :width="'fit'" :items="['Настроить', 'Удалить']" />
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-bali min-h-[223px] flex items-center justify-center bg-catskill rounded-fifteen">
        <p class="text-15px font-medium text-bali">Вы еще не создавали шаблоны</p>
      </div>
    </div>
    <div v-else-if="templatesTabs === 'sms'">
      <div v-if="smsTemplates.length > 0">
        <div class="bg-catskill rounded-t-fifteen py-25px px-35px mb-1px">
          <p class="text-sm font-medium text-bali leading-150">Название шаблона</p>
        </div>
        <div
          class="bg-white last:rounded-b-fifteen [&>*:not(:last-child)]:border-b [&>*:not(:last-child)]:border-athens">
          <div v-for="(template, index) in smsTemplates" :key="index">
            <div class="flex justify-between items-center py-[10.5px] px-25px">
              <p class="text-sm font-medium text-space leading-150 pl-2.5">{{ template.name }}</p>
              <DotsDropdown :width="'fit'" :items="['Настроить', 'Удалить']" />
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-bali min-h-[223px] flex items-center justify-center bg-catskill rounded-fifteen">
        <p class="text-15px font-medium text-bali">Вы еще не создавали шаблоны</p>
      </div>
    </div>
    <transition name="fade">
      <Popup
        :isOpen="templatePopupOpen"
        @close="closeTemplatePopup"
        width="790px"
        :showCloseButton="false"
        :contentPadding="false"
        :contentRounded="true"
        :noOuterPadding="true"
        :maxHeight="false"
        maxHeightValue="85vh"
      >
        <div class="rounded-fifteen bg-white p-[25px]">
          <h2 class="text-xl font-semibold leading-130 text-[#2f353d] mb-6">{{ popupTitle() }}</h2>

          <div class="mb-5">
            <label class="mb-2 block text-sm font-medium text-space">Название шаблона</label>
            <MyInput v-model="templateName" placeholder="Например: Приглашение на собеседование" class="w-full" />
          </div>

          <div class="mb-5">
            <label class="mb-2 block text-sm font-medium text-space">Тема письма</label>
            <MyInput v-model="templateSubject" placeholder="Например: Приглашаем на вакансию" class="w-full" />
          </div>

          <div class="mb-6">
            <label class="mb-2 block text-sm font-medium text-space">Содержание письма</label>
            <div class="rounded-ten border border-[#edeff5] bg-[#F5F6F8] overflow-hidden">
              <TiptapEditor v-model="templateContent" />
            </div>
          </div>

          <div class="mb-6">
            <p class="text-xs font-medium text-[#8a94a6] mb-2">Доступные переменные</p>
            <ul class="space-y-1.5 text-sm text-[#2f353d]">
              <li v-for="v in EMAIL_VARIABLES" :key="v.key" class="flex items-baseline gap-2">
                <code class="shrink-0 rounded px-1.5 py-0.5 text-dodger font-mono text-xs">{{ v.key }}</code>
                <span class="text-[#8a94a6]">— {{ v.label }}</span>
              </li>
            </ul>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <UiButton variant="action" size="semiaction" @click="submitTemplate">
              {{ isEditMode() ? 'Сохранить' : 'Создать' }}
            </UiButton>
            <UiButton variant="back" size="second-back" @click="closeTemplatePopup">Закрыть</UiButton>
          </div>
        </div>
      </Popup>
    </transition>
  </div>
</template>

<style scoped>
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

:deep(.ProseMirror) {
  min-height: 299px;
}
</style>