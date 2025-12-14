// Функция для нормализации username (убирает @ в начале)
export const normalizeUsername = (value: string | null | undefined): string => {
  if (!value) return '';
  // Убираем @ в начале и пробелы
  return value.replace(/^@+/, '').trim();
};

// Функция для нормализации перед отправкой
export const prepareUsernameForApi = (
  value: string | null | undefined
): string | null => {
  if (!value) return null;
  const normalized = normalizeUsername(value);
  return normalized || null;
};
