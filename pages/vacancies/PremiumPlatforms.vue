<script setup>
  import DotsDropdonw from '~/components/custom/DotsDropdown.vue'
  import MultiDropdown from '~/components/custom/MultiDropdown.vue'
  import CardIcon from '~/components/custom/CardIcon.vue'
  import Popup from '~/components/custom/Popup.vue'
  import EmailDropdown from '~/components/custom/EmailDropdown.vue'
  import MyInput from '~/components/custom/MyInput.vue'
  import Autocomplete from '~/components/custom/Autocomplete.vue'
  import MyTooltip from '~/components/custom/MyTooltip.vue'
  import GenerateButton from '~/components/custom/GenerateButton.vue'
  import TiptapEditor from '~/components/TiptapEditor.vue'
  import CustomDropdown from '~/components/custom/CustomDropdown.vue'
  import MyDropdown from '~/components/custom/MyDropdown.vue'
  import TagSelect from '~/components/custom/TagSelect.vue'
  import MyAccordion from '~/components/custom/MyAccordion.vue'
  import CheckboxGroup from '~/components/custom/CheckboxGroup.vue'
  import SalaryRange from '~/components/custom/SalaryRange.vue'
  import { Label } from '@/components/ui/label'
  import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
  import CardOption from '@/components/custom/CardOption.vue'
  import GeoInput from '@/components/custom/GeoInput.vue'
  import ResponseInput from '@/components/custom/ResponseInput.vue'
  import PhoneInput from '~/components/custom/PhoneInput.vue'
  import EmailInput from '~/components/custom/EmailInput.vue'
  import MyCheckbox from '~/components/custom/MyCheckbox.vue'
  import FormAuthPlatform from '~/components/custom/page-parts/FormAuthPlatform.vue'
  import ConnectedPlatform from '~/components/custom/page-parts/ConnectedPlatform.vue'
  import CardPlatform from '@/components/custom/page-parts/CardPlatform.vue'
  import { getProfile as profileHh, auth as authHh, getAvailableTypes as typesHh } from '@/utils/hhAccount'
  import { capitalize } from '@/helpers/handlers'

  import { useCartStore } from '@/stores/cart'
  import { onMounted, ref, onBeforeUnmount } from 'vue'

  import { useRoute } from 'vue-router'

  import optionsData from '~/src/data/options-data.json'
  import cardsData from '~/src/data/cards-data.json'
  import ratesData from '~/src/data/rates-data.json'
  import majors from '~/src/data/majors.json'
  import industry from '~/src/data/industry.json'
  import specialization from '~/src/data/specialization.json'
  import schedule from '~/src/data/work-schedule.json'
  import experience from '~/src/data/experience.json'
  import education from '~/src/data/education.json'
  import AccordionAdditional from '~/src/data/accordion-additional.json'
  import CarId from '~/src/data/car-id.json'
  import MoreOptions from '~/src/data/more-options.json'
  import currency from '~/src/data/currency.json'
  import responses from '~/src/data/responses.json'

  import { inject } from 'vue';

  const ArrayMajors = majors
  const ArrayIndustry = industry
  const ArraySpecialization = specialization
  const ArraySchedule = schedule
  const ArrayExperience = experience
  const ArrayEducation = education
  const ArrayAdditional = AccordionAdditional
  const ArrayCarId = CarId
  const ArrayOptions = MoreOptions
  const ArrayCurrency = currency
  const cartStore = useCartStore()
  // const platforms = ref(PLATFORMS_DEFAULT)
  
  const platforms = ref(inject('platformsGlobal'))

  const activePlatform = ref(platforms.value.findIndex(platform => platform.platform === useRoute().query.platform) || 0)
  const btnAuthDisabled = ref(false)

  onMounted(async () => {
    await Promise.all([
      cartStore.setCardsData(cardsData),
      cartStore.setRatesData(ratesData),
    ])
  })
  function getCardName(id) {
    const card = this.cartStore.cardsData.find(card => card.id === id)
    return card?.name || 'Неизвестный товар'
  }

  function getRateName(id, rateId) {
    const card = cartStore.cardsData.find(card => card.id === id)
    if (!card) return '' // Возвращаем пустую строку, если карточка не найдена

    const rate = ratesData.find(rate => rate.id === rateId)
    if (!rate) return '' // Возвращаем пустую строку, если тариф не найден

    return rate.name || '' // Если у тарифа нет названия, возвращаем пустую строку
  }

  function getRatePrice(id, rateId) {
    const card = cartStore.cardsData.find(card => card.id === id)
    if (!card) return 0 // Возвращаем 0, если карточка не найдена

    const rate = ratesData.find(rate => rate.id === rateId)
    if (!rate) return 0 // Возвращаем 0, если тариф не найден

    return rate.price || 0 // Если у тарифа нет цены, возвращаем 0
  }

  function handleAddToCart(cardId, selectedRate) {
    if (!selectedRate) {
      alert('Пожалуйста, выберите тарифный план.')
      return
    }
    this.cartStore.addItem(cardId, selectedRate.id)
  }

  const getCardProperty = (id, key) => {
    const card = cartStore.cardsData.find(card => card.id === id)
    return card ? card[key] : null // Если карта найдена, вернуть значение ключа
  }

  const dropItems = ['Импорт публикаций', 'Отвязать профиль']

  const isPopupOpen = ref(false) // control visibility popup

  const addProfilePopup = ref(false)

  const importPopup = ref(false)

  const isAuthOpen = useRoute().query?.popup_account === 'true'
  const addAuthPopup = ref(false)
  const errorAuthPlatform = ref(null)
  const authDataPlatform = ref({}) 

  const handleSelectItem = item => {
    if (item === 'Импорт публикаций') {
      importPopup.value = true
      disableBodyScroll()
    }
  }

  function closeImportPopup() {
    importPopup.value = false
    enableBodyScroll()
  }

  function openPopup(content) {
    isPopupOpen.value = true
    disableBodyScroll()
  }

  function closePopup() {
    isPopupOpen.value = false
    enableBodyScroll()
  }

  const handleCheck = id => {
    selectedCard.value = id
  }

  onMounted(() => {
    selectedCard.value = 'office'
  })

  const handleHover = id => {
    hoveredCard.value = id
  }

  const clearHover = () => {
    hoveredCard.value = null
  }

  // Функции для управления прокруткой
  function disableBodyScroll() {
    document.body.style.overflow = 'hidden' // Отключаем прокрутку
  }

  function enableBodyScroll() {
    document.body.style.overflow = '' // Восстанавливаем прокрутку
  }

  // Убедимся, что при размонтировании компонента скролл включится
  onBeforeUnmount(() => {
    enableBodyScroll()
  })

  function addProfile() {
    // platforms[index].isAuthenticated = true
    addProfilePopup.value = true
    disableBodyScroll()
  }

  function closeAddProfilePopup() {
    addProfilePopup.value = false
    enableBodyScroll()
  }

  function openPopupAuth(index) {
    activePlatform.value = index
    addProfilePopup.value = false
    addAuthPopup.value = true
  }

  function closeAddAuthPopup() {
    addAuthPopup.value = false
    enableBodyScroll()
  }

  async function authPlatform(platform) {
    errorAuthPlatform.value = null
    // btnAuthDisabled.value = true
    // errorAuthPlatform.value = null
    // if (!authDataPlatform.value.idClient || !authDataPlatform.value.idSecret) {
    //     errorAuthPlatform.value = 'Пожалуйста, введите данные авторизации';
    //     return;
    // }
    
    // Сохраняем текущий URL для возврата после авторизации
    const currentRoute = useRoute();
    const returnUrl = currentRoute.fullPath; // Сохраняем полный путь с query параметрами
    setCookie('auth_return_url', returnUrl, 1);
    
    if (platform == 'hh') {
      const config = useRuntimeConfig();
      const tokenCookie = useCookie('auth_user');
      setCookie('process_auth', 'true', 1);
      window.location.href = config.public.apiBase
        + `/code-hh?customerToken=${tokenCookie.value}`
    } else {
      errorAuthPlatform.value = `Платформа ${capitalize(platform)} пока неподдерживается :(`
    }
  }

  function updateAuthDataPlatform(data) {
    authDataPlatform.value = data
  }

  function publishVacancy() {
    alert('Вакансия опубликована!')
  }

  const emailOptions = [
    {
      email: 'evseev@gmail.com',
      name: 'rabota.ru',
      icon: new URL('@/assets/img/rabota-ru.svg', import.meta.url).href,
    },
    {
      email: 'Jobly',
      name: 'zarplata.ru',
      icon: new URL('@/assets/img/zarplata.svg', import.meta.url).href,
    },
    {
      email: 'alex2000@gmail.com',
      name: 'hh.ru',
      icon: new URL('@/assets/img/hh.svg', import.meta.url).href,
    },
    {
      email: 'evseev@gmail.com',
      name: 'superjob.ru',
      icon: new URL('@/assets/img/superjob.svg', import.meta.url).href,
    },
    {
      email: 'alex2000@gmail.com',
      name: 'youla.ru',
      icon: new URL('@/assets/img/youla.svg', import.meta.url).href,
    },
    {
      email: 'overmnogosimvolov@gmail.com',
      name: 'avito.ru',
      icon: new URL('@/assets/img/avito.svg', import.meta.url).href,
    },
  ]

  const options = ref([
    {
      name: 'Полная',
      value: 1,
    },
    {
      name: 'Частичная',
      value: 2,
    },
    {
      name: 'Временная',
      value: 3,
    },
    {
      name: 'Стажировка',
      value: 4,
    },
  ])

  const cards = [
    {
      id: 'office',
      title: 'Офис',
      description: 'Сотрудники<br>работают в офисе',
    },
    {
      id: 'hybrid',
      title: 'Гибрид',
      description: 'Сотрудники работают как офисе,<br>так и дома',
    },
    {
      id: 'outsource',
      title: 'Удаленно',
      description: 'Сотрудники<br>работают из дома',
    },
  ]

  const selectedEmail = ref(null)
  const importEmail = ref(null)
  const countDays = ref(30)
  const newVacancy = ref('Менеджер по продажам')
  const selectedIndustry = ref(null)
  const selectedSpecialization = ref(null)
  const parentSelectedOption = ref(null)
  const selectedAdditional = ref([])
  const selectedCarId = ref([])
  const selectedOptions = ref([])
  const selectedCard = ref(null)
  const hoveredCard = ref(null)
  const email = ref('')
  const showContacts = ref(true)
  const phone = ref('')
  const responsePersone = ref('')
  function goBack() {
    window.history.back()
}

function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

onBeforeMount(async () => {
    // запрашиваем, есть ли авторизация на hh.ru
    if (!inject('isPlatforms')) {
      const { data, error } = await profileHh()
      if (!error) {
        platforms.value[0].isAuthenticated = true
        platforms.value[0].data = {
          email: data.data.email,
          employer_id: data.data.employer_id,
          manager_id: data.data.manager_id
        }
      }
      const { types, errorTypesHh } = await typesHh(data.data.employer.id, data.data.manager.id)
      if (!error && !errorTypesHh) {
        platforms.value[0].types = types
        console.log('platrofms with types', types);
      } else {
        console.log('errorTypesHh', errorTypesHh);
      }
    }
    
    addAuthPopup.value = isAuthOpen ? true : false
})

onMounted(async () => {
    const query = useRoute().query
    const returnUrlCookie = useCookie('auth_return_url')
    let shouldRedirect = false
    let redirectUrl = null
    
    if (query.popup_account === 'true' && query.platform == 'hh' && query.message === 'success') {
        const hhId = useCookie('process_auth')
        if (hhId != undefined && hhId.value) {
            const response = await authHh()
            if (!error) {
                platforms[0].isAuthenticated = true
                platforms[0].data = response.data
                shouldRedirect = true
            } else {
                errorAuthPlatform.value = error
            }
        }
    }
    
    // Редирект на исходную страницу, если была сохранена
    if (shouldRedirect && returnUrlCookie.value) {
        redirectUrl = returnUrlCookie.value
        // Очищаем cookie
        returnUrlCookie.value = null
        // Удаляем cookie через setCookie с прошедшей датой
        setCookie('auth_return_url', '', -1)
        // Редирект на исходную страницу
        await navigateTo(redirectUrl)
    }
})
</script>

<template>
  <div class="container pb-72 pt-[34px]">
  <div>
    <!-- Кнопка "Назад" из слота -->
      <UiButton variant="black" size="black" @click="goBack" class="mb-35px">
        Назад
      </UiButton>
    <!-- Контент страницы -->
    <p class="text-xl font-semibold text-space mb-5px">Подключенные профили</p>
    <p class="text-sm font-normal text-slate-custom mb-27px leading-normal">
      Авторизуйте ваши аккаунты на&nbsp;работных сайтах один раз
      и&nbsp;управляйте вакансиями удаленно
    </p>
    <!-- Первый блок -->
    <div
      class="grid grid-cols-3 gap-15px mb-35px max-w-[875px]"
    >
      <div v-for="(item, index) in platforms.filter((el) => el.isAuthenticated)" class="p-25px bg-white rounded-fifteen flex flex-col">
        <CardPlatform :platform="item" :index="index" />
      </div>
      <!-- Первая карточка -->
      <div class="p-25px bg-white rounded-fifteen flex flex-col min-h-[404px]"  style="display: none">
        <div class="flex justify-between mb-3.5">
          <div class="flex items-center gap-2.5">
            <svg-icon name="hh" width="41" height="40" />
            <p class="text-sm font-medium text-slate-custom">hh.ru</p>
          </div>
          <DotsDropdonw :items="dropItems" @select-item="handleSelectItem" />
        </div>
        <div class="w-full h-[1px] bg-athens mb-3.5"></div>
        <p class="text-sm font-medium text-space mb-3.5">Аккаунт:</p>
        <div
          class="flex items-center gap-2.5 bg-feta py-11px px-15px rounded-ten mb-15px min-w-0"
        >
          <div>
            <svg-icon name="green-circle" width="11" height="11" />
          </div>
          <p class="truncate text-sm font-medium text-space leading-normal">
            evseev15232392@gmai.com
          </p>
        </div>
        <p class="text-sm font-medium text-space mb-3.5">Баланс публикаций:</p>
        <div class="rounded-ten bg-athens-gray p-15px">
          <p class="text-13px text-slate-custom font-normal leading-130">
            Нет доступных к&nbsp;размещению публикаций. Пополните баланс
            на&nbsp;сайте чтобы опубликовать ваше объявление
          </p>
        </div>
        <UiButton variant="black" size="black" class="mt-auto">
          Пополнить баланс
        </UiButton>
      </div>
      <!-- Вторая карточка -->
      <div class="p-25px bg-white rounded-fifteen flex flex-col min-h-[404px]"  style="display: none">
        <div class="flex justify-between mb-3.5">
          <div class="flex items-center gap-2.5">
            <svg-icon name="zarplata" width="41" height="40" />
            <p class="text-sm font-medium text-slate-custom">zarplata.ru</p>
          </div>
          <DotsDropdonw :items="dropItems" @select-item="handleSelectItem" />
        </div>
        <div class="w-full h-[1px] bg-athens mb-3.5"></div>
        <p class="text-sm font-medium text-space mb-3.5">Аккаунт:</p>
        <div
          class="w-full flex items-center gap-2.5 bg-feta py-11px px-15px rounded-ten mb-15px"
        >
          <div>
            <svg-icon name="green-circle" width="11" height="11" />
          </div>
          <p class="truncate text-sm font-medium text-space leading-normal">
            evseev15232392@gmai.com
          </p>
        </div>
        <p class="text-sm font-medium text-space mb-3.5">Баланс публикаций:</p>
        <MultiDropdown :options="optionsData" :selected="optionsData[0]" />
        <UiButton
          variant="action"
          size="action"
          class="mt-auto"
          @click="openPopup"
        >
          Опубликовать
        </UiButton>
      </div>
      <!-- Шаблон для добавления новой -->
      <div
        class="p-25px bg-white rounded-fifteen flex flex-col min-h-[404px] items-center justify-center cursor-pointer text-slate-custom hover:bg-dodger hover:text-dodger group transition-colors"
        @click="addProfile"
      >
        <div
          class="w-[71px] h-[71px] rounded-full bg-white flex items-center justify-center mb-25px"
        >
          <svg-icon name="template-plus" width="31" height="31" />
        </div>
        <p class="text-sm font-medium group-hover:text-white">
          Добавить профиль
        </p>
      </div>
    </div>
    <!-- Второй блок -->
    <p class="text-xl font-semibold text-space mb-5px">Доступные публикации</p>
    <p class="text-sm font-normal text-slate-custom mb-27px leading-normal">
      Авторизуйте ваши аккаунты на&nbsp;работных сайтах один раз
      и&nbsp;управляйте вакансиями удаленно
    </p>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(234px,1fr))] gap-15px mb-35px max-w-[875px]"
    >
      <!-- Первая карточка -->
      <div class="p-25px bg-white rounded-fifteen flex flex-col">
        <div class="flex justify-between mb-3.5">
          <div class="flex items-center gap-2.5">
            <svg-icon name="hh" width="41" height="40" />
            <p class="text-sm font-medium text-slate-custom">hh.ru</p>
          </div>
          <DotsDropdonw :items="dropItems" />
        </div>
        <div class="w-full h-[1px] bg-athens mb-3.5"></div>
        <p class="text-sm font-medium text-space mb-3.5">Аккаунт:</p>
        <div
          class="w-full flex items-center gap-2.5 bg-zumthor py-11px px-15px rounded-ten mb-15px"
        >
          <div>
            <svg-icon name="dodger-circle" width="11" height="11" />
          </div>
          <p class="truncate text-sm font-medium text-space leading-normal">
            Jobly
          </p>
        </div>
        <p class="text-sm font-medium text-space mb-3.5">Баланс публикаций:</p>
        <MultiDropdown
          :options="optionsData"
          :selected="optionsData[1]"
          class="mb-15px"
        />
        <p class="text-sm font-medium text-space mb-2.5">Статус:</p>
        <div class="p-15px rounded-ten bg-serenade">
          <p class="text-sm font-medium text-space leading-normal">
            Услуга ожидает оплаты по&nbsp;счету:
            <a href="#" class="text-orange underline">N2939238</a>
          </p>
        </div>
      </div>
      <!-- Вторая карточка -->
      <div class="p-25px bg-white rounded-fifteen flex flex-col">
        <div class="flex justify-between mb-3.5">
          <div class="flex items-center gap-2.5">
            <svg-icon name="superjob" width="41" height="40" />
            <p class="text-sm font-medium text-slate-custom">superjob.ru</p>
          </div>
          <DotsDropdonw :items="dropItems" />
        </div>
        <div class="w-full h-[1px] bg-athens mb-3.5"></div>
        <p class="text-sm font-medium text-space mb-3.5">Аккаунт:</p>
        <div
          class="w-full flex items-center gap-2.5 bg-zumthor py-11px px-15px rounded-ten mb-15px"
        >
          <div>
            <svg-icon name="dodger-circle" width="11" height="11" />
          </div>
          <p class="truncate text-sm font-medium text-space leading-normal">
            Jobly
          </p>
        </div>
        <p class="text-sm font-medium text-space mb-3.5">Баланс публикаций:</p>
        <MultiDropdown
          :options="optionsData"
          :selected="optionsData[0]"
          class="mb-15px"
        />
        <UiButton
          variant="action"
          size="action"
          class="mt-auto"
          @click="openPopup"
        >
          Опубликовать
        </UiButton>
      </div>
      <!-- Третья карточка -->
      <div class="p-25px bg-white rounded-fifteen flex flex-col">
        <div class="flex justify-between mb-3.5">
          <div class="flex items-center gap-2.5">
            <div class="youla-pic bg-img"></div>
            <p class="text-sm font-medium text-slate-custom">youla.ru</p>
          </div>
          <DotsDropdonw :items="dropItems" />
        </div>
        <div class="w-full h-[1px] bg-athens mb-3.5"></div>
        <p class="text-sm font-medium text-space mb-3.5">Аккаунт:</p>
        <div
          class="w-full flex items-center gap-2.5 bg-zumthor py-11px px-15px rounded-ten mb-15px"
        >
          <div>
            <svg-icon name="dodger-circle" width="11" height="11" />
          </div>
          <p class="truncate text-sm font-medium text-space leading-normal">
            Jobly
          </p>
        </div>
        <p class="text-sm font-medium text-space mb-3.5">Баланс публикаций:</p>
        <MultiDropdown
          :options="optionsData"
          :selected="optionsData[0]"
          class="mb-15px"
          variant="default"
        />
        <UiButton
          variant="action"
          size="action"
          class="mt-auto"
          @click="openPopup"
        >
          Опубликовать
        </UiButton>
      </div>
    </div>
    <!-- Третий блок(магазин) -->
    <p class="text-xl font-semibold text-space mb-5px">Магазин Jobly</p>
    <p class="text-sm font-normal text-slate-custom mb-27px leading-normal">
      Вакансия будет опубликована с&nbsp;аккаунта Jobly, все остальное остается
      прежним
    </p>
    <div class="w-full gap-x-25px flex">
      <div
        class="grid grid-cols-[repeat(auto-fit,minmax(234px,1fr))] gap-15px mb-35px max-w-[875px] w-full"
      >
        <!-- Динамический рендеринг карточек -->
        <div
          v-for="card in cartStore.cardsData"
          :key="card.id"
          class="p-25px bg-white rounded-fifteen flex flex-col min-w-56 min-h-[248px]"
        >
          <div class="flex items-center gap-2.5 mb-3.5">
            <CardIcon
              :icon="card.icon"
              :isPng="card.isPng"
              :imagePath="card.imagePath"
            />
            <p class="text-sm font-medium text-slate-custom">{{ card.name }}</p>
          </div>
          <div class="w-full h-[1px] bg-athens mb-3.5"></div>
          <p class="text-sm font-medium text-space mb-3.5">Тарифный план:</p>
          <MultiDropdown
            :options="ratesData"
            class="mb-auto"
            variant="selected"
            v-model="card.selectedRate"
            placeholder="Выберите тариф"
          />
          <UiButton
            :variant="cartStore.isInCart(card.id) ? 'success' : 'action'"
            size="action"
            @click="handleAddToCart(card.id, card.selectedRate)"
          >
            {{ cartStore.isInCart(card.id) ? 'В корзине' : 'В корзину' }}
            <svg-icon
              v-if="cartStore.isInCart(card.id)"
              name="check-success"
              width="16"
              height="16"
            />
          </UiButton>
        </div>
      </div>
      <div class="max-w-[275px] w-full">
        <div
          v-if="Object.keys(cartStore.cartItems).length > 0"
          class="flex flex-col p-25px bg-white rounded-fifteen"
        >
          <p class="text-xl font-semibold text-gray-900 mb-25px">
            Ваша корзина
          </p>
          <div class="w-full h-[1px] bg-athens"></div>
          <div
            v-for="(item, id) in cartStore.cartItems"
            :key="id"
            class="flex justify-between flex-col border-b py-25px"
          >
            <div class="flex gap-x-15px mb-25px">
              <CardIcon
                :icon="getCardProperty(id, 'icon')"
                :isPng="getCardProperty(id, 'isPng')"
                :imagePath="getCardProperty(id, 'imagePath')"
              />
              <div class="flex flex-col gap-y-5px">
                <p class="text-15px font-medium">{{ getCardName(id) }}</p>
                <p class="text-sm font-normal text-slate-custom">
                  {{ getRateName(id, item.rateId) }}
                </p>
                <p class="text-15px font-medium">
                  {{ getRatePrice(id, item.rateId) * item.count }} руб.
                </p>
              </div>
            </div>
            <div class="flex gap-15px">
              <div class="flex items-center gap-x-5px w-full">
                <button
                  @click="cartStore.removeItem(id)"
                  :disabled="cartStore.isRemoveDisabled(id)"
                  :class="{
                    'opacity-50 cursor-not-allowed':
                      cartStore.isRemoveDisabled(id),
                    'hover:text-dodger hover:border-zumthor hover:bg-zumthor active:text-white active:bg-dodger active:border-dodger':
                      !cartStore.isRemoveDisabled(id),
                  }"
                  class="w-10 h-10 bg-athens-gray border border-athens rounded-ten flex items-center justify-center text-slate-custom transition-all shrink-0"
                >
                  <svg-icon name="basket-minus" width="20" height="20" />
                </button>
                <p
                  class="text-sm font-semibold w-full h-10 bg-athens-gray border border-athens rounded-ten flex items-center justify-center text-space"
                >
                  {{ item.count }}
                </p>
                <button
                  @click="cartStore.addItem(id, item.rateId)"
                  class="w-10 h-10 bg-athens-gray border border-athens rounded-ten flex items-center justify-center text-slate-custom hover:text-dodger hover:border-zumthor hover:bg-zumthor active:text-white active:bg-dodger active:border-dodger transition-all shrink-0"
                >
                  <svg-icon name="basket-plus" width="20" height="20" />
                </button>
              </div>
              <button
                @click="cartStore.deleteItem(id)"
                class="w-10 h-10 bg-athens-gray border border-athens rounded-ten flex items-center justify-center text-slate-custom hover:text-red hover:border-cinderella hover:bg-pink active:text-white active:bg-red active:border-red transition-all ml-auto shrink-0"
              >
                <svg-icon name="basket-basket" width="20" height="20" />
              </button>
            </div>
          </div>
          <div class="mt-4">
            <div class="flex justify-between">
              <p class="text-sm font-normal text-slate-custom">Позиций</p>
              <p class="text-15px font-semibold text-space">
                {{ cartStore.totalItems }}
              </p>
            </div>
            <div class="flex justify-between mb-35px">
              <p class="text-sm font-normal text-slate-custom">Итого</p>
              <p class="text-15px font-semibold text-space">
                {{ cartStore.totalSum }} ₽
              </p>
            </div>
            <UiButton variant="action" size="action" class="w-full">
              Перейти к оформлению
            </UiButton>
          </div>
        </div>
        <div v-else class="p-25px bg-white rounded-fifteen">
          <p class="text-xl font-medium text-space mb-15px">Ваша корзина</p>
          <p class="text-sm font-normal text-slate-custom">
            Пока что здесь пусто
          </p>
        </div>
      </div>
    </div>
    <transition name="fade" @after-leave="enableBodyScroll">
      <Popup
        :isOpen="isPopupOpen"
        @close="closePopup"
        :showCloseButton="false"
        :width="'620px'"
        :height="'80vh'"
      >
        <!-- Добавляй любые компоненты и разметку -->
        <div>
          <p class="text-xl text-space font-semibold leading-130 mb-25px">
            Новая публикация
          </p>
          <div class="w-full h-[1px] bg-athens mb-25px"></div>
          <p class="text-sm font-medium text-space mb-15px">
            Доступные источники:
          </p>
          <EmailDropdown
            :options="emailOptions"
            v-model="selectedEmail"
            placeholder="Выберите аккаунт"
            class="mb-25px"
          />
          <div class="flex gap-x-25px mb-25px">
            <div class="w-full">
              <p class="text-sm font-medium text-space mb-15px">
                Баланс публикаций:
              </p>
              <MultiDropdown
                :options="optionsData"
                :selected="optionsData[0]"
              />
            </div>
            <div class="max-w-[100px]">
              <p class="text-sm font-medium text-space mb-15px">Дней всего</p>
              <MyInput type="number" v-model="countDays" />
            </div>
          </div>
          <div class="w-full h-[1px] bg-athens mb-25px"></div>
          <div class="w-full justify-between flex gap-25px mb-6">
            <div class="w-full">
              <p class="text-sm font-medium mb-4 leading-normal text-space">
                <span class="text-red">*</span>
                Название должности
              </p>
              <Autocomplete
                :source="ArrayMajors"
                v-model="newVacancy"
                placeholder="Например, Менеджер по продажам"
                class="mb-11px"
              />
              <p class="text-xs text-bali">
                Осталось 80 символов. Специальных символов нет.
              </p>
            </div>
            <div class="w-full max-w-[165px]">
              <div class="flex">
                <p
                  class="text-sm font-medium mb-4 leading-normal text-space mr-[3px]"
                >
                  Код вакансии
                </p>
                <span>
                  <svg-icon name="question" width="20" height="20" />
                  <MyTooltip
                    text="Каждая вакансия получает свой уникальный код, что позволяет точно идентифицировать её в системе и избежать путаницы, особенно при работе с большим количеством вакансий."
                  />
                </span>
              </div>
              <div class="max-w-400px">
                <MyInput :placeholder="'Код вакансии'" type="number" />
              </div>
            </div>
          </div>
          <div class="w-full">
            <div class="w-full">
              <p class="text-sm font-medium text-space mb-15px">
                <span class="text-red">*</span>
                Описание вакансии
              </p>
              <generate-button />
            </div>
          </div>
          <div class="mt-15px mb-3.5">
            <client-only>
              <TiptapEditor></TiptapEditor>
            </client-only>
          </div>
          <p class="text-xs text-bali font-normal mb-25px">
            Максимум 700 символов. Использовано 0 символов.
          </p>
          <div class="flex justify-between gap-25px">
            <div class="w-full">
              <p class="text-sm font-medium text-space mb-3.5">
                Отрасль компании
              </p>
              <div class="w-full relative">
                <CustomDropdown
                  :options="ArrayIndustry"
                  placeholder="Выберите отрасль"
                  v-model="selectedIndustry"
                />
              </div>
            </div>
            <div class="w-full">
              <p class="text-sm font-medium text-space mb-3.5">
                Выберите специализацию
              </p>
              <div>
                <CustomDropdown
                  :options="ArraySpecialization"
                  placeholder="Выберите специализацию"
                  v-model="selectedSpecialization"
                />
              </div>
            </div>
          </div>
          <div class="flex justify-between gap-25px mb-3.5">
            <div class="w-full">
              <p class="text-sm font-medium text-space mb-3.5">Тип занятости</p>
              <my-dropdown
                :defaultValue="'Тип занятости'"
                :options="options"
                v-model="parentSelectedOption"
              />
            </div>
            <div class="w-full">
              <p class="text-sm font-medium text-space mb-3.5">График работы</p>
              <my-dropdown
                :defaultValue="'График работы'"
                :options="ArraySchedule"
              />
            </div>
          </div>
          <div class="flex justify-between gap-25px mb-3.5">
            <div class="w-full">
              <p class="text-sm font-medium text-space mb-3.5">Опыт работы</p>
              <my-dropdown
                :defaultValue="'Опыт работы'"
                :options="ArrayExperience"
              />
            </div>
            <div class="w-full">
              <p class="text-sm font-medium text-space mb-3.5">Образование</p>
              <my-dropdown
                :defaultValue="'Образование'"
                :options="ArrayEducation"
              />
            </div>
          </div>
          <div class="w-full mb-9 max-w-input">
            <p class="text-sm font-medium text-space mb-13px">Ключевые фразы</p>
            <tag-select />
          </div>
          <div class="w-fit mb-25px">
            <MyAccordion title="дополнительные условия" class="mb-15px">
              <div
                class="flex flex-col flex-wrap max-h-40 gap-x-25px gap-y-15px"
              >
                <CheckboxGroup
                  v-model="selectedAdditional"
                  :options="ArrayAdditional"
                />
              </div>
            </MyAccordion>
            <MyAccordion title="водительские права" class="mb-15px">
              <div
                class="flex flex-col flex-wrap max-h-[195px] gap-x-25px gap-y-15px"
              >
                <CheckboxGroup v-model="selectedCarId" :options="ArrayCarId" />
              </div>
            </MyAccordion>
            <MyAccordion title="дополнительные пожелания">
              <div
                class="flex flex-col flex-wrap max-h-[195px] gap-x-25px gap-y-15px"
              >
                <CheckboxGroup
                  v-model="selectedOptions"
                  :options="ArrayOptions"
                />
              </div>
            </MyAccordion>
          </div>
          <div class="flex justify-between gap-25px mb-25px">
            <div class="w-full">
              <p class="text-sm font-medium text-space mb-3.5">
                Заработная плата / мес
              </p>
              <SalaryRange class="mb-4" />
              <div>
                <RadioGroup default-value="past-cash" class="flex gap-x-[18px]">
                  <div class="my-checkbox">
                    <Label
                      for="past-cash"
                      class="cursor-pointer flex items-center"
                    >
                      <RadioGroupItem
                        id="past-cash"
                        value="past-cash"
                        class="mr-5px"
                      />
                      <p class="text-sm font-normal text-space">На руки</p>
                    </Label>
                  </div>
                  <div class="my-checkbox">
                    <Label
                      for="full-cash"
                      class="cursor-pointer flex items-center"
                    >
                      <RadioGroupItem
                        id="full-cash"
                        value="full-cash"
                        class="mr-5px"
                      />
                      <p class="text-sm font-normal text-space">
                        До вычета налогов
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <div class="w-full max-w-[215px]">
              <p class="text-sm font-medium text-space mb-3.5">Валюта</p>
              <my-dropdown
                :defaultValue="'Валюта'"
                :options="ArrayCurrency"
                :selected="0"
              />
            </div>
          </div>
          <div class="mb-25px">
            <p class="text-sm font-medium text-space mb-3.5">Место работы</p>
            <div class="mb-[23px]">
              <RadioGroup
                default-value="office"
                class="flex gap-x-15px w-full flex-wrap"
              >
                <CardOption
                  v-for="card in cards"
                  :key="card.id"
                  :id="card.id"
                  :title="card.title"
                  :description="card.description"
                  :selectedCard="selectedCard"
                  :hoveredCard="hoveredCard"
                  @update:selected="handleCheck"
                  @hover="handleHover"
                  @leave="clearHover"
                />
              </RadioGroup>
            </div>
            <p class="text-sm font-medium text-space mb-15px">Локация офиса</p>
            <geo-input class="mb-2.5" />
            <p class="leading-normal text-xs text-bali font-normal">
              Укажите расположение офиса для нового сотрудника.
            </p>
          </div>
          <div class="flex gap-x-25px">
            <div class="w-full">
              <p class="text-sm font-medium text-space mb-15px">
                Контактное лицо
              </p>
              <response-input
                class="mb-6 w-full max-w-input"
                :responses="responses"
                v-model="responsePersone"
              />
            </div>
            <div class="w-full">
              <p class="text-sm font-medium text-space mb-15px">
                Номер телефона
              </p>
              <phone-input v-model="phone" class="mb-25px" />
            </div>
          </div>
          <div class="w-full mb-25px">
            <p class="text-sm font-medium text-space leading-normal mb-4">
              Email
            </p>
            <email-input v-model="email" />
          </div>
          <MyCheckbox
            id="show-contacts"
            label="Отображать контакты в вакансии"
            v-model="showContacts"
          />
          <div class="mt-9 flex justify-between">
            <UiButton variant="action" size="action" @click="publishVacancy">
              Опубликовать
            </UiButton>
            <UiButton variant="back" size="back" @click="closePopup">
              Отмена
            </UiButton>
          </div>
        </div>
      </Popup>
    </transition>
    <transition name="fade" @after-leave="enableBodyScroll">
      <Popup
        :isOpen="addProfilePopup"
        @close="closeAddProfilePopup"
        :showCloseButton="false"
        :width="'361px'"
        :height="'fit-content'"
      >
        <p class="text-xl font-semibold text-space mb-2.5">
          Подключить свой аккаунт
        </p>
        <p class="text-sm font-normal text-slate-custom mb-25px">
          Укажите данные авторизации вашего профиля
        </p>
        <div class="w-full mb-25px h-[1px] bg-athens"></div>
        <div class="flex gap-[15px] flex-wrap">
            <button 
               v-for="(item, index)  in platforms" 
               :key="index" 
               @click="openPopupAuth(index)"
            >
              <svg-icon v-if="item.svg !== 'popup-youla'"  :name="item.svg" width="50" height="50" />
              <div v-else :class="item.svg" @click="openPopupAuth(index)"></div>
            </button>
        </div>
      </Popup>
    </transition>
    <transition name="fade" @after-leave="enableBodyScroll">
      <Popup
        :isOpen="importPopup"
        @close="closeImportPopup"
        :showCloseButton="false"
        :width="'434px'"
        :height="'fit-content'"
      >
        <p class="text-xl font-semibold text-space mb-2.5">Импорт публикаций</p>
        <p class="text-sm font-normal text-slate-custom mb-25px">
          Свяжите уже размещенные объявления вашего профиля с вакансией в Jobly
        </p>
        <div class="w-full mb-25px h-[1px] bg-athens"></div>
        <p class="text-sm font-medium text-space mb-15px">
          Авторизованные профили:
        </p>
        <EmailDropdown
          :options="emailOptions"
          v-model="importEmail"
          placeholder="Выберите аккаунт"
          class="mb-25px"
        />
        <div class="loader-wrapper text-center bg-athens py-50px">
          <div class="loader mx-auto mb-25px"></div>
          <p class="text-13px text-dodger font-normal">
            Обновляем список вакансий
          </p>
        </div>
        <div class="flex w-full mt-[252px]">
          <UiButton
            variant="back"
            size="back"
            @click="closeImportPopup"
            class="ml-auto px-[19.5px]"
          >
            Отмена
          </UiButton>
        </div>
      </Popup>
    </transition>
    <transition name="fade" @after-leave="enableBodyScroll">
        <Popup
        :isOpen="addAuthPopup"
        @close="closeAddAuthPopup"
        :showCloseButton="false"
        :width="'361px'"
        :height="'fit-content'">
           <p class="text-xl font-semibold text-space mb-2.5">
            Подключить свой аккаунт
          </p>
          <p class="text-sm font-normal text-slate-custom mb-25px">
            Укажите данные авторизации вашего профиля
          </p>
          <div class="w-full mb-25px h-[1px] bg-athens"></div>
          <div class="flex gap-[15px] flex-wrap">
            <button 
               v-for="(item, index)  in platforms" 
               :key="index" 
               :class="{ 'opacity-10': activePlatform !== index }"
               @click="() => {activePlatform = index; errorAuthPlatform = null}"
            >
              <svg-icon v-if="item.svg !== 'popup-youla'"  :name="item.svg" width="50" height="50" />
              <div v-else :class="item.svg" @click="openPopupAuth"></div>
            </button>
          </div>
          <div class="w-full mb-25px mt-25px h-[1px] bg-athens"></div>
          <ConnectedPlatform 
            v-if="platforms[activePlatform].isAuthenticated" 
            :email="platforms[activePlatform].data?.email"
          ></ConnectedPlatform>
          <div v-if="errorAuthPlatform" class="text-red-500 text-xs mt-1">
                {{ errorAuthPlatform }}
          </div>
          <UiButton
          variant="action"
          size="action"
          class="mt-auto w-full"
          :class="{ 'opacity-30': btnAuthDisabled , 'disabled:cursor-not-allowed' : btnAuthDisabled }"
          @click="authPlatform(platforms[activePlatform].platform)"
          v-if="!platforms[activePlatform].isAuthenticated"
        >
          Авторизовать
        </UiButton>
        </Popup>
    </transition>
  </div>
  </div>
</template>

<style scoped>
  .bg-img {
    background-size: cover;
    width: 41px;
    height: 40px;
  }

  .youla-pic {
    background-image: url('@/assets/img/youla.svg');
  }

  .popup-youla {
    background-size: cover;
    width: 50px;
    height: 50px;
    background-image: url('@/assets/img/youla-50.svg');
  }

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

  /* loader */
  .loader {
    width: 56px;
    height: 56px;
    background-image: url('@/assets/img/import-loader.png');
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }

  .loader-wrapper {
    position: absolute;
    left: 0;
    right: 0;
  }
</style>
