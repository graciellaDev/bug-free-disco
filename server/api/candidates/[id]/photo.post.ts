import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export default defineEventHandler(async event => {
  console.log('=== Nuxt API Route вызван ===');
  console.log('Method:', event.method);
  console.log('URL:', event.path);
  console.log('Headers:', event.headers);

  setHeader(event, 'Access-Control-Allow-Origin', '*');
  setHeader(event, 'Access-Control-Allow-Methods', 'POST, OPTIONS');
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type');

  // Обработка preflight запроса
  if (event.method === 'OPTIONS') {
    return { status: 'ok' };
  }

  try {
    // Получаем ID кандидата из параметров
    const candidateId = getRouterParam(event, 'id');
    if (!candidateId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID кандидата не указан',
      });
    }

    // Получаем файл из FormData
    const formData = await readMultipartFormData(event);
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Файл не предоставлен',
      });
    }

    const file = formData.find(item => item.name === 'photo');
    if (!file || !file.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Файл с именем "photo" не найден',
      });
    }

    // Проверка типа файла
    if (!file.type?.startsWith('image/')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Файл должен быть изображением',
      });
    }

    // Проверка размера (5MB)
    if (file.data.length > 5 * 1024 * 1024) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Размер файла не должен превышать 5MB',
      });
    }

    // Определяем расширение файла
    const extension = file.filename?.split('.').pop() || 'jpg';
    const fileName = `candidate_${candidateId}_${Date.now()}.${extension}`;

    // Путь к папке для сохранения
    const publicDir = join(process.cwd(), 'public', 'img', 'fotos');

    // Создаем папку, если её нет
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
    }

    // Полный путь к файлу
    const filePath = join(publicDir, fileName);

    // Сохраняем файл
    await writeFile(filePath, file.data);

    // Возвращаем путь относительно public (для использования в img src)
    const imagePath = `/img/fotos/${fileName}`;

    return {
      success: true,
      imagePath,
    };
  } catch (error: any) {
    console.error('Ошибка при загрузке фото:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Ошибка при загрузке фото',
    });
  }
});
