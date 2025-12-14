<template>
    <div class="container pb-72 pt-48">
        <div class="mb-9">
                 <!-- Третий блок(магазин) -->
            <p class="text-xl font-semibold text-space mb-5px">Размещения</p>
            <p class="text-sm font-normal text-slate-custom mb-27px leading-normal">
              Разместите вакансию на работном сайте
            </p>
            <div class="w-full gap-x-25px flex">
              <div
                class="grid grid-cols-[repeat(auto-fit,minmax(234px,1fr))] gap-15px mb-35px w-full"
              >
                <!-- Динамический рендеринг карточек -->
                <div
                  v-for="card in cartStore.cardsData"
                  :key="card.id"
                  class="p-25px bg-white rounded-fifteen flex flex-col min-w-56"
                >
                  <div class="flex items-center justify-between mb-3.5">
                    <div class="flex items-center gap-2.5">
                      <CardIcon
                        :icon="card.icon"
                        :isPng="card.isPng"
                        :imagePath="card.imagePath"
                      />
                      <p class="text-sm font-medium text-slate-custom">{{ card.name }}</p>
                    </div>
                    <DotsDropdown 
                      v-if="isPlatformAuthenticated(card.name)"
                      :items="platformDropdownOptions" 
                      @select-item="(item) => handlePlatformDropdown(item, card.name)"
                    />
                  </div>
                  <div class="w-full h-[1px] bg-athens mb-3.5"></div>
                  <UiButton
                    :variant="isPlatformAuthenticated(card.name) ? 'success' : 'action'"
                    size="action"
                    @click="handlePlatformButtonClick(card.name)"
                  >
                    {{ isPlatformAuthenticated(card.name) ? 'Опубликовать' : 'Подключить аккаунт' }}
                    <svg-icon
                      v-if="isPlatformAuthenticated(card.name)"
                      name="check-success"
                      width="16"
                      height="16"
                    />
                  </UiButton>
                </div>
              </div>
              <!-- <div class="max-w-[275px] w-full">
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
        </div> -->
        <!-- <div v-else class="p-25px bg-white rounded-fifteen">
          <p class="text-xl font-medium text-space mb-15px">Ваша корзина</p>
          <p class="text-sm font-normal text-slate-custom">
            Пока что здесь пусто
          </p>
        </div>
      </div> -->
    </div>
        </div>

        <!-- Попап публикации вакансии -->
        <Popup
            :isOpen="isPublishPopupOpen"
            @close="closePublishPopup"
            :showCloseButton="false"
            :width="'540px'"
            :height="'fit-content'"
            :disableOverflowHidden="true"
        >
            <div>
                <p class="text-xl font-semibold text-space mb-2.5">Публикация вакансии</p>
                <p class="text-sm font-normal text-slate-custom mb-25px">
                    Вы собираетесь опубликовать вакансию на платформе <span class="font-medium text-space">{{ selectedPlatformForPublish }}</span>
                </p>
                
                <div v-if="currentVacancy" class="bg-athens-gray rounded-fifteen p-20px mb-25px">
                    <div class="mb-15px">
                        <p class="text-xs font-normal text-slate-custom mb-1">Название вакансии</p>
                        <p class="text-sm font-medium text-space">{{ currentVacancy.title || 'Не указано' }}</p>
                    </div>
                    <div class="mb-15px">
                        <p class="text-xs font-normal text-slate-custom mb-1">Регион</p>
                        <p class="text-sm font-medium text-space">{{ currentVacancy.location || 'Не указано' }}</p>
                    </div>
                    <div class="mb-15px">
                        <p class="text-xs font-normal text-slate-custom mb-1">Зарплата</p>
                        <p class="text-sm font-medium text-space">
                            <template v-if="currentVacancy.salary_from || currentVacancy.salary_to">
                                {{ currentVacancy.salary_from ? `от ${currentVacancy.salary_from}` : '' }}
                                {{ currentVacancy.salary_to ? `до ${currentVacancy.salary_to}` : '' }}
                                {{ currentVacancy.currency || '₽' }}
                            </template>
                            <template v-else>Не указана</template>
                        </p>
                    </div>
                    <div>
                        <p class="text-xs font-normal text-slate-custom mb-1">Тип занятости</p>
                        <p class="text-sm font-medium text-space">{{ currentVacancy.employment || 'Не указано' }}</p>
                    </div>
                </div>
                <div v-else class="bg-athens-gray rounded-fifteen p-20px mb-25px">
                    <p class="text-sm font-normal text-slate-custom">Загрузка данных вакансии...</p>
                </div>

                <div class="flex gap-x-15px">
                    <UiButton variant="action" size="action" @click="confirmPublish" :disabled="!currentVacancy">
                        Опубликовать
                    </UiButton>
                    <UiButton variant="back" size="back" @click="closePublishPopup">
                        Отмена
                    </UiButton>
                </div>
            </div>
        </Popup>

        <!-- Попап отвязки профиля -->
        <Popup
            :isOpen="isUnlinkPopupOpen"
            @close="closeUnlinkPopup"
            :showCloseButton="false"
            :width="'490px'"
            :height="'fit-content'"
            :disableOverflowHidden="true"
        >
            <div>
                <p class="text-xl font-semibold text-space mb-2.5">Отвязка профиля</p>
                <p class="text-sm font-normal text-slate-custom mb-25px">
                    Вы действительно хотите отвязать профиль <span class="font-medium text-space">{{ platformToUnlink }}</span>?
                    После отвязки вам потребуется повторная авторизация для публикации вакансий на этой платформе.
                </p>
                
                <div class="flex gap-x-15px">
                    <UiButton variant="delete" size="delete" @click="confirmUnlink" :disabled="isUnlinking">
                        {{ isUnlinking ? 'Отвязка...' : 'Отвязать' }}
                    </UiButton>
                    <UiButton variant="back" size="back" @click="closeUnlinkPopup">
                        Отмена
                    </UiButton>
                </div>
                <p class="text-red-500 text-xs mt-3" v-if="unlinkError">
                    {{ unlinkError }}
                </p>
            </div>
        </Popup>

        <!-- Попап импорта публикаций -->
        <Popup
            :isOpen="isImportPopupOpen"
            @close="closeImportPopup"
            :showCloseButton="false"
            :width="'740px'"
            :height="'fit-content'"
            :disableOverflowHidden="true"
            maxHeight
        >
            <div>
                <div class="flex items-center justify-between mb-25px">
                    <div>
                        <p class="text-xl font-semibold text-space mb-1">Импорт публикаций</p>
                        <p class="text-sm font-normal text-slate-custom">
                            Публикации с платформы {{ selectedImportPlatform }}
                        </p>
                    </div>
                    <button @click="closeImportPopup" class="text-slate-custom hover:text-space transition-colors">
                        <svg-icon name="close" width="20" height="20" />
                    </button>
                </div>

                <!-- Прелоадер -->
                <div v-if="isLoadingImport" class="flex flex-col items-center justify-center py-60px">
                    <div class="loader mb-15px"></div>
                    <p class="text-sm font-normal text-slate-custom">Загрузка публикаций...</p>
                </div>

                <!-- Ошибка -->
                <div v-else-if="importError" class="py-40px text-center">
                    <p class="text-sm font-normal text-red-500 mb-15px">{{ importError }}</p>
                    <UiButton variant="action" size="action" @click="openImportPopup(selectedImportPlatform)">
                        Повторить
                    </UiButton>
                </div>

                <!-- Список публикаций -->
                <div v-else-if="importedPublications.length > 0" class="max-h-[400px] overflow-y-auto">
                    <div class="import-table">
                        <!-- Хедер таблицы -->
                        <div class="import-table-header">
                            <div class="px-2.5">Название</div>
                            <div class="px-2.5">Регион</div>
                            <div class="px-2.5">Зарплата</div>
                            <div class="px-2.5">Статус</div>
                            <div></div>
                        </div>
                        <!-- Строки таблицы -->
                        <div 
                            v-for="pub in importedPublications" 
                            :key="pub.id" 
                            class="import-table-row"
                        >
                            <div class="text-sm font-medium text-space px-2.5 truncate">{{ pub.name }}</div>
                            <div class="text-sm font-normal text-slate-custom px-2.5">{{ pub.area?.name || '—' }}</div>
                            <div class="text-sm font-normal text-slate-custom px-2.5">
                                <template v-if="pub.salary">
                                    {{ pub.salary.from ? `от ${pub.salary.from}` : '' }}
                                    {{ pub.salary.to ? `до ${pub.salary.to}` : '' }}
                                    {{ pub.salary.currency || '' }}
                                </template>
                                <template v-else>Не указана</template>
                            </div>
                            <div class="px-2.5">
                                <span 
                                    class="text-xs font-medium px-2 py-1 rounded-md"
                                    :class="pub.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-slate-custom'"
                                >
                                    {{ pub.status === 'published' ? 'Активна' : pub.status }}
                                </span>
                            </div>
                            <div class="flex justify-end">
                                <UiButton 
                                    variant="action" 
                                    size="small"
                                    @click="importPublication(pub)"
                                >
                                    Импорт
                                </UiButton>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Пустой список -->
                <div v-else class="py-40px text-center">
                    <p class="text-sm font-normal text-slate-custom">Публикации не найдены</p>
                </div>

                <div class="flex justify-end mt-25px pt-25px border-t border-athens">
                    <UiButton variant="back" size="back" @click="closeImportPopup">
                        Закрыть
                    </UiButton>
                </div>
            </div>
        </Popup>
    
        <!-- Заголовок -->
        <div class="flex justify-between bg-white rounded-fifteen p-25px items-center mb-15px">
            <div>
                <p class="text-xl font-semibold text-space mb-2.5">Активные публикации</p>
                <p class="text-sm font-normal text-slate-custom">
                    Сюда перемещаются активные объявления опубликованные на&nbsp;сайтах или импортированные
                    из&nbsp;подключенных профилей
                </p>
            </div>
            <UiButton variant="action" size="action" class="font-bold" @click="openPopupNewPublication">
                Добавить публикацию
            </UiButton>
            <Popup
                  :isOpen="isOpenPopup"
                  @close="() => (isOpenPopup = false)"
                  :width="'740px'"
                  :showCloseButton="false"
                  :disableOverflowHidden="true"
                  :overflowContainer="true"
                  maxHeight
                  :lgSize="true"
            >
            <AddPublication/>
            </Popup>
        </div>

        <!-- Таблица на Grid -->
        <div class="table-container">
            <!-- Хедер -->
            <div class="table-header">
                <div>
                    <MyCheckbox id="select-all" :label="''" v-model="allSelected" @update:modelValue="toggleAll"
                      :emptyLabel="true" />
                </div>
                <div class="px-2.5">Вакансия</div>
                <div class="px-2.5">Регион</div>
                <div class="px-2.5">Тариф</div>
                <div @click="sortBy('site')" class="flex items-center gap-x-2.5 px-2.5 cursor-pointer select-none">
                    Сайт
                    <div class="sort-arrow" :style="sortArrowStyle('site')">
                        <svg-icon name="sort-arrow" width="16px" height="15px" />
                    </div>
                </div>

                <div @click="sortBy('views')" class="flex items-center gap-x-2.5 px-2.5 cursor-pointer select-none">
                    Просмотры
                    <div class="sort-arrow" :style="sortArrowStyle('views')">
                        <svg-icon name="sort-arrow" width="16px" height="15px" />
                    </div>
                </div>
                <div @click="sortBy('responses')" class="flex items-center gap-x-2.5 px-2.5 cursor-pointer select-none">
                    Отклики<div class="sort-arrow" :style="sortArrowStyle('responses')">
                        <svg-icon name="sort-arrow" width="16px" height="15px" />
                    </div>
                </div>
                <div @click="sortBy('expires')" class="flex items-center gap-x-2.5 px-2.5 cursor-pointer select-none">
                    Истекает<div class="sort-arrow" :style="sortArrowStyle('expires')">
                        <svg-icon name="sort-arrow" width="16px" height="15px" />
                    </div>
                </div>
                <div></div>
            </div>

            <!-- Тело -->
            <div class="table-body">
                <div v-for="item in sortedData" :key="item.id" class="table-row">
                    <div>
                        <MyCheckbox :id="item.id" :label="''" v-model="selected[item.id]" :emptyLabel="true" />
                    </div>
                    <div class="text-sm font-medium text-space px-2.5">{{ item.name }}</div>
                    <div class="text-sm font-medium text-space px-2.5">{{ item.area.name }}</div>
                    <div class="text-sm font-medium text-space px-2.5">{{ item.billing_type?.name ?? 'Стандарт' }}</div>
                    <div>
                        <CardIcon icon="hh" :isPng="false" imagePath="" :width="21"
                          :height="21" class="px-2.5" />
                    </div>
                    <div class="text-sm font-medium text-space px-2.5">{{ item.views }}</div>
                    <div class="text-sm font-medium text-space px-2.5">{{ item.responses }}</div>
                    <div class="text-sm font-medium text-space px-2.5">{{ dateStringToDots(item.published_at) }}</div>
                    <div>
                        <DotsDropdown :items="dropdownOptions" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent } from "vue";
import MyCheckbox from "~/components/custom/MyCheckbox.vue";
import DotsDropdown from '~/components/custom/DotsDropdown.vue';
import CardIcon from '~/components/custom/CardIcon.vue';
import Popup from '~/components/custom/Popup.vue';
import AddPublication from "~/components/platforms/AddPublication.vue";
import MultiDropdown from "~/components/custom/MultiDropdown.vue";
import { getPublications, getProfile, auth as authHh, unlinkProfile } from "~/utils/hhAccount";
import { dateStringToDots } from "@/helpers/date";
import { useCartStore } from '@/stores/cart'
import cardsData from '~/src/data/cards-data.json'
import ratesData from '~/src/data/rates-data.json'
import { getVacancy } from '@/utils/getVacancies'

const data = ref([
    { id: 1, vacancy: "Менеджер по продажам не детских игрушек", region: "Санкт-Петербург", tariff: "Стандарт", site: "SJ", icon: "sj20", isPng: false, imagePath: "", views: 3250, responses: 492, expires: "18.12" },
    { id: 2, vacancy: "Администратор", region: "Самара городок", tariff: "С автоподнятием", site: "3", icon: "zarplata20", isPng: false, imagePath: "", views: 3249, responses: 491, expires: "18.11" },
    { id: 3, vacancy: "Повар кассир", region: "Самара городок", tariff: "С автоподнятием", site: "3", icon: "zarplata20", isPng: false, imagePath: "", views: 2249, responses: 391, expires: "17.11" },
    { id: 4, vacancy: "Лесник", region: "Самара городок", tariff: "С автоподнятием", site: "3", icon: "zarplata20", isPng: false, imagePath: "", views: 3149, responses: 481, expires: "19.11" },
    { id: 5, vacancy: "Менеджер по продажам всякой всячины", region: "Самара городок", tariff: "С автоподнятием", site: "3", icon: "zarplata20", isPng: false, imagePath: "", views: 3239, responses: 461, expires: "14.11" },
    { id: 6, vacancy: "Разработчик", region: "Самара городок", tariff: "С автоподнятием", site: "3", icon: "zarplata20", isPng: false, imagePath: "", views: 3248, responses: 490, expires: "18.10" },
    { id: 7, vacancy: "Бизнес коуч", region: "Самара городок", tariff: "С автоподнятием", site: "3", icon: "zarplata20", isPng: false, imagePath: "", views: 3229, responses: 421, expires: "11.11" },
    { id: 8, vacancy: "Астролог", region: "Томск", tariff: "С Бизнес", site: "youla", icon: false, isPng: true, imagePath: "/img/logo20.png", views: 3249, responses: 491, expires: "18.11" },
    // Добавь остальные данные
]);


const selected = ref({}); // Выбранные чекбоксы
const allSelected = ref(false);
const sortKey = ref(""); // Поле для сортировки
const sortOrder = ref("asc"); // Порядок сортировки
const sortDirection = ref("asc");
const isOpenPopup = ref(false);
const publicationsHh = ref([]);
const publications = await getPublications()
const cartStore = useCartStore()

if (publications && !publications.error && !publications.errorRoles) {
    publicationsHh.value = publications.roles?.items || [];
}

// Статус авторизации платформ
const platformsAuth = ref({
    'hh.ru': false,
    'avito.ru': false,
    'rabota.ru': false,
    'superjob': false,
});
const authError = ref(null);
const platformDropdownOptions = ["Импорт публикаций", "Отвязать профиль"];

// Попап публикации вакансии
const isPublishPopupOpen = ref(false);
const currentVacancy = ref(null);
const selectedPlatformForPublish = ref(null);
const route = useRoute();
const currentVacancyId = route.query.id;

// Попап отвязки профиля
const isUnlinkPopupOpen = ref(false);
const platformToUnlink = ref(null);
const isUnlinking = ref(false);
const unlinkError = ref(null);

// Попап импорта публикаций
const isImportPopupOpen = ref(false);
const isLoadingImport = ref(false);
const importedPublications = ref([]);
const importError = ref(null);
const selectedImportPlatform = ref(null);
console.log('publicationsHh.value', publicationsHh.value)
const sortedData = computed(() => {
    if (!sortKey.value) return publicationsHh.value;
    return [...publicationsHh.value].sort((a, b) => {
        const multiplier = sortOrder.value === "asc" ? 1 : -1;
        if (a[sortKey.value] > b[sortKey.value]) return 1 * multiplier;
        if (a[sortKey.value] < b[sortKey.value]) return -1 * multiplier;
        return 0;
    });
});

//////////////////////////////////////////////

function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

async function authPlatform(platformName) {
    authError.value = null;
    
    if (platformName === 'hh.ru') {
        const config = useRuntimeConfig();
        const tokenCookie = useCookie('auth_user');
        setCookie('process_auth', 'true', 1);
        window.location.href = config.public.apiBase + `/code-hh?customerToken=${tokenCookie.value}`;
    } else {
        authError.value = `Платформа ${platformName} пока не поддерживается`;
    }
}

function isPlatformAuthenticated(platformName) {
    return platformsAuth.value[platformName] || false;
}

async function handlePlatformButtonClick(platformName) {
    if (isPlatformAuthenticated(platformName)) {
        // Платформа авторизована - открываем попап публикации
        await openPublishPopup(platformName);
    } else {
        // Платформа не авторизована - начинаем авторизацию
        await authPlatform(platformName);
    }
}

async function openPublishPopup(platformName) {
    selectedPlatformForPublish.value = platformName;
    
    // Загружаем данные текущей вакансии
    if (currentVacancyId && !currentVacancy.value) {
        currentVacancy.value = await getVacancy(currentVacancyId);
    }
    
    isPublishPopupOpen.value = true;
}

function closePublishPopup() {
    isPublishPopupOpen.value = false;
    selectedPlatformForPublish.value = null;
}

function confirmPublish() {
    // TODO: Реализовать логику публикации вакансии
    alert(`Вакансия "${currentVacancy.value?.title}" будет опубликована на ${selectedPlatformForPublish.value}`);
    closePublishPopup();
}

function handlePlatformDropdown(item, platformName) {
    if (item === 'Импорт публикаций') {
        openImportPopup(platformName);
    } else if (item === 'Отвязать профиль') {
        openUnlinkPopup(platformName);
    }
}

async function openImportPopup(platformName) {
    selectedImportPlatform.value = platformName;
    importError.value = null;
    importedPublications.value = [];
    isImportPopupOpen.value = true;
    isLoadingImport.value = true;

    try {
        const result = await getPublications();
        
        if (result?.error || result?.errorRoles) {
            importError.value = result?.error || result?.errorRoles || 'Ошибка при загрузке публикаций';
            return;
        }

        importedPublications.value = result?.roles?.items || [];
    } catch (err) {
        console.error('Ошибка при импорте публикаций:', err);
        importError.value = 'Ошибка при загрузке публикаций';
    } finally {
        isLoadingImport.value = false;
    }
}

function closeImportPopup() {
    isImportPopupOpen.value = false;
    importedPublications.value = [];
    importError.value = null;
    selectedImportPlatform.value = null;
}

function importPublication(publication) {
    // Добавляем публикацию в список активных
    if (!publicationsHh.value.find(p => p.id === publication.id)) {
        publicationsHh.value.push(publication);
    }
    alert(`Публикация "${publication.name}" импортирована`);
}

function openUnlinkPopup(platformName) {
    platformToUnlink.value = platformName;
    unlinkError.value = null;
    isUnlinkPopupOpen.value = true;
}

function closeUnlinkPopup() {
    isUnlinkPopupOpen.value = false;
    platformToUnlink.value = null;
    unlinkError.value = null;
}

async function confirmUnlink() {
    if (!platformToUnlink.value) return;

    isUnlinking.value = true;
    unlinkError.value = null;

    try {
        const result = await unlinkProfile();

        if (result?.error) {
            unlinkError.value = result.error;
            return;
        }

        // Успешно отвязали профиль
        platformsAuth.value[platformToUnlink.value] = false;
        closeUnlinkPopup();
    } catch (err) {
        console.error('Ошибка при отвязке профиля:', err);
        unlinkError.value = 'Ошибка при отвязке профиля';
    } finally {
        isUnlinking.value = false;
    }
}

onMounted(async () => {
    await Promise.all([
      cartStore.setCardsData(cardsData),
      cartStore.setRatesData(ratesData),
    ])

    // Проверяем авторизацию hh.ru
    const { data, error } = await getProfile();
    if (!error && data) {
        platformsAuth.value['hh.ru'] = true;
    }

    // Обработка редиректа после авторизации hh.ru
    const query = useRoute().query;
    if (query.popup_account === 'true' && query.platform === 'hh' && query.message === 'success') {
        const processAuth = useCookie('process_auth');
        if (processAuth.value) {
            const response = await authHh();
            if (response && response.data) {
                platformsAuth.value['hh.ru'] = true;
            }
        }
    }
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

  ////////////////////////////////////

const sortBy = (key) => {
    if (sortKey.value === key) {
/**
 * Changes the sort order of the list of publications.
 * If the sort key is the same as the current sort key, the sort order is reversed.
 * If the sort key is different, the sort order is set to ascending.
 * @param {string} key - The key to sort by.
 */
        sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
        sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
    } else {
        sortKey.value = key;
        sortOrder.value = "asc";
        sortDirection.value = "asc";
    }
};

// Вычисляемое свойство для стилей стрелки
const sortArrowStyle = (key) => {
    return {
        transform: sortKey.value === key && sortOrder.value === "asc" ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.3s ease", // Плавное вращение
    };
};

const toggleAll = (isChecked) => {
    data.value.forEach((item) => {
        selected.value[item.id] = isChecked;
    });
};


// Следить за изменениями состояния частных чекбоксов
watch(selected, (newSelected) => {
    // Проверяем, выбраны ли все элементы
    const allChecked = data.value.every(item => newSelected[item.id]);
    const noneChecked = data.value.every(item => !newSelected[item.id]);

    allSelected.value = allChecked; // Обновляем общий чекбокс

    // Логика для состояния "частично выбрано" (например, при необходимости в будущем)
    if (!allChecked && !noneChecked) {
        console.log("Частично выбрано"); // Для добавления UI-реакции
    }
}, { deep: true }); // Обязательно deep, так как мы следим за вложенными объектами

const dropdownOptions = ["Редактировать текст", "Посмотреть публикацию", "Снять с публикации", "Дублировать публикацию", "Показать отчет по публикации"];

const openPopupNewPublication = () => {
    isOpenPopup.value = true;
}
</script>

<style scoped>
.table-container {
    display: grid;
    grid-template-rows: auto;
    /* Автоматическая высота строк */
    gap: 1px;
    /* Отступы между строками */
}

.table-body {
    display: grid;
    gap: 1px;
    /* Отступы между строками */
}

.table-header,
.table-row {
    display: grid;
    grid-template-columns:
        1.75%
        /* 1-й столбец */
        16.186%
        /* 2-й столбец */
        16.186%
        /* 3-й столбец */
        16.186%
        /* 4-й столбец */
        7.175%
        /* 5-й столбец */
        11.199%
        /* 6-й столбец */
        9.362%
        /* 7-й столбец */
        9.887%
        /* 8-й столбец */
        3.5%;
    /* 9-й столбец */
    gap: 10px;
    /* Горизонтальный отступ */
    padding: 20px 25px;
    align-items: center;
    /* Центрирование содержимого */
}

.table-header {
    background-color: #f5f7fa;
    border-radius: 15px 15px 0 0;
    font-weight: 500;
    font-size: 14px;
    color: #79869a;
    text-align: left;
}

.table-row {
    background-color: #ffffff;
    /* Для эстетики */
}

.table-row:last-child {
    border-radius: 0 0 15px 15px;
}

/* Стили для таблицы импорта */
.import-table {
    display: grid;
    grid-template-rows: auto;
    gap: 1px;
}

.import-table-header,
.import-table-row {
    display: grid;
    grid-template-columns: 30% 20% 20% 15% 15%;
    gap: 10px;
    padding: 15px 20px;
    align-items: center;
}

.import-table-header {
    background-color: #f5f7fa;
    border-radius: 10px 10px 0 0;
    font-weight: 500;
    font-size: 13px;
    color: #79869a;
}

.import-table-row {
    background-color: #ffffff;
    border-bottom: 1px solid #f4f6f8;
}

.import-table-row:last-child {
    border-radius: 0 0 10px 10px;
    border-bottom: none;
}

.import-table-row:hover {
    background-color: #f9fafb;
}

/* Прелоадер */
.loader {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #0052d0;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>