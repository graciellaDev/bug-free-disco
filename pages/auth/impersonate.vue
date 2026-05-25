<template>
  <div class="body-page">
    <AuthLetterPattern />
    <div class="auth-stack">
      <div class="auth-container">
        <div class="enter active form impersonate-card">
          <p class="enter__title f25w700">Вход в кабинет</p>
          <p v-if="errorMessage" class="impersonate-error f14w400">{{ errorMessage }}</p>
          <p v-else class="enter__descr f14w400">Подключаем сессию…</p>
          <UiDotsLoader v-if="!errorMessage" class="impersonate-loader" />
          <NuxtLink v-if="errorMessage" to="/auth" class="auth-link f14w400">На страницу входа</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { getServerToken } from '~/utils/getServerToken';
  import { useUserStore } from '@/stores/user';

  definePageMeta({
    layout: 'blank',
    auth: false,
  });

  const route = useRoute();
  const errorMessage = ref('');

  onMounted(async () => {
    const token = String(route.query.token || '').trim();
    if (!token) {
      errorMessage.value = 'Не указан токен входа.';
      return;
    }

    const server = await getServerToken();
    if (!server.token) {
      errorMessage.value = server.error || 'Не удалось подключиться к API.';
      return;
    }

    const config = useRuntimeConfig();

    try {
      const response = await $fetch<{
        user: {
          auth_token: string;
          name: string;
          email: string;
          role: string;
        };
      }>(`${config.public.apiBase}/impersonate/consume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${server.token}`,
        },
        body: { token },
      });

      const user = response?.user;
      if (!user?.auth_token) {
        errorMessage.value = 'Не получены данные сессии клиента.';
        return;
      }

      const userTokenCookie = useCookie('auth_user');
      userTokenCookie.value = user.auth_token;

      const userStore = useUserStore();
      userStore.setUserData({
        name: user.name,
        email: user.email,
        role: user.role,
      });

      await navigateTo('/vacancies', { replace: true });
    } catch (err: unknown) {
      const e = err as {
        data?: { message?: string };
        response?: { _data?: { message?: string } };
        message?: string;
      };
      errorMessage.value =
        e?.data?.message ||
        e?.response?._data?.message ||
        e?.message ||
        'Не удалось войти в кабинет клиента.';
    }
  });
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

  .auth-container {
    width: 440px;
    max-width: calc(100% - 32px);
    margin: 0 auto;
  }

  .impersonate-card {
    box-sizing: border-box;
    width: 440px;
    max-width: 100%;
    background-color: #ffffff;
    border-radius: 24px;
    padding: 32px 28px;
    text-align: center;
  }

  .impersonate-error {
    color: #f50a0a;
    margin: 12px 0;
  }

  .impersonate-loader {
    margin-top: 20px;
  }

  .f25w700 {
    font-size: 25px;
    font-weight: 700;
    color: #2f353d;
    line-height: 1.2;
  }

  .f14w400 {
    font-size: 14px;
    font-weight: 400;
  }

  .enter__descr {
    color: #9098b4;
    margin-top: 8px;
  }

  .auth-link {
    display: inline-block;
    margin-top: 16px;
    color: #5898ff;
    text-decoration: underline;
  }
</style>
