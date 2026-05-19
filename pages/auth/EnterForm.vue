<template>
  <div class="enter active form">
    <p class="enter__title f25w700">
      Вход в
      <span class="enter__title-custom">Наймикс</span>
    </p>
    <div class="enter__data">
      <p class="auth-field-label">Email</p>
      <label class="enter__email-wrapper">
        <input
          type="email"
          class="enter__email-input e-input f14w400"
          placeholder="Введите email"
          v-model="email"
          :class="{ error: emailError }"
        />
        <span
          v-if="emailError"
          class="error-message f12w400"
          style="color: red"
        >
          {{ emailError }}
        </span>
      </label>
      <div class="enter__pass-label-row">
        <p class="auth-field-label enter__pass-label">Пароль</p>
        <button
          type="button"
          class="auth-link enter__forgot"
          @click="$emit('changeForm', 'reset', email)"
        >
          Забыли пароль?
        </button>
      </div>
      <label class="enter__pass-wrapper">
        <input
          type="password"
          class="enter__pass-input e-input f14w400"
          placeholder="******"
          :type="showPassword ? 'text' : 'password'"
          v-model="password"
          :class="{ error: passwordError }"
        />
        <span
          v-if="passwordError"
          class="error-message f12w400"
          style="color: red"
        >
          {{ passwordError }}
        </span>
        <button type="button" class="pass-eye" @click="togglePassword"></button>
      </label>
    </div>
    <button class="btn-reset btn enter__btn-in f14w600 c-white" @click="login">
      Войти
    </button>
    <p v-if="authError" class="text-center text-red-custom mt-[-15px] text-sm">
      {{ authError }}
    </p>
  </div>
</template>

<script setup>
  import { ref, nextTick, watch } from 'vue'
  import { loginUser } from '~/utils/loginUser'
  import { navigateTo } from '#app'

  const props = defineProps({
    initialEmail: {
      type: String,
      default: '',
    },
  })

  const email = ref(props.initialEmail || '')

  watch(
    () => props.initialEmail,
    value => {
      if (value) {
        email.value = value
      }
    },
  )
  const password = ref('')
  const emailError = ref(null)
  const passwordError = ref(null)
  const showPassword = ref(false)
  const authError = ref(null)

  const togglePassword = () => {
    showPassword.value = !showPassword.value
    // Принудительное обновление типа через $nextTick
    nextTick(() => {
      const input = document.querySelector('.enter__pass-input')
      input.type = showPassword.value ? 'text' : 'password'

      // change eye icon
      const eyeButton = document.querySelector('.pass-eye')
      if (showPassword.value) {
        eyeButton.classList.add('show')
      } else {
        eyeButton.classList.remove('show')
      }
    })
  }

  const validateEmail = email => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailPattern.test(email)
  }

  const login = async () => {
    emailError.value = null
    passwordError.value = null
    authError.value = null

    let isValid = true

    if (!email.value) {
      emailError.value = 'Это поле обязательно для заполнения'
      isValid = false
    } else if (!validateEmail(email.value)) {
      emailError.value = 'Введите корректный email'
      isValid = false
    }

    if (!password.value) {
      passwordError.value = 'Это поле обязательно для заполнения'
      isValid = false
    } else if (password.value.length < 8) {
      passwordError.value = 'Пароль должен содержать не менее 8 символов'
      isValid = false
    }

    if (!isValid) return

    const { data, error } = await loginUser(email.value, password.value)
    console.log('result login:', { data, error })

    if (error) {
      authError.value = error
      return
    }

    if (data) {
      // Успешная авторизация, перенаправляем на главную страницу
      await navigateTo('/vacancies')
    }
  }
</script>

<style scoped>
  .enter {
    box-sizing: border-box;
    width: 440px;
    max-width: 100%;
    padding: 40px 48px 44px;
  }

  .enter__title {
    margin-bottom: 32px;
    text-align: center;
    line-height: 1.2;
    font-size: 27px;
  }

  .enter__pass-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .enter__pass-label-row .enter__pass-label {
    margin: 0;
  }

  .enter__forgot {
    flex-shrink: 0;
    font-size: 14px;
    font-weight: 500;
  }

  .enter__email-wrapper {
    display: block;
    margin-bottom: 20px;
  }

  .enter__email-input {
    display: block;
    width: 100%;
  }

  .enter__pass-wrapper {
    position: relative;
    display: block;
    margin-bottom: 24px;
  }

  .enter__pass-input {
    width: 100%;
    padding-right: 44px;
  }

  .enter__btn-in {
    width: 100%;
    margin-bottom: 20px;
  }

  .auth-link {
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    line-height: 100%;
    letter-spacing: 0;
    color: #5898ff;
    text-decoration: none;
    cursor: pointer;
    white-space: nowrap;
  }

  .auth-link:hover {
    color: #4680e6;
  }

  .error-message {
    display: inline-block;
    margin-top: 8px;
    margin-bottom: 0;
    font-size: 13px;
    color: #f50a0a;
  }

  .enter__pass-input.error + .error-message {
    margin-bottom: 0;
  }
</style>
