<script setup>
import { ref, onMounted, watch } from 'vue'
import BtnTab from '~/components/custom/BtnTab.vue'
import Popup from '~/components/custom/Popup.vue'
import DeleteConfirmPopup from '~/components/custom/DeleteConfirmPopup.vue'
import MyInput from '~/components/custom/MyInput.vue'
import TiptapEditor from '~/components/TiptapEditor.vue'
import UiButton from '@/components/ui/button/Button.vue'
import { getEmailTemplates, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '@/src/api/emailTemplates'
import { getCommentTemplatesLibrary, saveCommentTemplatesLibrary } from '@/utils/commentTemplates'

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
const commentTemplatesLibrary = ref([])
const templatePopupOpen = ref(false)
const commentTemplatePopupOpen = ref(false)
const templateDeletePopupOpen = ref(false)
const templateDeletingRow = ref(null)
const templateDeletingType = ref('email')
const templateDeleteLoading = ref(false)
/** null = создание, иначе редактирование шаблона с этим id */
const editingTemplateId = ref(null)
const editingCommentTemplateId = ref(null)
const templateName = ref('')
const templateSubject = ref('')
const templateSubjectContent = ref('<p></p>')
const templateContent = ref('<p></p>')
const commentTemplateName = ref('')
const commentTemplateText = ref('')
const templateAttachmentInputRef = ref(null)
const templateAttachments = ref([])
const templateSubjectEditorRef = ref(null)
const templateEditorRef = ref(null)
const activeVariableTarget = ref('body')

const isEditMode = () => editingTemplateId.value != null
const popupTitle = () => (isEditMode() ? 'Редактирование шаблона' : 'Новый шаблон')
const isCommentEditMode = () => editingCommentTemplateId.value != null
const commentPopupTitle = () => (isCommentEditMode() ? 'Редактирование шаблона комментария' : 'Новый шаблон комментария')
const deleteTemplateTitle = () => String(templateDeletingRow.value?.name ?? templateDeletingRow.value?.title ?? '').trim()
const EMAIL_VARIABLES = [
  { key: '{{contact.name}}', label: 'фио кандидата' },
  { key: '{{candidate.first_name}}', label: 'имя кандидата' },
  { key: '{{candidate.last_name}}', label: 'фамилия кандидата' },
  { key: '{{candidate.middle_name}}', label: 'отчество кандидата' },
  { key: '{{vacancy.name}}', label: 'название вакансии' },
  { key: '{{vacancy.phone}}', label: 'телефон вакансии' },
  { key: '{{profile.name}}', label: 'моё имя' },
  { key: '{{company.name}}', label: 'название компании' },
  { key: '{{vacancy.link}}', label: 'ссылка на вакансию' },
  { key: '{{consent.link}}', label: 'ссылка на страницу согласия' },
  { key: '{{candidate.source}}', label: 'источник кандидата' },
  { key: '{{candidate.cv_link}}', label: 'ссылка на резюме (cv)' },
]
const EMAIL_VARIABLE_LABELS = Object.fromEntries(EMAIL_VARIABLES.map((v) => [v.key, v.label]))
const LEGACY_VARIABLE_ALIASES = {
  '{{profile.phone}}': '{{vacancy.phone}}',
}

function insertEmailVariable(variable) {
  if (!variable?.key || !variable?.label) return
  if (activeVariableTarget.value === 'subject') {
    templateSubjectEditorRef.value?.insertVariable?.(variable)
    return
  }
  templateEditorRef.value?.insertVariable?.(variable)
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function variableTokenPattern(token) {
  const tokenString = String(token || '').trim()
  const inner = tokenString.replace(/^\{\{\s*|\s*\}\}$/g, '')
  return new RegExp(`\\{\\{\\s*${escapeRegExp(inner)}\\s*\\}\\}`, 'gi')
}

function toEditorVariableChips(html) {
  let out = String(html || '')
  Object.entries(LEGACY_VARIABLE_ALIASES).forEach(([oldToken, newToken]) => {
    const pattern = variableTokenPattern(oldToken)
    out = out.replace(pattern, newToken)
  })
  out = out.replace(
    /<a\b[^>]*href=["']var-token:([^"']+)["'][^>]*>(.*?)<\/a>/giu,
    (_full, encoded, innerText) => {
      let token = ''
      try {
        token = decodeURIComponent(String(encoded || ''))
      } catch {
        token = ''
      }
      if (!token) return String(innerText || '')
      const label = EMAIL_VARIABLE_LABELS[token] || String(innerText || '').trim() || token
      return `<span data-var-token="${token}" data-var-label="${label}">${label}</span>`
    }
  )
  out = out.replace(
    /<span\b([^>]*)data-var-token=["']([^"']+)["']([^>]*)>(.*?)<\/span>/giu,
    (_full, _before, token, _after, innerText) => {
      const safeToken = String(token || '').trim()
      if (!safeToken) return String(innerText || '')
      const label = EMAIL_VARIABLE_LABELS[safeToken] || String(innerText || '').trim() || safeToken
      return `<span data-var-token="${safeToken}" data-var-label="${label}">${label}</span>`
    }
  )
  EMAIL_VARIABLES.forEach((v) => {
    const pattern = variableTokenPattern(v.key)
    out = out.replace(
      pattern,
      `<span data-var-token="${v.key}" data-var-label="${v.label}">${v.label}</span>`
    )
  })
  return out
}

function fromEditorVariableChips(html) {
  let out = String(html || '')
  out = out.replace(
    /<span\b[^>]*data-var-token=["']([^"']+)["'][^>]*>.*?<\/span>/giu,
    (_full, token) => String(token || '')
  )
  out = out.replace(
    /<a\b[^>]*href=["']var-token:([^"']+)["'][^>]*>.*?<\/a>/giu,
    (_full, encoded) => {
      try {
        return decodeURIComponent(String(encoded))
      } catch {
        return ''
      }
    }
  )
  return out
}

function subjectHtmlToText(html) {
  const withTokens = fromEditorVariableChips(html)
  const withoutBlockTags = String(withTokens || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<p[^>]*>/gi, ' ')
  if (typeof document === 'undefined') {
    return withoutBlockTags.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const div = document.createElement('div')
  div.innerHTML = withoutBlockTags
  return String(div.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function openCreateTemplate() {
  editingTemplateId.value = null
  templateName.value = ''
  templateSubject.value = ''
  templateSubjectContent.value = toEditorVariableChips('<p></p>')
  templateContent.value = toEditorVariableChips('<p></p>')
  templateAttachments.value = []
  activeVariableTarget.value = 'body'
  templatePopupOpen.value = true
}

function openCreateCommentTemplate() {
  editingCommentTemplateId.value = null
  commentTemplateName.value = ''
  commentTemplateText.value = ''
  commentTemplatePopupOpen.value = true
}

function openEditTemplate(template) {
  editingTemplateId.value = template.id
  templateName.value = template.name || ''
  templateSubject.value = template.subject ?? ''
  templateSubjectContent.value = toEditorVariableChips(templateSubject.value || '<p></p>')
  const raw = (template.content ?? template.body) && String(template.content ?? template.body).trim() ? (template.content ?? template.body) : '<p></p>'
  templateContent.value = toEditorVariableChips(raw)
  templateAttachments.value = []
  activeVariableTarget.value = 'body'
  templatePopupOpen.value = true
}

function openEditCommentTemplate(template) {
  editingCommentTemplateId.value = template.id
  commentTemplateName.value = String(template.title || '').trim()
  commentTemplateText.value = String(template.text || '').trim()
  commentTemplatePopupOpen.value = true
}

function closeTemplatePopup() {
  templatePopupOpen.value = false
  editingTemplateId.value = null
  templateAttachments.value = []
}

function closeCommentTemplatePopup() {
  commentTemplatePopupOpen.value = false
  editingCommentTemplateId.value = null
}

function openTemplateAttachmentPicker() {
  templateAttachmentInputRef.value?.click?.()
}

function formatAttachmentSize(size) {
  const bytes = Number(size || 0)
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function onTemplateAttachmentsSelect(event) {
  const files = Array.from(event?.target?.files || [])
  if (!files.length) return
  const existing = new Set(templateAttachments.value.map((item) => item.key))
  const next = files
    .map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      size: Number(file.size || 0),
      file,
    }))
    .filter((item) => !existing.has(item.key))
  if (next.length) {
    templateAttachments.value = [...templateAttachments.value, ...next]
  }
  if (event?.target) {
    event.target.value = ''
  }
}

function removeTemplateAttachment(attachmentKey) {
  templateAttachments.value = templateAttachments.value.filter((item) => item.key !== attachmentKey)
}

function openTemplateDelete(template) {
  if (!template?.id) return
  templateDeletingRow.value = template
  templateDeletingType.value = templatesTabs.value === 'comments' ? 'comment' : 'email'
  templateDeletePopupOpen.value = true
}

function closeTemplateDelete(force = false) {
  if (templateDeleteLoading.value && !force) return
  templateDeletePopupOpen.value = false
  templateDeletingRow.value = null
}

async function doDeleteTemplate() {
  const deleting = templateDeletingRow.value
  if (!deleting?.id) return
  templateDeleteLoading.value = true
  try {
    if (templateDeletingType.value === 'email') {
      const templateId = Number(deleting.id)
      if (!Number.isFinite(templateId) || templateId <= 0) return
      await deleteEmailTemplate(templateId)
      await loadEmailTemplates()
    } else {
      commentTemplatesLibrary.value = saveCommentTemplatesLibrary(
        commentTemplatesLibrary.value.filter((item) => item.id !== deleting.id)
      )
    }
    closeTemplateDelete(true)
  } catch {
    // ошибка уже обработана в api client
  } finally {
    templateDeleteLoading.value = false
  }
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
  if (templatesTabs.value === 'comments') {
    if (item === 'Настроить') {
      openEditCommentTemplate(template)
    }
    if (item === 'Удалить') {
      openTemplateDelete(template)
    }
    return
  }
  if (item === 'Настроить') {
    openEditTemplate(template)
  }
  if (item === 'Удалить') {
    openTemplateDelete(template)
  }
}

function makeCommentTemplateId() {
  return `comment-template-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function submitCommentTemplate() {
  const title = String(commentTemplateName.value || '').trim()
  const text = String(commentTemplateText.value || '').trim()
  if (!title || !text) return

  const next = [...commentTemplatesLibrary.value]
  if (isCommentEditMode()) {
    const idx = next.findIndex((item) => item.id === editingCommentTemplateId.value)
    if (idx >= 0) {
      next[idx] = { ...next[idx], title, text }
    }
  } else {
    next.unshift({
      id: makeCommentTemplateId(),
      title,
      text,
    })
  }
  commentTemplatesLibrary.value = saveCommentTemplatesLibrary(next)
  closeCommentTemplatePopup()
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
  const body = sanitizeEditorContent(fromEditorVariableChips(templateContent.value))
  const name = templateName.value.trim()
  const subject = subjectHtmlToText(templateSubjectContent.value)
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
  commentTemplatesLibrary.value = getCommentTemplatesLibrary()
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
          <p class="text-xl text-space mb-2.5 font-semibold">
            {{ templatesTabs === 'comments' ? 'Шаблоны комментариев' : 'Шаблоны писем' }}
          </p>
          <p class="text-sm text-bali font-normal leading-150">
            {{ templatesTabs === 'comments'
              ? 'Готовые тексты для быстрых заметок в ленте событий'
              : 'Редактируйте и&nbsp;настраивайте автоотправку писем' }}
          </p>
        </div>
        <UiButton
          v-if="templatesTabs === 'email' || templatesTabs === 'comments'"
          variant="action"
          size="semiaction"
          class="font-semibold"
          @click="templatesTabs === 'comments' ? openCreateCommentTemplate() : openCreateTemplate()"
        >
          Создать шаблон
        </UiButton>
      </div>
      <div class="bg-catskill w-full px-25px py-15px rounded-b-fifteen">
        <BtnTab :tabs="[
          { label: 'Email', value: 'email' },
          { label: 'Комментарии', value: 'comments' }
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
              <div class="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  class="group/btn flex items-center gap-0.5 rounded text-sm font-normal leading-150 text-[#92989B] transition-colors hover:text-dodger"
                  title="Удалить"
                  @click="handleTemplateAction(template, 'Удалить')"
                >
                  <span class="flex h-6 w-6 items-center justify-center text-red-500 transition-colors group-hover/btn:text-red-600">
                    <svg-icon name="basket-basket" width="12" height="12" />
                  </span>
                  <span class="text-sm font-normal leading-150 text-[#92989B] transition-colors group-hover/btn:text-dodger">Удалить</span>
                </button>
                <button
                  type="button"
                  class="group/btn flex items-center gap-0.5 rounded text-sm font-normal leading-150 text-[#92989B] transition-colors hover:text-dodger"
                  title="Редактировать"
                  @click="handleTemplateAction(template, 'Настроить')"
                >
                  <span class="flex h-6 w-6 items-center justify-center text-dodger transition-colors group-hover/btn:text-dodger">
                    <svg-icon name="pencil" width="12" height="12" />
                  </span>
                  <span class="text-sm font-normal leading-150 text-[#92989B] transition-colors group-hover/btn:text-dodger">Редактировать</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-bali min-h-[223px] flex items-center justify-center bg-catskill rounded-fifteen">
        <p class="text-15px font-medium text-bali">Вы еще не создавали шаблоны</p>
      </div>
    </div>
    <div v-else-if="templatesTabs === 'comments'">
      <div v-if="commentTemplatesLibrary.length > 0">
        <div class="bg-catskill rounded-t-fifteen py-25px px-35px mb-1px">
          <p class="text-sm font-medium text-bali leading-normal">Название шаблона</p>
        </div>
        <div class="bg-white last:rounded-b-fifteen [&>*:not(:last-child)]:border-b [&>*:not(:last-child)]:border-athens">
          <div v-for="template in commentTemplatesLibrary" :key="template.id">
            <div class="flex justify-between items-center py-[10.5px] px-25px">
              <p class="text-sm font-medium text-space leading-150 pl-2.5">{{ template.title }}</p>
              <div class="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  class="group/btn flex items-center gap-0.5 rounded text-sm font-normal leading-150 text-[#92989B] transition-colors hover:text-dodger"
                  title="Удалить"
                  @click="handleTemplateAction(template, 'Удалить')"
                >
                  <span class="flex h-6 w-6 items-center justify-center text-red-500 transition-colors group-hover/btn:text-red-600">
                    <svg-icon name="basket-basket" width="12" height="12" />
                  </span>
                  <span class="text-sm font-normal leading-150 text-[#92989B] transition-colors group-hover/btn:text-dodger">Удалить</span>
                </button>
                <button
                  type="button"
                  class="group/btn flex items-center gap-0.5 rounded text-sm font-normal leading-150 text-[#92989B] transition-colors hover:text-dodger"
                  title="Редактировать"
                  @click="handleTemplateAction(template, 'Настроить')"
                >
                  <span class="flex h-6 w-6 items-center justify-center text-dodger transition-colors group-hover/btn:text-dodger">
                    <svg-icon name="pencil" width="12" height="12" />
                  </span>
                  <span class="text-sm font-normal leading-150 text-[#92989B] transition-colors group-hover/btn:text-dodger">Редактировать</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-bali min-h-[223px] flex items-center justify-center bg-catskill rounded-fifteen">
        <p class="text-15px font-medium text-bali">Вы еще не создавали шаблоны</p>
      </div>
    </div>
    <DeleteConfirmPopup
      :isOpen="templateDeletePopupOpen"
      :loading="templateDeleteLoading"
      title="Подтверждение удаления"
      @close="closeTemplateDelete"
      @confirm="doDeleteTemplate"
    >
      Вы уверены, что хотите удалить
      <span class="font-semibold text-space">
        {{ templateDeletingType === 'comment' ? 'шаблон комментария' : 'шаблон' }}
        «{{ deleteTemplateTitle() }}»
      </span>
      из списка?
    </DeleteConfirmPopup>
    <transition name="fade">
      <Popup
        :isOpen="commentTemplatePopupOpen"
        @close="closeCommentTemplatePopup"
        width="560px"
        :showCloseButton="false"
        :contentPadding="false"
        :contentRounded="true"
        :noOuterPadding="true"
      >
        <div class="flex min-h-0 flex-col overflow-hidden rounded-fifteen bg-white">
          <div class="shrink-0 border-b border-athens px-25px py-20px">
            <h2 class="text-xl font-semibold leading-130 text-[#2f353d]">{{ commentPopupTitle() }}</h2>
          </div>
          <div class="min-h-0 flex-1 px-25px py-20px">
            <div class="mb-5">
              <label class="mb-2 block text-sm font-medium text-space">Название шаблона</label>
              <MyInput v-model="commentTemplateName" placeholder="Например: Созвон проведён" class="w-full" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-space">Текст комментария</label>
              <textarea
                v-model="commentTemplateText"
                rows="5"
                class="w-full resize-y rounded-ten border border-athens bg-white px-3 py-2.5 text-sm text-space outline-none placeholder:text-[#b0b8c4] focus:border-dodger"
                placeholder="Введите текст шаблона комментария"
              />
            </div>
          </div>
          <div class="shrink-0 border-t border-athens px-25px py-15px">
            <div class="flex flex-wrap items-center gap-3">
              <UiButton variant="action" size="semiaction" @click="submitCommentTemplate">
                {{ isCommentEditMode() ? 'Сохранить' : 'Создать' }}
              </UiButton>
              <UiButton variant="back" size="second-back" @click="closeCommentTemplatePopup">Закрыть</UiButton>
            </div>
          </div>
        </div>
      </Popup>
    </transition>
    <transition name="fade">
      <Popup
        :isOpen="templatePopupOpen"
        @close="closeTemplatePopup"
        width="790px"
        :showCloseButton="false"
        :contentPadding="false"
        :contentRounded="true"
        :noOuterPadding="true"
        :maxHeight="true"
        maxHeightValue="85vh"
        :noScrollbarGutter="true"
      >
        <div class="flex max-h-[85vh] min-h-0 flex-col overflow-hidden rounded-fifteen bg-white">
          <div class="shrink-0 border-b border-athens px-25px py-20px">
            <h2 class="text-xl font-semibold leading-130 text-[#2f353d]">{{ popupTitle() }}</h2>
          </div>

          <div class="popup-scroll min-h-0 flex-1 overflow-y-auto px-25px py-20px">
            <div class="mb-5">
              <label class="mb-2 block text-sm font-medium text-space">Название шаблона</label>
              <MyInput v-model="templateName" placeholder="Например: Приглашение на собеседование" class="w-full" />
            </div>

            <div class="mb-5">
              <label class="mb-2 block text-sm font-medium text-space">Тема письма</label>
              <TiptapEditor
                ref="templateSubjectEditorRef"
                v-model="templateSubjectContent"
                :showToolbar="false"
                :singleLine="true"
                :editorClass="'text-[#2F353D] font-normal text-sm'"
                @focus="activeVariableTarget = 'subject'"
              />
            </div>

            <div class="mb-6">
              <label class="mb-2 block text-sm font-medium text-space">Содержание письма</label>
              <div class="rounded-ten border border-[#edeff5] bg-[#F5F6F8] overflow-hidden">
                <TiptapEditor
                  ref="templateEditorRef"
                  v-model="templateContent"
                  @focus="activeVariableTarget = 'body'"
                />
              </div>
            </div>

            <div class="mb-4">
              <p class="mb-2 text-sm font-medium text-space">Вложения</p>
              <input
                ref="templateAttachmentInputRef"
                type="file"
                multiple
                class="sr-only"
                @change="onTemplateAttachmentsSelect"
              />
              <button
                type="button"
                class="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] border border-[#cbe9e5] bg-[#f2fbfa] px-4 py-2 text-sm font-semibold leading-normal text-[#59bdb3] transition-colors hover:border-[#b9e2dd] hover:bg-[#eaf8f6] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                @click="openTemplateAttachmentPicker"
              >
                <span class="flex h-4 w-4 items-center justify-center text-[#7bcfc7] transition-colors group-hover:text-[#59bdb3]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-4 w-4">
                    <path d="M21.44 11.05 12.25 20.24a6 6 0 1 1-8.49-8.49l9.2-9.2a4 4 0 1 1 5.65 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </span>
                <span>Прикрепить файл</span>
              </button>
              <div v-if="templateAttachments.length" class="mt-2.5 flex flex-col gap-2">
                <div
                  v-for="attachment in templateAttachments"
                  :key="attachment.key"
                  class="flex items-center justify-between rounded-ten border border-athens bg-white px-3 py-2"
                >
                  <p class="min-w-0 truncate text-sm text-space">
                    {{ attachment.name }}
                    <span class="text-bali">({{ formatAttachmentSize(attachment.size) }})</span>
                  </p>
                  <button
                    type="button"
                    class="ml-3 text-sm font-medium text-red-500 transition-colors hover:text-red-600"
                    @click="removeTemplateAttachment(attachment.key)"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>

            <div class="pb-1">
              <p class="mb-1.5 text-xs font-medium text-[#8a94a6]">Переменные</p>
              <div class="p-1">
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="v in EMAIL_VARIABLES"
                    :key="v.key"
                    type="button"
                    class="rounded-[8px] border border-[#cfe2ff] bg-zumthor px-2.5 py-1 text-xs font-medium leading-130 text-dodger transition-colors hover:bg-[#dcecff]"
                    :title="v.label"
                    @click="insertEmailVariable(v)"
                  >
                    {{ v.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="shrink-0 border-t border-athens px-25px py-15px">
            <div class="flex flex-wrap items-center gap-3">
              <UiButton variant="action" size="semiaction" @click="submitTemplate">
                {{ isEditMode() ? 'Сохранить' : 'Создать' }}
              </UiButton>
              <UiButton variant="back" size="second-back" @click="closeTemplatePopup">Закрыть</UiButton>
            </div>
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

:deep(.ProseMirror:not(.tiptap-single-line)) {
  min-height: 299px;
}

:deep(.ProseMirror .variable-chip),
:deep(.ProseMirror span[data-var-token]) {
  display: inline-block;
  margin: 0 2px;
  border: 1px solid #cfe2ff;
  border-radius: 8px;
  background: #e8f1ff;
  padding: 2px 10px;
  color: #5898ff;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.3;
  text-decoration: none;
  cursor: pointer;
}

:deep(.ProseMirror .variable-chip:hover),
:deep(.ProseMirror span[data-var-token]:hover) {
  background: #dcecff;
}
</style>