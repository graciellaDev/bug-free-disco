<script setup>
import { ref, onMounted } from 'vue'
import MyInput from '~/components/custom/MyInput.vue'
import MyTooltip from '~/components/custom/MyTooltip.vue'
import TiptapEditor from '~/components/TiptapEditor.vue'
import { getCompanyProfile, updateCompanyProfile } from '~/utils/companyProfile'

  definePageMeta({
    layout: 'settings',
  })

  useHead({
    title: 'Настройки — Профиль компании',
  })

const name = ref('')
const site = ref('')
const companyDescription = ref('')
const logoFile = ref(null)
const logoPreview = ref(null)
const logoUrl = ref(null)
const logoRemoved = ref(false)
const logoInputRef = ref(null)
const loading = ref(true)
const saving = ref(false)
const message = ref(null)

async function load() {
  loading.value = true
  const { data, error } = await getCompanyProfile()
  loading.value = false
  if (error) {
    message.value = error
    return
  }
  if (data) {
    name.value = data.name ?? 'ООО «ВОЙТИ В АЙТИ»'
    site.value = data.site ?? 'https://example.com'
    companyDescription.value = data.company_description ?? '<p>Наша компания — лидер в области IT-услуг и разработки. Мы успешно работаем на рынке с 2000 года и за это время накопили большой опыт.</p><p>Наши проекты отличаются высоким качеством и инновационными решениями.</p>'
    logoUrl.value = resolveLogoUrl(data.logo_url) ?? null
  }
  message.value = null
}

function onLogoChange(e) {
  const file = e.target?.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  logoFile.value = file
  logoRemoved.value = false
  const reader = new FileReader()
  reader.onload = () => { logoPreview.value = reader.result }
  reader.readAsDataURL(file)
}

function clearLogo() {
  logoFile.value = null
  logoPreview.value = null
  logoUrl.value = null
  logoRemoved.value = true
  if (logoInputRef.value) logoInputRef.value.value = ''
}

function resolveLogoUrl(url) {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  const config = useRuntimeConfig()
  const base = (config.public.apiBase || '').replace(/\/+$/, '')
  const origin = base.startsWith('http') ? new URL(base).origin : (typeof window !== 'undefined' ? window.location.origin : '')
  return origin ? `${origin}${trimmed.startsWith('/') ? '' : '/'}${trimmed}` : trimmed
}

async function save() {
  saving.value = true
  message.value = null
  const { data: updateData, error } = await updateCompanyProfile({
    name: name.value,
    site: site.value || undefined,
    company_description: companyDescription.value || undefined,
    logo: logoFile.value || undefined,
    removeLogo: logoRemoved.value,
  })
  saving.value = false
  logoFile.value = null
  logoPreview.value = null
  logoRemoved.value = false
  if (error) {
    message.value = error
    return
  }
  message.value = 'Изменения сохранены'

  // После сохранения логотипа заново запрашиваем профиль и выставляем URL картинки (бэкенд отдаёт полный URL).
  const { data: freshData } = await getCompanyProfile()
  const raw = freshData?.logo_url ?? updateData?.logo_url ?? freshData?.logo ?? updateData?.logo
  const url = resolveLogoUrl(raw)
  logoUrl.value = url ? url + (url.includes('?') ? '&' : '?') + 't=' + Date.now() : null
}

onMounted(() => load())
</script>

<template>
  <div class="default-template">
    <div class="rounded-fifteen p-25px bg-white mb-15px">
      <h1 class="text-xl font-semibold text-space mb-2.5">Информация о компании</h1>
      <p class="text-sm font-normal text-slate-custom mb-0">Информация о вашей компании в сети</p>
    </div>

    <div class="rounded-fifteen p-25px bg-white">
      <h2 class="text-lg font-semibold text-space mb-2.5">Профиль компании</h2>
      <p class="text-sm font-normal text-slate-custom mb-25px leading-150">
        Описание компании поможет выделить вас на некоторых досках объявлений о вакансиях, включая доску внешнюю вакансию Jobly.
      </p>

      <div v-if="loading" class="py-8 text-center text-slate-custom">
        Загрузка...
      </div>
      <template v-else>
        <p v-if="message" :class="message === 'Изменения сохранены' ? 'text-green mb-15px' : 'text-red-custom mb-15px'" class="text-sm">
          {{ message }}
        </p>

        <div class="mb-25px flex flex-nowrap items-start">
          <div class="shrink-0 flex flex-col overflow-hidden pr-[25px] box-border">
            <p class="text-sm font-medium text-space leading-150 mb-15px">Логотип</p>
            <div class="logo-circle w-[130px] h-[130px] shrink-0 relative overflow-hidden">
              <label class="absolute inset-0 flex flex-col items-center justify-center cursor-pointer overflow-hidden group/logo transition-colors bg-gallery hover:bg-zumthor">
                <input ref="logoInputRef" type="file" accept="image/*" class="sr-only" @change="onLogoChange">
                <template v-if="logoPreview || logoUrl">
                  <img :src="logoPreview || logoUrl" alt="Логотип" class="absolute inset-0 w-full h-full object-cover pointer-events-none">
                  <span class="absolute inset-0 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity bg-space/90">
                    <button
                      type="button"
                      class="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-athens-gray shrink-0"
                      title="Удалить логотип"
                      @click.stop.prevent="clearLogo"
                    >
                      <svg-icon name="basket-fill" class="text-red-custom shrink-0" width="18" height="17" />
                    </button>
                  </span>
                </template>
                <template v-else>
                  <svg-icon name="camera-plus" class="text-slate-custom group-hover/logo:text-dodger shrink-0 transition-colors" width="25" height="25" />
                  <span class="text-sm font-normal text-slate-custom group-hover/logo:text-dodger mt-2 transition-colors">Загрузить</span>
                </template>
              </label>
            </div>
          </div>
          <div class="flex-1 min-w-0 flex flex-col gap-25px">
            <div>
              <p class="text-sm font-medium text-space leading-150 mb-15px">Название компании</p>
              <MyInput v-model="name" placeholder="Введите название вашей компании" />
            </div>
            <div>
              <div class="flex items-center gap-1 mb-15px">
                <p class="text-sm font-medium text-space leading-150">Веб-сайт</p>
                <span class="inline-flex items-center cursor-help">
                  <svg-icon name="question" width="16" height="16" />
                  <MyTooltip text="Укажите адрес сайта компании" />
                </span>
              </div>
              <MyInput v-model="site" type="text" placeholder="https://" />
            </div>
          </div>
        </div>

        <div class="mb-25px">
          <p class="text-sm font-medium text-space leading-150 mb-15px">Описание компании</p>
          <div class="company-description-editor">
            <TiptapEditor v-model="companyDescription" />
          </div>
        </div>

        <UiButton
          variant="action"
          size="semiaction"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? 'Сохранение...' : 'Сохранить изменения' }}
        </UiButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
  .default-template {
  background-color: transparent;
  padding: 0;
}

.company-description-editor :deep(.min-h-\[460px\]) {
  min-height: 200px;
}

/* Круглый логотип 130×130px */
.logo-circle {
  border-radius: 50%;
}
.logo-circle label,
.logo-circle img,
.logo-circle span {
  border-radius: 50%;
  }
</style>
