// middleware/auth.global.ts
import {
  defineNuxtRouteMiddleware,
  navigateTo,
  useCookie,
} from '#app';
import type { RouteLocationNormalized } from 'vue-router';
import { clearAuthTokens } from '~/helpers/authToken';
import { profile as getProfile } from '~/utils/loginUser';
import { getServerToken } from '~/utils/getServerToken';

const redirectToLogin = () => {
  clearAuthTokens();
  return navigateTo('/auth', { replace: true });
};

const isPublicAuthRoute = (path: string, metaAuth: unknown) =>
  metaAuth === false ||
  path === '/auth' ||
  path.startsWith('/auth/') ||
  path.startsWith('/public');

export default defineNuxtRouteMiddleware(
  async (to: RouteLocationNormalized) => {
    if (import.meta.prerender) {
      return;
    }

    if (import.meta.server && import.meta.env.NODE_ENV === 'production') {
      return;
    }

    const tokenCookie = useCookie('auth_token');
    const userCookie = useCookie('auth_user');
    const hasServerToken = Boolean(tokenCookie?.value);
    const hasUserToken = Boolean(userCookie?.value);
    const hasFullSession = hasServerToken && hasUserToken;

    if (isPublicAuthRoute(to.path, to.meta.auth)) {
      if (to.path === '/auth' && import.meta.client && hasFullSession) {
        const { status } = await getProfile();
        if (status === 200) {
          return navigateTo('/vacancies', { replace: true });
        }
        if (status === 401) {
          clearAuthTokens();
        }
      }
      return;
    }

    if (to.path === '/' && hasFullSession) {
      return navigateTo('/vacancies', { replace: true });
    }

    if (!hasServerToken || !hasUserToken) {
      if (import.meta.client) {
        return redirectToLogin();
      }
      return;
    }

    try {
      const { status } = await getProfile();

      if (status === 200) {
        return;
      }

      if (status !== 401) {
        return;
      }

      const tokenResult = await getServerToken();
      if (!tokenResult.token) {
        if (import.meta.client) {
          return redirectToLogin();
        }
        return;
      }

      const { status: statusAfterRefresh } = await getProfile();
      if (statusAfterRefresh === 401) {
        if (import.meta.client) {
          return redirectToLogin();
        }
        return;
      }
    } catch (error: unknown) {
      const err = error as { code?: string; name?: string; message?: string };
      console.error('Ошибка в middleware auth:', err.message || error);

      if (
        err.code === 'ECONNREFUSED' ||
        err.code === 'ETIMEDOUT' ||
        err.name === 'TimeoutError'
      ) {
        console.warn(
          'API недоступен или таймаут. Пропускаем проверку авторизации.'
        );
        if (import.meta.server) {
          return;
        }
      }

      if (import.meta.client) {
        return redirectToLogin();
      }
    }
  }
);
