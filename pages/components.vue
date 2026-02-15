<script setup lang="ts">
import MyInput from '~/components/custom/MyInput.vue'
import SimpleInput from '~/components/custom/SimpleInput.vue'
import PasswordInput from '~/components/custom/PasswordInput.vue'
import PhoneInput from '~/components/custom/PhoneInput.vue'
import EmailInput from '~/components/custom/EmailInput.vue'
import MyTextarea from '~/components/custom/MyTextarea.vue'
import MyCheckbox from '~/components/custom/MyCheckbox.vue'
import MyDropdown from '~/components/custom/MyDropdown.vue'
import MultiSelect from '~/components/custom/MultiSelect.vue'
import UiDotsLoader from '~/components/custom/UiDotsLoader.vue'
import UiCircleLoader from '~/components/custom/UiCircleLoader.vue'
import Popup from '~/components/custom/Popup.vue'
import UiDialog from '~/components/ui/dialog/Dialog.vue'
import UiDialogTrigger from '~/components/ui/dialog/DialogTrigger.vue'
import UiDialogContent from '~/components/ui/dialog/DialogContent.vue'
import UiDialogHeader from '~/components/ui/dialog/DialogHeader.vue'
import UiDialogTitle from '~/components/ui/dialog/DialogTitle.vue'
import UiDialogDescription from '~/components/ui/dialog/DialogDescription.vue'
import BtnIcon from '~/components/custom/BtnIcon.vue'
import BtnIconText from '~/components/custom/BtnIconText.vue'
import BtnTab from '~/components/custom/BtnTab.vue'
import BtnCalendar from '~/components/custom/BtnCalendar.vue'
import BtnEmail from '~/components/custom/BtnEmail.vue'
import BtnStop from '~/components/custom/BtnStop.vue'
import Pagination from '~/components/custom/Pagination.vue'

definePageMeta({
  layout: 'default',
})

useHead({ title: 'Каталог компонентов' })

const inputValue = ref('')
const textareaValue = ref('')
const passwordValue = ref('')
const phoneValue = ref('')
const dropdownValue = ref<string | null>(null)
const multiSelectValue = ref<string[]>([])
const checkbox1 = ref(false)
const checkbox2 = ref(true)
const popupOpen = ref(false)
const dialogOpen = ref(false)
const currentPage = ref(1)
const selectedTab = ref('tab1')

const dropdownOptions = [
  { name: 'Вариант 1', value: 'v1' },
  { name: 'Вариант 2', value: 'v2' },
  { name: 'Вариант 3', value: 'v3' },
]
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <h1 class="text-2xl font-bold text-space mb-2">
      Каталог компонентов
    </h1>
    <p class="text-slate-custom text-sm mb-10">
      Страница для просмотра кнопок, полей ввода и других UI-компонентов проекта.
    </p>

    <!-- Кнопки -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-space mb-4 pb-2 border-b border-athens">
        1. Кнопки (UI Button)
      </h2>
      <div class="flex flex-wrap gap-3">
        <UiButton variant="default">
          Default
        </UiButton>
        <UiButton variant="action" size="action">
          Action
        </UiButton>
        <UiButton variant="semiaction" size="semiaction">
          Semiaction
        </UiButton>
        <UiButton variant="outline">
          Outline
        </UiButton>
        <UiButton variant="secondary">
          Secondary
        </UiButton>
        <UiButton variant="destructive">
          Destructive
        </UiButton>
        <UiButton variant="ghost">
          Ghost
        </UiButton>
        <UiButton variant="link">
          Link
        </UiButton>
        <UiButton variant="black" size="black">
          Black
        </UiButton>
        <UiButton variant="success" size="success">
          Success
        </UiButton>
        <UiButton variant="back" size="back">
          Back
        </UiButton>
        <UiButton variant="delete" size="delete">
          Delete
        </UiButton>
        <UiButton variant="gray" size="gray">
          Gray
        </UiButton>
        <UiButton size="icon">
          <span class="text-lg">⊕</span>
        </UiButton>
      </div>
    </section>

    <!-- Поля ввода -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-space mb-4 pb-2 border-b border-athens">
        2. Поля ввода
      </h2>
      <div class="grid gap-6 max-w-md">
        <div class="min-w-0 w-full">
          <p class="text-sm text-bali mb-1">
            MyInput
          </p>
          <MyInput
            v-model="inputValue"
            placeholder="Введите текст"
          />
        </div>
        <div class="min-w-0 w-full">
          <p class="text-sm text-bali mb-1">
            SimpleInput
          </p>
          <SimpleInput
            v-model="inputValue"
            placeholder="Простое поле"
          />
        </div>
        <div class="min-w-0 w-full">
          <p class="text-sm text-bali mb-1">
            PasswordInput
          </p>
          <PasswordInput
            v-model="passwordValue"
            placeholder="Введите пароль"
          />
        </div>
        <div class="min-w-0 w-full">
          <p class="text-sm text-bali mb-1">
            PhoneInput
          </p>
          <PhoneInput v-model="phoneValue" />
        </div>
        <div class="min-w-0 w-full">
          <p class="text-sm text-bali mb-1">
            EmailInput
          </p>
          <EmailInput
            v-model="inputValue"
            placeholder="email@example.com"
          />
        </div>
      </div>
    </section>

    <!-- Текстовое поле -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-space mb-4 pb-2 border-b border-athens">
        3. Многострочное поле (MyTextarea)
      </h2>
      <div class="max-w-md">
        <MyTextarea
          v-model="textareaValue"
          placeholder="Введите описание..."
        />
      </div>
    </section>

    <!-- Чекбоксы -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-space mb-4 pb-2 border-b border-athens">
        4. Чекбоксы
      </h2>
      <div class="flex flex-wrap gap-6">
        <MyCheckbox
          :id="1"
          v-model="checkbox1"
          label="Не выбран"
        />
        <MyCheckbox
          :id="2"
          v-model="checkbox2"
          label="Выбран"
        />
        <MyCheckbox
          :id="3"
          v-model="checkbox1"
          label="С цветом dodger"
          label-color="dodger"
        />
      </div>
    </section>

    <!-- Выпадающий список -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-space mb-4 pb-2 border-b border-athens">
        5. Выпадающий список (MyDropdown)
      </h2>
      <div class="max-w-xs">
        <MyDropdown
          v-model="dropdownValue"
          :options="dropdownOptions"
          placeholder="Выберите вариант"
        />
      </div>
    </section>

    <!-- Множественный выбор -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-space mb-4 pb-2 border-b border-athens">
        6. Множественный выбор (MultiSelect)
      </h2>
      <div class="max-w-xs">
        <MultiSelect
          v-model="multiSelectValue"
          :options="dropdownOptions"
          default-value="Выберите значения"
        />
      </div>
      <p v-if="multiSelectValue.length" class="text-sm text-bali mt-2">
        Выбрано: {{ multiSelectValue.join(', ') }}
      </p>
    </section>

    <!-- Лейблы -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-space mb-4 pb-2 border-b border-athens">
        7. Лейбл (UI Label)
      </h2>
      <div class="max-w-md flex flex-col gap-2">
        <UiLabel>Подпись к полю</UiLabel>
        <UiLabel class="text-dodger">Лейбл синего цвета</UiLabel>
      </div>
    </section>

    <!-- Загрузчики -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-space mb-4 pb-2 border-b border-athens">
        8. Индикаторы загрузки
      </h2>
      <div class="flex flex-wrap items-end gap-10">
        <div>
          <p class="text-sm text-bali mb-2">
            UiDotsLoader
          </p>
          <UiDotsLoader />
        </div>
        <div>
          <p class="text-sm text-bali mb-2">
            UiCircleLoader
          </p>
          <div class="scale-50 origin-left">
            <UiCircleLoader />
          </div>
        </div>
      </div>
    </section>

    <!-- Попап (кастомный) -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-space mb-4 pb-2 border-b border-athens">
        9. Модальное окно (Popup)
      </h2>
      <UiButton variant="action" size="action" @click="popupOpen = true">
        Открыть попап
      </UiButton>
      <Popup
        :is-open="popupOpen"
        width="400px"
        :show-close-button="true"
        @close="popupOpen = false"
      >
        <div class="p-4">
          <h3 class="text-lg font-semibold text-space mb-2">
            Пример попапа
          </h3>
          <p class="text-sm text-slate-custom mb-4">
            Это кастомный компонент Popup. Закройте кнопкой или по клику вне окна.
          </p>
          <UiButton variant="outline" @click="popupOpen = false">
            Закрыть
          </UiButton>
        </div>
      </Popup>
    </section>

    <!-- Dialog (Radix/shadcn) -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-space mb-4 pb-2 border-b border-athens">
        10. Диалог (UI Dialog)
      </h2>
      <UiDialog v-model:open="dialogOpen">
        <UiDialogTrigger as-child>
          <UiButton variant="outline">
            Открыть диалог
          </UiButton>
        </UiDialogTrigger>
        <UiDialogContent class="sm:max-w-md">
          <UiDialogHeader>
            <UiDialogTitle>Заголовок диалога</UiDialogTitle>
            <UiDialogDescription>
              Диалог на базе Radix Vue (shadcn-nuxt). Используется для подтверждений и форм.
            </UiDialogDescription>
          </UiDialogHeader>
          <div class="py-4">
            <UiButton variant="action" size="action" @click="dialogOpen = false">
              Понятно
            </UiButton>
          </div>
        </UiDialogContent>
      </UiDialog>
    </section>

    <!-- Кнопки кастомные -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-space mb-4 pb-2 border-b border-athens">
        11. Кастомные кнопки (BtnIcon, BtnTab и др.)
      </h2>
      <div class="flex flex-wrap items-center gap-4">
        <BtnIcon
          icon="clip20"
          tooltip-text="Поиск"
        />
        <BtnIconText
          icon="plus-blue20"
          text="Добавить"
        />
        <BtnTab
          v-model="selectedTab"
          :tabs="[
            { label: 'Вкладка 1', value: 'tab1' },
            { label: 'Вкладка 2', value: 'tab2' },
          ]"
        />
        <BtnCalendar />
        <BtnEmail />
        <BtnStop />
      </div>
    </section>

    <!-- Пагинация -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-space mb-4 pb-2 border-b border-athens">
        12. Пагинация
      </h2>
      <Pagination
        :current-page="currentPage"
        :last-page="10"
        @page-changed="(page: number) => (currentPage = page)"
      />
    </section>

    <!-- Tooltip -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-space mb-4 pb-2 border-b border-athens">
        13. Подсказка (Tooltip)
      </h2>
      <UiTooltipProvider>
        <UiTooltip>
          <UiTooltipTrigger as-child>
            <UiButton variant="outline">
              Наведите на меня
            </UiButton>
          </UiTooltipTrigger>
          <UiTooltipContent>
            Текст подсказки
          </UiTooltipContent>
        </UiTooltip>
      </UiTooltipProvider>
    </section>

    <!-- Avatar -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-space mb-4 pb-2 border-b border-athens">
        14. Аватар
      </h2>
      <div class="flex items-center gap-4">
        <UiAvatar>
          <UiAvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
          <UiAvatarFallback>JD</UiAvatarFallback>
        </UiAvatar>
        <UiAvatar>
          <UiAvatarFallback>AB</UiAvatarFallback>
        </UiAvatar>
      </div>
    </section>

    <!-- Select (UI) -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-space mb-4 pb-2 border-b border-athens">
        15. Выбор (UI Select)
      </h2>
      <div class="max-w-xs">
        <UiSelect>
          <UiSelectTrigger class="w-full">
            <UiSelectValue placeholder="Выберите опцию" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem value="a">
              Опция A
            </UiSelectItem>
            <UiSelectItem value="b">
              Опция B
            </UiSelectItem>
            <UiSelectItem value="c">
              Опция C
            </UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>
    </section>

    <!-- Radio Group -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-space mb-4 pb-2 border-b border-athens">
        16. Радио-кнопки
      </h2>
      <UiRadioGroup default-value="one" class="flex gap-4">
        <div class="flex items-center gap-2">
          <UiRadioGroupItem id="r1" value="one" />
          <UiLabel for="r1">Первый</UiLabel>
        </div>
        <div class="flex items-center gap-2">
          <UiRadioGroupItem id="r2" value="two" />
          <UiLabel for="r2">Второй</UiLabel>
        </div>
        <div class="flex items-center gap-2">
          <UiRadioGroupItem id="r3" value="three" />
          <UiLabel for="r3">Третий</UiLabel>
        </div>
      </UiRadioGroup>
    </section>
  </div>
</template>
