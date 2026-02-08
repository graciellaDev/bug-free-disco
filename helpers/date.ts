export const dateStringToDots = (dateString: string) => {
  const date = new Date(dateString);
  let options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  };
  return date.toLocaleString('ru', options);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

export const formatDateOnly = (iso: string): string => {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

// Конвертация из формата Y-m-d (2024-12-25) в d.m.Y (25.12.2024)
export const convertDateFromApi = (
  dateString: string | null | undefined
): string | null => {
  if (!dateString) return null;

  // Преобразуем в строку, если это не строка
  const dateStr = String(dateString);

  // Проверяем, что дата в формате Y-m-d
  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return `${day}.${month}.${year}`;
  }

  // Если дата уже в формате d.m.Y, возвращаем как есть
  return dateStr;
};

// Конвертация из формата d.m.Y (25.12.2024) в Y-m-d (2024-12-25)
export const convertDateToApi = (
  dateString: string | null | undefined
): string | null => {
  if (!dateString) return null;

  // Преобразуем в строку, если это не строка
  const dateStr = String(dateString);

  // Проверяем, что дата в формате d.m.Y
  const dateMatch = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    return `${year}-${month}-${day}`;
  }

  // Если дата уже в формате Y-m-d, возвращаем как есть
  return dateStr;
};
