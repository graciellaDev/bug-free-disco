<template>
    <div class="body-page">
        <AuthLetterPattern />
        <div class="auth-stack">
            <div class="auth-container">
                <EnterForm
                    v-if="currentForm === 'enter'"
                    :initial-email="authEmailDraft"
                    @changeForm="changeForm"
                />
                <ResetForm
                    v-if="currentForm === 'reset'"
                    :initial-email="authEmailDraft"
                    @changeForm="changeForm"
                />
            </div>
            <footer
                v-if="currentForm === 'enter' || currentForm === 'reset'"
                class="auth-support"
            >
                <p class="auth-support__title">Служба поддержки Наймикс</p>
                <a
                    :href="supportHref"
                    class="auth-support__link"
                    :target="supportExternal ? '_blank' : undefined"
                    :rel="supportExternal ? 'noopener noreferrer' : undefined"
                >{{ supportDisplay }}</a>
            </footer>
        </div>
    </div>
</template>

<script setup>
import EnterForm from "~/pages/auth/EnterForm.vue";
import ResetForm from "~/pages/auth/ResetForm.vue";
import { fetchSupportLink, resolveSupportLinkLabel } from "~/utils/fetchSupportLink";

import { onMounted, ref } from "vue";

definePageMeta({
    layout: 'blank',
})

const currentForm = ref('enter'); // enter, reg, reset
const authEmailDraft = ref('');

const DEFAULT_SUPPORT_EMAIL = 'help@naymix.ru';

const supportHref = ref(`mailto:${DEFAULT_SUPPORT_EMAIL}`);
const supportDisplay = ref(DEFAULT_SUPPORT_EMAIL);
const supportExternal = ref(false);

onMounted(async () => {
    const { url, label } = await fetchSupportLink();
    if (!url) {
        return;
    }

    if (url.startsWith('mailto:')) {
        supportHref.value = url;
        supportDisplay.value = label || resolveSupportLinkLabel(url, null);
        supportExternal.value = false;
        return;
    }

    supportHref.value = url;
    supportDisplay.value = label || resolveSupportLinkLabel(url, null);
    supportExternal.value = true;
});

// Функция переключения форм (email пробрасывается с экрана входа в восстановление)
const changeForm = (formName, email = '') => {
    const trimmed = typeof email === 'string' ? email.trim() : '';
    if (trimmed) {
        authEmailDraft.value = trimmed;
    }
    currentForm.value = formName;
};
</script>

<style scoped>
.body-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.auth-stack {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.auth-support {
  width: 440px;
  max-width: calc(100% - 32px);
  margin-top: 4px;
  text-align: center;
}

.auth-support__title {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.25;
  color: #a8b0c4;
}

.auth-support__link {
  font-size: 13px;
  font-weight: 400;
  line-height: 1.25;
  color: #a8b0c4;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.2s ease;
}

.auth-support__link:hover {
  color: #9098b4;
}

.auth-container {
  width: 440px;
  max-width: calc(100% - 32px);
  margin: 0 auto;
}

.form {
  position: relative;
  top: auto;
  left: auto;
  transform: none;
  width: 100%;
}

.form.active {
  visibility: visible;
  opacity: 1;
  z-index: 0;
}

/* fonts */
:deep(.f12w400) {
  font-size: 12px;
  font-weight: 400;
}

:deep(.f13w300) {
  font-size: 13px;
  font-weight: 300;
}

:deep(.f13w400) {
  font-size: 13px;
  font-weight: 400;
}

:deep(.f14w400) {
  font-size: 14px;
  font-weight: 400;
}

:deep(.f14w500) {
  font-size: 14px;
  font-weight: 500;
}

:deep(.f14w600) {
  font-size: 14px;
  font-weight: 600;
}

:deep(.f25w700) {
  font-size: 25px;
  font-weight: 700;
  color: #2f353d;
  line-height: 1.2;
}

/* colors */
:deep(.c-bali) {
  color: #9098b4;
}

:deep(.c-white) {
  color: #ffffff;
}

:deep(.c-dodger),
:deep(.reg__title-brand) {
  color: #5898ff;
  text-decoration: none;
}

:deep(.enter__title-custom) {
  color: #5898ff;
}

:deep(.enter__descr) {
  color: #2f353d;
  font-weight: 400;
}

:deep(.auth-field-label),
:deep(.reset__email-title),
:deep(.reg__first-name),
:deep(.reg__email-title),
:deep(.reg__phone-title),
:deep(.reg__pass-title),
:deep(.reg__web-title) {
  margin: 0 0 10px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #2f353d;
}

/* inputs */
:deep(.e-input) {
  width: 100%;
  line-height: normal;
  color: #2f353d;
  border: 1px solid #edeff5;
  border-radius: 10px;
  background-color: #f4f6f8;
  padding: 11px 15px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

:deep(.e-input::placeholder) {
  color: #9098b4;
}

:deep(.error) {
  border-color: #f50a0a;
  margin-bottom: 4px;
}

:deep(.e-input:focus) {
  outline: none;
  border-color: #5898ff;
  box-shadow: 0 0 0 1px #5898ff;
}

:deep(.e-input.error:focus) {
  outline: none;
  box-shadow: none;
}

:deep(.pass-eye) {
  position: absolute;
  top: 0;
  right: 5px;
  bottom: 0;
  display: block;
  width: 40px;
  height: 40px;
  margin: auto 0;
  cursor: pointer;
  border: none;
  background-color: transparent;
  background-image: url('/assets/img/eyeHide.svg');
  background-repeat: no-repeat;
  background-position: center;
  transition: opacity 0.3s ease-out, background-image 0.3s ease-out;
}

:deep(.pass-eye.show) {
  background-image: url('/assets/img/eyeShow.svg');
}

:deep(.btn) {
  min-width: 80px;
  min-height: 44px;
  padding: 11px 20px;
  border-radius: 10px;
  cursor: pointer;
}

:deep(.enter__btn-in),
:deep(.reset__send),
:deep(.reg__btn-finish) {
  border: none;
  background-color: #5898ff;
  transition: background-color 0.2s ease;
}

:deep(.enter__btn-in:hover),
:deep(.reset__first .reset__send:hover),
:deep(.reg__btn-finish:hover) {
  background-color: #4680e6;
}

:deep(.p-flex) {
  display: flex;
}

:deep(.enter),
:deep(.reset__first) {
  box-sizing: border-box;
  width: 440px;
  max-width: 100%;
  background-color: #ffffff;
  border-radius: 24px;
}

:deep(.enter .f25w700),
:deep(.reset__first .f25w700),
:deep(.reset__first .reset__title) {
  font-size: 27px;
}

:deep(.enter .f14w400),
:deep(.enter .f14w600),
:deep(.reset__first .f14w400),
:deep(.reset__first .f14w600) {
  font-size: 15px;
}

:deep(.enter .auth-field-label),
:deep(.reset__first .auth-field-label) {
  margin-bottom: 10px;
  font-size: 15px;
  line-height: 22px;
}

:deep(.enter .e-input),
:deep(.reset__first .e-input) {
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 15px;
}

:deep(.enter .btn),
:deep(.reset__first .btn),
:deep(.reset__first .reset__send) {
  min-height: 48px;
  padding: 12px 20px;
  border-radius: 10px;
}

:deep(.enter .enter__btn-in),
:deep(.reset__first .reset__send) {
  font-size: 15px;
}

:deep(.enter .pass-eye) {
  width: 44px;
  height: 44px;
  right: 6px;
}

:deep(.reg),
:deep(.reset__second) {
  background-color: #ffffff;
  border-radius: 24px;
}

:deep(.reset__title),
:deep(.reset__checkout) {
  color: #2f353d;
}
</style>