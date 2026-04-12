/** Строка вакансии в отчёте «По рекрутерам». */
export interface RecruitersReportVacancyRow {
  vacancy_id: number;
  title: string;
  /** Например `active`, `on_pause` — UI показывает «На паузе» для паузы. */
  status: string;
  candidates_added_count: number;
  hired_count: number;
  hired_target: number;
  /** Доля к цели найма, %; если `null`, фронт считает от hired_count / hired_target. */
  hired_percentage: number | null;
  rejections_count: number;
  /** % от добавленных; если `null`, фронт считает от rejections_count / candidates_added_count. */
  rejections_percentage: number | null;
  avg_days_to_hire: number | null;
  avg_days_to_close: number | null;
}

/** Группа по рекрутеру. */
export interface RecruitersReportRecruiterRow {
  recruiter_id: number;
  name: string;
  position_title: string | null;
  vacancies_count: number;
  /** Суммарная цель по штату («N вакансий на M чел.»). */
  target_headcount: number;
  vacancies: RecruitersReportVacancyRow[];
}

export interface RecruitersReportData {
  date_from?: string;
  date_to?: string;
  recruiters: RecruitersReportRecruiterRow[];
}
