// middleware/auth.global.ts
import {
  defineNuxtRouteMiddleware,
  navigateTo,
  useCookie,
  useRoute,
} from '#app';
// import type { RouteLocationNormalized } from '#app'; // Импортируем типы
import type { RouteLocationNormalized } from 'vue-router'; // Импортируем типы
import { profile as getProfile } from '~/utils/loginUser';
import { getServerToken } from '~/utils/getServerToken';

export default defineNuxtRouteMiddleware(
  async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
    // Пропускаем middleware во время prerendering (статическая генерация)
    if (import.meta.prerender) {
      return;
    }

    // Пропускаем middleware во время SSR build, если мы на сервере без клиента
    // Это предотвращает выполнение HTTP запросов к API во время сборки
    if (import.meta.server && import.meta.env.NODE_ENV === 'production') {
      return;
    }

    const tokenCookie = useCookie('auth_token');

    if (to.path === '/auth' || to.path.startsWith('/public')) {
      return;
    }

    // Проверка: токен отсутствует, пустой или null
    if (!tokenCookie?.value) {
      // Во время SSR на сервере не делаем редирект, только на клиенте
      if (import.meta.client) {
        return navigateTo('/auth');
      }
      return;
    } else {
      try {
        const {
          data: profileUser,
          error: profileError,
          status,
        } = await getProfile();
        
        // Если токен просрочен (401), пытаемся обновить его
        if (status === 401) {
          const tokenResult = await getServerToken();
          
          // Если не удалось обновить токен, редиректим на авторизацию
          if (!tokenResult.token) {
            if (import.meta.client) {
              return navigateTo('/auth');
            }
            return;
          }
          
          // Проверяем профиль с новым токеном
          const {
            data: profileUserUpdate,
            error: profileErrorUpdate,
            status: statusUpdate,
          } = await getProfile();
          
          // Если после обновления токена все еще 401, токен пользователя просрочен
          if (statusUpdate === 401) {
            if (import.meta.client) {
              return navigateTo('/auth');
            }
            return;
          }
          
          // Если токен успешно обновлен и профиль получен, продолжаем выполнение
          return;
        } else {
          // Токен валиден, продолжаем выполнение
          return;
        }
      } catch (error: any) {
        // Обработка ошибок сети/таймаута
        console.error('Ошибка в middleware auth:', error.message || error);

        // Если это ошибка сети или таймаут, не делаем редирект во время SSR
        if (
          error.code === 'ECONNREFUSED' ||
          error.code === 'ETIMEDOUT' ||
          error.name === 'TimeoutError'
        ) {
          console.warn(
            'API недоступен или таймаут. Пропускаем проверку авторизации.'
          );
          // Во время SSR просто продолжаем без проверки
          if (import.meta.server) {
            return;
          }
        }

        // Для других ошибок делаем редирект только на клиенте
        if (import.meta.client) {
          return navigateTo('/auth');
        }
      }
    }
  }
);
