import type { ApiSuccessResponse } from './clients';

export type Stage = {
  id: number;
  name: string;
  fixed?: number; // 0 или 1 (boolean в виде числа)
  position?: number;
  max_days?: number | null;
};

export type ApiStagesResponse = ApiSuccessResponse<Stage[]>;
