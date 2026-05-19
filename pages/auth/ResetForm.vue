<template>
  <div class="reset form">
    <div v-if="step === 1" class="reset__first active form">
      <button
        class="reset__to-reg btn-reset"
        id="from-reset-to-reg"
        @click="$emit('changeForm', 'enter', email)"
      >
        <svg
          width="20"
          height="21"
          viewBox="0 0 20 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.8132 10.5C17.8132 10.7486 17.7145 10.9871 17.5387 11.1629C17.3628 11.3387 17.1244 11.4375 16.8757 11.4375H5.39136L9.41636 15.4617C9.59248 15.6378 9.69143 15.8767 9.69143 16.1258C9.69143 16.3748 9.59248 16.6137 9.41636 16.7898C9.24024 16.966 9.00137 17.0649 8.7523 17.0649C8.50323 17.0649 8.26436 16.966 8.08824 16.7898L2.46324 11.1648C2.37584 11.0777 2.30649 10.9742 2.25917 10.8603C2.21186 10.7463 2.1875 10.6242 2.1875 10.5008C2.1875 10.3774 2.21186 10.2552 2.25917 10.1413C2.30649 10.0273 2.37584 9.92381 2.46324 9.83671L8.08824 4.21171C8.17544 4.1245 8.27897 4.05533 8.39291 4.00813C8.50685 3.96094 8.62897 3.93665 8.7523 3.93665C8.87563 3.93665 8.99775 3.96094 9.11169 4.00813C9.22563 4.05533 9.32916 4.1245 9.41636 4.21171C9.50357 4.29891 9.57275 4.40244 9.61994 4.51638C9.66714 4.63032 9.69143 4.75244 9.69143 4.87577C9.69143 4.9991 9.66714 5.12122 9.61994 5.23516C9.57275 5.3491 9.50357 5.45263 9.41636 5.53983L5.39136 9.56249H16.8757C17.1244 9.56249 17.3628 9.66126 17.5387 9.83708C17.7145 10.0129 17.8132 10.2514 17.8132 10.5Z"
            fill="#9098B4"
          />
        </svg>
      </button>
      <p class="reset__title f25w700">Восстановление доступа</p>
      <p class="reset__descr f14w400 c-bali">
        Отправим ссылку на электронную почту
      </p>
      <div class="reset__email">
        <p class="auth-field-label">Email</p>
        <label class="reset__email-label">
          <input
            type="email"
            class="reset__email-input e-input f14w400"
            placeholder="Введите email для восстановления пароля"
            id="reset-email-input"
            v-model="email"
            :class="{ error: emailError }"
          />
          <span
            id="email-for-reset"
            class="error-message f12w400"
            style="color: red"
            v-if="emailError"
          >
            {{ emailError }}
          </span>
        </label>
      </div>
      <button
        class="btn-reset reset__send c-white f14w600"
        id="btnResetAccept"
        @click="toSecondStep"
      >
        Отправить
      </button>
    </div>
    <div v-if="step === 2" class="second-wrapper">
      <div class="reset__second">
        <button
          class="reset__to-send btn-reset"
          id="to-first-reset-step"
          @click="toFirstStep"
        >
          <svg
            width="20"
            height="21"
            viewBox="0 0 20 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.8132 10.5C17.8132 10.7486 17.7145 10.9871 17.5387 11.1629C17.3628 11.3387 17.1244 11.4375 16.8757 11.4375H5.39136L9.41636 15.4617C9.59248 15.6378 9.69143 15.8767 9.69143 16.1258C9.69143 16.3748 9.59248 16.6137 9.41636 16.7898C9.24024 16.966 9.00137 17.0649 8.7523 17.0649C8.50323 17.0649 8.26436 16.966 8.08824 16.7898L2.46324 11.1648C2.37584 11.0777 2.30649 10.9742 2.25917 10.8603C2.21186 10.7463 2.1875 10.6242 2.1875 10.5008C2.1875 10.3774 2.21186 10.2552 2.25917 10.1413C2.30649 10.0273 2.37584 9.92381 2.46324 9.83671L8.08824 4.21171C8.17544 4.1245 8.27897 4.05533 8.39291 4.00813C8.50685 3.96094 8.62897 3.93665 8.7523 3.93665C8.87563 3.93665 8.99775 3.96094 9.11169 4.00813C9.22563 4.05533 9.32916 4.1245 9.41636 4.21171C9.50357 4.29891 9.57275 4.40244 9.61994 4.51638C9.66714 4.63032 9.69143 4.75244 9.69143 4.87577C9.69143 4.9991 9.66714 5.12122 9.61994 5.23516C9.57275 5.3491 9.50357 5.45263 9.41636 5.53983L5.39136 9.56249H16.8757C17.1244 9.56249 17.3628 9.66126 17.5387 9.83708C17.7145 10.0129 17.8132 10.2514 17.8132 10.5Z"
              fill="#9098B4"
            />
          </svg>
        </button>
        <p class="f25w700 reset__checkout">Перейдите по ссылке в письме</p>
        <p class="reset__checkout-descr f14w500 c-bali">
          Отправили информацию по восстановлению пароля
          <br />
          на
          <span class="reset__checkout-item">{{ email }}</span>
        </p>
        <div class="reset__btn-wrapper">
          <button class="btn-reset reset__checkout-denied f14w500 c-dodger">
            Письмо не пришло?
          </button>
        </div>
      </div>
      <div class="video-block">
        <video-player
          src="/assets/demo1.mp4"
          poster="/assets/cover3.png"
          controls
          :loop="false"
          :volume="0.6"
          :width="442.5"
          style="height: 100%"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, watch } from 'vue'
  import { VideoPlayer } from '@videojs-player/vue'
  import { resetUser } from '~/utils/resetUser'
  import 'video.js/dist/video-js.css'

  const props = defineProps({
    initialEmail: {
      type: String,
      default: '',
    },
  })

  const step = ref(1)
  const email = ref(props.initialEmail || '')

  watch(
    () => props.initialEmail,
    value => {
      if (value) {
        email.value = value
      }
    },
  )
  const emailError = ref(null)

  function toFirstStep() {
    step.value = 1
  }

  const validateEmail = email => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailPattern.test(email)
  }

  const checkReset = () => {
    emailError.value = null

    let isValid = true // Добавил let для корректной локальной переменной

    if (!email.value) {
      emailError.value = 'Это поле обязательно для заполнения'
      isValid = false
    }

    if (email.value && !validateEmail(email.value)) {
      // Проверка только если email не пустой
      emailError.value = 'Введите корректный email'
      isValid = false
    }

    return isValid
  }

  async function toSecondStep() {
    if (!checkReset()) return

    const { data, error } = await resetUser(email.value)

    if (data) {
      step.value = 2 // Успешно, переходим на второй шаг
    } else if (error) {
      console.error('Ошибка восстановления:', error)

      // Обработка ошибок по статусу
      if (error.status === 422) {
        emailError.value = 'Ошибка валидации'
      } else if (error.status === 404) {
        emailError.value = 'Пользователь с таким email не найден'
      } else if (error.message === 'Token server not found') {
        emailError.value = 'Ошибка сервера, токен не найден'
      } else {
        emailError.value = 'Произошла ошибка, попробуйте снова'
      }
    }
  }
</script>

<style scoped>
  .reset {
    width: 100%;
  }

  .reset__first {
    box-sizing: border-box;
    width: 440px;
    max-width: 100%;
    margin: 0 auto;
    padding: 40px 48px 44px;
  }

  .reset__to-reg,
  .reset__to-send {
    border: 1px solid #edeff5;
    border-radius: 10px;
    background-color: #f4f6f8;
    padding: 8.5px 9px;
    display: flex;
    margin-bottom: 20px;
  }

  .reset__send {
    width: 100%;
    border: none;
    background-color: #5898ff;
    cursor: pointer;
  }

  .reset__title {
    margin-bottom: 10px;
    color: #2f353d;
    text-align: center;
    line-height: 1.2;
  }

  .reset__descr {
    margin-bottom: 32px;
    text-align: center;
    line-height: 1.4;
    font-weight: 300;
  }

  .reset__email {
    margin-bottom: 24px;
  }

  .reset__email-input {
    display: block;
    width: 100%;
  }

  .second-wrapper {
    display: flex;
    column-gap: 15px;
  }

  .reset__second {
    background-color: #ffffff;
    border-radius: 24px;
    padding: 48px 50px;
    padding-bottom: 96px;
    max-width: 442.5px;
  }

  .reset__checkout {
    text-align: center;
    margin-bottom: 11px;
    line-height: normal;
  }

  .reset__checkout-descr {
    text-align: center;
    margin-bottom: 35px;
    line-height: 150%;
  }

  .reset__btn-wrapper {
    justify-content: center;
    display: flex;
  }

  .reset__email-input + .error-message {
    display: inline-block;
    margin-top: 8px;
    margin-bottom: 0;
    font-size: 13px;
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
    background-image: url('../../assets/img/play-icon.svg');
    transition: opacity 0.3s ease-in-out;
  }

  :deep(.video-js .vjs-big-play-button:hover) {
    opacity: 0.5;
  }

  :deep(.video-js .vjs-big-play-button .vjs-icon-placeholder:before) {
    content: none;
  }

  :deep(.video-js) {
    border-radius: 15px;
  }
</style>
