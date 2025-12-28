import type { ApiSuccessResponse } from './clients';

export type Stage = {
  id: number;
  name: string;
  fixed: number; // 0 или 1 (boolean в виде числа)
};

export type ApiStagesResponse = ApiSuccessResponse<Stage[]>;
