<template>
    <div class="w-full bg-white p-25px flex justify-between gap-2.5 pb-23px" :class="props.showTabs ? 'rounded-t-fifteen' : 'rounded-fifteen'">
        <div>
            <div class="mb-2">
                <p class="text-xl font-semibold" :class="{ 'page-title-employees': title === 'Сотрудники' }">
                    {{ title }}
                </p>
            </div>
            <div>
                <p class="text-sm font-normal text-bali">
                    Управляйте {{ title.replace(/.$/, 'ами').toLowerCase() }} из этого раздела
                </p>
            </div>
        </div>
        <div v-if="showInviteButton" class="flex items-center">
            <button
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-dodger text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold"
              @click="isOpenPopupAddClient = true"
            >
                Пригласить {{ title.replace(/.$/, 'а').toLowerCase() }}
            </button>
        </div>
    </div>
    <div v-if="props.showTabs" class="relative top-25px -left-25px" style="width: calc(100% + 50px);">
        <div class="bg-catskill w-full px-50px py-15px rounded-b-fifteen">
            <div class="gap-x-2.5 flex">
                <button 
                 class="rounded-ten leading-normal py-11.5px px-15px text-sm font-medium transition-colors relative"
                 :class="activeTab === 'list' ? 'bg-space text-white' : ''"
                 @click="updateActiveTab('list')"
                 >
                    Все {{ title.replace(/.$/, 'и') }}
                </button>
                <button 
                 class="rounded-ten leading-normal py-11.5px px-15px text-sm font-medium transition-colors relative"
                 :class="activeTab === 'invites' ? 'bg-space text-white' : ''"
                 @click="updateActiveTab('invites')"
                 >
                    Приглашения
                </button>
            </div>
        </div>
    </div>
    <transition name="fade" @after-leave="enableBodyScroll">
    <Popup  
              :isOpen="isOpenPopupAddClient" 
              @close="handleCloseSettingsPopup" 
              :showCloseButton="false"
              :width="'490px'" 
              :disableOverflowHidden="true" 
              :lgSize="true" :parentRounded="true"
              :contentPadding="false"
              :overflowVisible="true"
              :allowDropdownOverflow="true">
      <FormAddClient v-if="props.typeUser === 'client'" @update="update('invites')"/>
      <FormAddRecruiter
        v-if="props.typeUser === 'recruiter'"
        @update="update('invites')"
        @close="handleCloseSettingsPopup"
        @invited="showInviteSuccessToast"
      />
    </Popup>
  </transition>
  <Teleport to="body">
    <Transition name="invite-toast-fade">
      <div
        v-if="inviteToast.show"
        class="fixed right-4 z-[10001] max-w-[min(90vw,420px)] rounded-fifteen px-6 py-3 text-center text-sm font-medium leading-150 text-space shadow-[0_0_15px_rgba(0,0,0,0.15)] sm:right-6 invite-success-toast"
        :style="inviteToastTopStyle"
        role="status"
      >
        {{ inviteToast.text }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import Popup from '@/components/custom/Popup.vue';
import FormAddClient from '@/components/settings/FormAddClient.vue';
import FormAddRecruiter from './FormAddRecruiter.vue';
import { useJoblyToastTopStyle } from '@/composables/useJoblyToastTopStyle';

const props = defineProps({
    typeUser: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    activeTab: {
        type: String,
        default: 'list',
    },
    showTabs: {
        type: Boolean,
        default: true,
    },
    showInviteButton: {
        type: Boolean,
        default: true,
    },
});

const emit = defineEmits(['childClick']);
const activeTab = ref(props.activeTab);

const updateActiveTab = (tab) => {
    activeTab.value = tab;
    emit('childClick', tab);
}

const update = (tab) => {
    emit('childClick', tab, true);
}

const isOpenPopupAddClient = ref(false)

function handleCloseSettingsPopup() {
    isOpenPopupAddClient.value = false
}
function disableBodyScroll() {
    document.body.style.overflow = 'hidden' // Отключаем прокрутку
}
function enableBodyScroll() {
    document.body.style.overflow = ''
}

const inviteToast = ref({ show: false, text: '' });
let inviteToastTimer = null;
const inviteToastTopStyle = useJoblyToastTopStyle(computed(() => inviteToast.value.show));

function showInviteSuccessToast({ email }) {
    const mail = (email || '').trim();
    inviteToast.value = {
        show: true,
        text: mail
            ? `Приглашение отправлено сотруднику на почту ${mail}`
            : 'Приглашение отправлено. Сотруднику на почту придёт письмо с доступом.',
    };
    if (inviteToastTimer) clearTimeout(inviteToastTimer);
    inviteToastTimer = setTimeout(() => {
        inviteToast.value = { show: false, text: '' };
        inviteToastTimer = null;
    }, 4000);
}

onBeforeUnmount(() => {
    if (inviteToastTimer) clearTimeout(inviteToastTimer);
});
</script>

<style scoped>
/* Head/SB 20 — заголовок «Сотрудники» */
.page-title-employees {
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 20px;
    line-height: 130%;
    letter-spacing: 0;
    color: #2F353D;
}
</style>

<style>
.invite-success-toast {
    background-color: #ffffff !important;
    border: none !important;
    color: #212936 !important;
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
}
.invite-toast-fade-enter-active,
.invite-toast-fade-leave-active {
    transition: opacity 0.3s ease;
}
.invite-toast-fade-enter-from,
.invite-toast-fade-leave-to {
    opacity: 0;
}
</style>