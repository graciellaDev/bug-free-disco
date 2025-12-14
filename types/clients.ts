// Общий тип успешного ответа
export type ApiSuccessResponse<T> = {
  message: string;
  data: T;
};

// Общий тип ошибки
export type ApiErrorResponse = {
  message: string;
  data?: null;
};
