<template>
    <div class="container-reg">
        <div class="recover">
            <p class="recover__title f25w700">Восстановление доступа</p>
            <div class="recover__main">
                <p class="f14w500 recover__main-new"><span class="reg__circle">*</span> Новый пароль</p>
                <label class="recover__new-label"><input type="password"
                      class="recover__new-input e-input text-sm font-normal" placeholder="******" id="new-pass"
                      v-model="newPassword" :class="{ 'error': newPasswordError }">
                    <button type="button" class="pass-eye" @click="togglePassword('new-pass')"
                      data-id="new-pass"></button>
                    <span v-if="newPasswordError" id="pass-error" class="error-message f12w400" style="color:red;">{{
                        newPasswordError }}</span></label>
                <p class="f14w500 recover__main-repeat"><span class="reg__circle">*</span> Повторите пароль</p>
                <label class="recover__repeat-label"><input type="password"
                      class="recover__repeat-input e-input text-sm font-normal" placeholder="******" id="repeat-pass"
                      v-model="repeatPassword" :class="{ 'error': repeatPasswordError }">
                    <button type="button" class="pass-eye" @click="togglePassword('repeat-pass')"
                      data-id="repeat-pass"></button>
                    <span v-if="repeatPasswordError" id="repeat-pass-error" class="error-message f12w400"
                      style="color:red;">{{ repeatPasswordError }}</span></label>
            </div>
            <p class="recover__info f12w400 c-bali">Пароль должен состоять минимум из&nbsp;8&nbsp;символов, содержать
                минимум одну строчную, одну прописную букву и&nbsp;одну цифру</p>
            <button class="btn-reset btn__recovery-accept f14w600 c-white" id="recover-next"
              @click="finishRecovery">Восстановить</button>
            <div v-if="successRecovery" class="recovery-success text-center pt-2.5">
                <p class="text-xs text-green font-normal mb-2">Пароль успешно заменен!</p>
                <NuxtLink to="/auth" class="text-dodger text-base font-semibold hover:underline decoration-dodger">
                    Перейти на главную
                </NuxtLink>
            </div>
        </div>
        <div class="video-block overflow-hidden">
            <AuthDemoVideoPlayer />
        </div>
    </div>
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue';
import { useNuxtApp } from '#app';

const AuthDemoVideoPlayer = defineAsyncComponent(() => import('~/components/auth/AuthDemoVideoPlayer.vue'))

const newPassword = ref('');
const repeatPassword = ref('');
const newPasswordError = ref(null);
const repeatPasswordError = ref(null);
const successRecovery = ref(false);
const route = useRoute();

definePageMeta({
    layout: 'blank',
})

const togglePassword = (id) => {
    const passwordInput = document.getElementById(id);
    const eyeButton = document.querySelector(`.pass-eye[data-id="${id}"]`);

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeButton.classList.add('show');
    } else {
        passwordInput.type = 'password';
        eyeButton.classList.remove('show');
    }
};

const checkPasswords = () => {
    // Сбрасываем ошибки
    newPasswordError.value = null;
    repeatPasswordError.value = null;

    let isValid = true;

    // Проверка на пустое поле пароля
    if (!newPassword.value) {
        newPasswordError.value = 'Введите пароль';
        isValid = false;
    } else {
        // Проверка на длину и сложность пароля
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordPattern.test(newPassword.value)) {
            newPasswordError.value =
                'Пароль не соответствует условиям';
            isValid = false;
        }
    }

    // Проверка на пустое поле повторного ввода пароля
    if (!repeatPassword.value) {
        repeatPasswordError.value = 'Повторите пароль';
        isValid = false;
    }

    // Проверка на совпадение паролей
    if (newPassword.value && repeatPassword.value && newPassword.value !== repeatPassword.value) {
        repeatPasswordError.value = 'Пароли не совпадают';
        isValid = false;
    }

    return isValid;
};

async function finishRecovery() {
    if (!checkPasswords()) return;

    const userId = route.query.user_id;
    const keyRestore = route.query.key;
    const { $axios } = useNuxtApp();

    if (!userId || !keyRestore) {
        console.error("Ошибка: отсутствует параметры user_id or key");
        return;
    }

    try {
        const response = await $axios.post(`/restore-success/${userId}`, {
            key: keyRestore,
            password: newPassword.value,
            password_confirmation: repeatPassword.value
        });

        if (response.status === 200) {
            successRecovery.value = true;
        }
    } catch (error) {
        console.error("Ошибка восстановления:", error.response?.data || error);
    }
}
</script>

<style scoped>
.container-reg {
    display: flex;
    flex-direction: row;
    max-width: 900px;
    column-gap: 15px;
    width: 100%;
    margin: 0 auto;
    padding-top: 15%;
}

.recover {
    max-width: 442.5px;
    width: 100%;
    padding: 50px;
    background-color: #ffffff;
    border-radius: 15px;
}

.recover__title {
    margin-bottom: 27px;
    line-height: normal;
    text-align: center;
}

.f12w400 {
    font-size: 12px;
    font-weight: 400;
}

.f25w700 {
    font-size: 25px;
    font-weight: 700;
}

.recover__main-new {
    margin-bottom: 15px;
}

.f14w500 {
    font-size: 14px;
    font-weight: 500;
}

.f14w600 {
    font-size: 14px;
    font-weight: 600;
}

.reg__circle {
    color: #f50a0a;
}

.recover__new-label {
    position: relative;
    display: block;
    margin-bottom: 15px;
    line-height: normal;
}

.e-input {
    border: 1px solid #EDEFF5;
    border-radius: 10px;
    padding: 11.5px 15px 11.5px 45px;
    background-color: #F4F6F8;
    width: 100%;
}

.recover__new-input,
.recover__repeat-input {
    padding: 11px 15px 7px 15px;
}

.pass-eye {
    position: absolute;
    width: 40px;
    height: 40px;
    display: block;
    background-image: url('/assets/img/eyeHide.svg');
    background-repeat: no-repeat;
    background-color: transparent;
    background-position: center;
    bottom: 0;
    right: 5px;
    top: 0;
    cursor: pointer;
    border: none;
    transition: background-image 0.3s ease-in-out;
}

.pass-eye.show {
    background-image: url('/assets/img/eyeShow.svg');
}


.error-message {
    margin-top: 10px;
}

.recover__main-repeat {
    margin-bottom: 15px;
}

.recover__repeat-label {
    position: relative;
    display: block;
    margin-bottom: 15px;
    line-height: normal;
}

.recover__info {
    margin-bottom: 26px;
    line-height: 130%;
}

.btn__recovery-accept {
    padding: 9.5px 10px;
    background-color: #5898ff;
    border-radius: 10px;
    width: 100%;
}

.c-white {
    color: #ffffff;
}

.c-bali {
    color: #9098B4;
}

.e-input:focus {
    outline: 1px solid #5898FF;
}

.error {
    border: 1px solid #f50a0a;
    margin-bottom: 5px;
}

.e-input.error:focus {
    outline: none
}

:deep(.video-js .vjs-control-bar) {
    border-bottom-left-radius: 15px;
    border-bottom-right-radius: 15px;
}

:deep(.vjs-poster) {
    background-size: cover;
    border-radius: 15px;
}

:deep(.video-js .vjs-big-play-button) {
    height: 100px;
    width: 100px;
    border: none;
    background-color: transparent;
    top: 50%;
    left: 50%;
    transform: translate(-50px, -55px);
    background-image: url('/assets/img/play-icon.svg');
    transition: opacity .3s ease-in-out;
}

:deep(.video-js .vjs-big-play-button:hover) {
    opacity: .5
}

:deep(.video-js .vjs-big-play-button .vjs-icon-placeholder:before) {
    content: none;
}

:deep(.video-js) {
    border-radius: 15px;
}
</style>