import type { Stage } from '@/types/funnels';

export function isRejectionStage(stage: { id?: number; name?: string } | null | undefined): boolean {
  if (!stage) return false;
  const name = (stage.name || '').trim();
  return (
    stage.id === 4
    || name === 'Отклоненные'
    || name === 'Отклонённые'
    || name === 'Отказ'
  );
}

export function isRejectionStageName(stageName: string): boolean {
  const name = stageName.trim();
  return (
    name === 'Отклоненные'
    || name === 'Отклонённые'
    || name === 'Отказ'
  );
}

export function findRejectionStage(stages: Stage[] | undefined | null): Stage | null {
  if (!stages?.length) return null;
  return stages.find(s => isRejectionStage(s)) ?? null;
}

export function vacancyUsesRejectionReasons(
  vacancy: { use_rejection_reasons?: boolean } | null | undefined
): boolean {
  return !!vacancy?.use_rejection_reasons;
}
