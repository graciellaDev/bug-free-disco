<script setup lang="ts">
import TextWithLinks from '~/components/custom/TextWithLinks.vue'
import { useCandidateCardContext } from '@/components/custom/page-parts/candidate/candidateCardContext'
import { formatExperienceWorkPeriod } from '@/utils/formatExperienceWorkPeriod'

const c = useCandidateCardContext()
</script>

<template>
  <div class="candidate-resume-tab-text [&>div:last-child]:rounded-b-fifteen">
        <div v-if="c.hasCoverLetter" class="mb-px bg-white p-25px pt-[27px]">
          <p class="mb-15px text-15px font-medium text-space">
            Сопроводительное письмо
          </p>
          <p class="break-words text-sm leading-150 text-slate-custom">
            <TextWithLinks :text="c.props.candidate.coverLetter || ''" />
          </p>
        </div>
        <div v-if="c.hasResumePositionBlock" class="mb-px bg-white p-25px">
          <div
            class="mb-15px flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
          >
            <p class="min-w-0 flex-1 text-15px font-medium leading-normal text-space">
              {{ c.props.candidate.quickInfo?.trim() || 'Должность' }}
            </p>
            <p
              v-if="c.resumeSalaryLine"
              class="shrink-0 text-right text-15px font-medium leading-normal text-space"
            >
              {{ c.resumeSalaryLine }}
            </p>
          </div>
          <p
            v-if="(c.props.candidate.specializations ?? '').toString().trim() !== ''"
            class="mb-3 text-sm font-normal leading-150"
          >
            <span class="text-slate-custom">Специализации: </span>
            <span class="text-space">{{ c.props.candidate.specializations }}</span>
          </p>
          <p
            v-if="(c.props.candidate.employment ?? '').toString().trim() !== ''"
            class="mb-3 text-sm font-normal leading-150"
          >
            <span class="text-slate-custom">Тип занятости: </span>
            <span class="text-space">{{ c.props.candidate.employment }}</span>
          </p>
          <p
            v-if="(c.props.candidate.workFormat ?? c.props.candidate.work_format ?? '').toString().trim() !== ''"
            class="text-sm font-normal leading-150"
          >
            <span class="text-slate-custom">Формат работы: </span>
            <span class="text-space">{{ c.props.candidate.workFormat || c.props.candidate.work_format }}</span>
          </p>
        </div>
        <div v-if="c.hasResumeExperienceBlock" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">
            Опыт работы: {{ c.experienceDisplay }}
          </p>
          <div class="space-y-5">
          <div
            v-for="(exp, idx) in c.experienceEntries"
            :key="exp.id ?? idx"
              class="experience-entry"
          >
            <div class="flex gap-4">
              <div class="experience-entry-dates w-[118px] shrink-0">
                <template
                  v-for="period in [formatExperienceWorkPeriod(exp)]"
                  :key="'exp-period-' + (exp.id ?? idx)"
                >
                  <template v-if="period">
                    <p class="text-sm font-normal leading-normal text-space">
                      {{ period.line1 }}
                    </p>
                    <p class="text-sm font-normal leading-normal text-space">
                      {{ period.line2 }}
                    </p>
                    <p
                      class="mt-0.5 text-xs font-normal leading-normal text-slate-custom"
                    >
                      {{ period.line3 }}
                    </p>
                  </template>
                  <template v-else>
                    <p class="text-sm font-normal text-slate-custom">
                      {{
                        exp.dates ||
                          [exp.start_date, exp.end_date]
                            .filter(Boolean)
                            .join(' – ') ||
                          '—'
                      }}
                    </p>
                    <p
                      v-if="exp.duration"
                      class="mt-0.5 text-xs font-normal text-slate-custom"
                    >
                      {{ exp.duration }}
                    </p>
                  </template>
                </template>
              </div>
              <div class="experience-entry-details min-w-0 flex-1">
                <div class="flex items-start justify-between gap-3">
                  <p class="min-w-0 flex-1 text-sm font-semibold leading-normal text-space">
                    {{ exp.company || '—' }}
                  </p>
                  <button
                    v-if="
                      exp.description &&
                      (c.expandedExperience[idx] ||
                        c.experienceDescOverflow[idx] === true)
                    "
                    type="button"
                    class="experience-toggle inline-flex shrink-0 items-center gap-1 pt-px text-sm font-normal leading-normal text-slate-custom hover:text-space"
                    @click="c.toggleExperience(idx)"
                  >
                    <span>{{ c.expandedExperience[idx] ? 'Свернуть' : 'Развернуть' }}</span>
                    <svg-icon
                      name="dropdown-arrow"
                      width="14"
                      height="14"
                      class="shrink-0 transition-transform duration-200"
                      :class="{ 'rotate-180': c.expandedExperience[idx] }"
                    />
                  </button>
                </div>
                <p v-if="exp.location" class="mt-0.5 text-sm font-normal text-space">
                  {{ exp.location }}
                </p>
                <p
                  v-if="exp.industry"
                  class="mt-0.5 text-sm font-normal text-space"
                >
                  {{ exp.industry }}
                </p>
                <p v-if="exp.job_title" class="mt-1.5 text-sm font-semibold text-space">
                  {{ exp.job_title }}
                </p>
                <p v-if="exp.role_dates" class="mt-0.5 text-sm font-normal text-space">
                  {{ exp.role_dates }}
                </p>
                <div
                  v-if="exp.description"
                  :ref="(el) => c.setExperienceDescriptionEl(el, idx)"
                  class="mt-1.5 text-sm font-normal leading-150 text-space"
                  :class="{ 'line-clamp-2': !c.expandedExperience[idx] }"
                >
                  <TextWithLinks :text="exp.description" />
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="c.hhSkillSetItems.length > 0" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Навыки</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(skill, index) in c.hhSkillSetItems"
              :key="`${skill}-${index}`"
              class="inline-flex items-center rounded-fifteen bg-athens-gray px-3 py-1.5 text-sm font-normal leading-normal text-space"
            >
              {{ skill }}
            </span>
        </div>
        </div>
        <div
          v-if="c.hhNativeLanguages.length > 0 || c.hhOtherLanguages.length > 0"
          class="mb-px bg-white p-25px"
        >
          <p class="mb-15px text-15px font-medium text-space">Языки</p>
          <div v-if="c.hhNativeLanguages.length > 0" class="mb-4">
            <p class="mb-2 text-sm font-normal text-slate-custom">Родной</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(lang, index) in c.hhNativeLanguages"
                :key="`${lang.name}-native-${index}`"
                class="inline-flex items-center rounded-fifteen bg-athens-gray px-3 py-1.5 text-sm font-normal leading-normal text-space"
              >
                {{ lang.name }}
              </span>
          </div>
          </div>
          <div v-if="c.hhOtherLanguages.length > 0">
            <p class="mb-2 text-sm font-normal text-slate-custom">Другие языки</p>
            <div class="flex flex-wrap gap-2">
            <span
                v-for="(lang, index) in c.hhOtherLanguages"
                :key="`${lang.name}-other-${index}`"
                class="inline-flex items-center rounded-fifteen bg-[#DFF3E8] px-3 py-1.5 text-sm font-normal leading-normal text-[#12A45C]"
              >
                {{ lang.name }}<span v-if="lang.level"> — {{ lang.level }}</span>
            </span>
          </div>
        </div>
        </div>
        <div v-if="c.hasAboutMeText" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">
            Обо мне
          </p>
          <p class="text-sm leading-150 text-slate-custom">
            <TextWithLinks :text="c.aboutMeDisplayText" />
          </p>
        </div>
        <div v-if="c.hhRecommendations.length > 0" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Рекомендации</p>
          <div class="space-y-4">
            <div
              v-for="(rec, index) in c.hhRecommendations"
              :key="`${rec.name}-${index}`"
            >
              <p class="text-sm font-medium leading-normal text-space">
                {{ rec.name }}
              </p>
              <p
                v-if="rec.position || rec.company"
                class="mt-1 text-sm font-normal leading-150 text-slate-custom"
              >
                {{ rec.position || '—' }}<span v-if="rec.company"> · {{ rec.company }}</span>
              </p>
              <p
                v-if="rec.text"
                class="mt-2 text-sm font-normal leading-150 text-slate-custom"
              >
                <TextWithLinks :text="rec.text" />
              </p>
            </div>
          </div>
        </div>
        <div v-if="c.hasResumeEducationBlock" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Образование</p>
          <p class="mb-1 text-sm font-normal text-slate-custom">Уровень</p>
          <p
            class="text-sm font-normal leading-150 text-space"
            :class="
              c.hhEducationPrimaryEntries.length > 0 || c.legacyEducationFallback ? 'mb-5' : ''
            "
          >
            {{ c.resumeEducationLevelLabel || '—' }}
          </p>
          <div v-if="c.hhEducationPrimaryEntries.length > 0" class="space-y-5">
            <div v-for="(edu, eduIdx) in c.hhEducationPrimaryEntries" :key="eduIdx">
              <p class="text-sm font-normal leading-150 text-space">
                {{ c.formatHhEducationLine1(edu) }}
              </p>
              <p
                v-if="c.formatHhEducationLine2(edu, c.resumeEducationLevelLabel)"
                class="mt-1 text-sm font-normal leading-150 text-slate-custom"
              >
                {{ c.formatHhEducationLine2(edu, c.resumeEducationLevelLabel) }}
            </p>
          </div>
          </div>
          <p
            v-else-if="c.legacyEducationFallback"
            class="text-sm font-normal leading-150 text-space"
          >
            {{ c.legacyEducationFallback }}
            </p>
          </div>
        <div v-if="c.hasCourseQualificationBlock" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">
            Курсы повышения квалификации
          </p>
          <div v-if="c.hhEducationAdditionalEntries.length > 0" class="space-y-5">
            <div
              v-for="(course, cIdx) in c.hhEducationAdditionalEntries"
              :key="course.id || String(cIdx)"
            >
              <p class="text-sm font-normal leading-150 text-space">
                {{ c.formatHhCourseTitleLine(course) }}
              </p>
              <p
                v-if="c.formatHhCourseSecondaryLine(course)"
                class="mt-1 text-sm font-normal leading-150 text-slate-custom"
              >
                <TextWithLinks :text="c.formatHhCourseSecondaryLine(course)" />
            </p>
          </div>
          </div>
          <template v-else>
            <p class="text-sm font-normal leading-150 text-space">
              {{ c.courseQualificationTitle || '—' }}
            </p>
            <p
              v-if="c.courseQualificationDetails"
              class="mt-1 text-sm font-normal leading-150 text-slate-custom"
            >
              <TextWithLinks :text="c.courseQualificationDetails" />
            </p>
          </template>
          </div>
        <div v-if="c.hhCertificateEntries.length > 0" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Сертификаты</p>
          <div class="space-y-5">
            <div
              v-for="(cert, certIdx) in c.hhCertificateEntries"
              :key="certIdx"
              class="min-w-0"
            >
              <div class="flex items-start justify-between gap-3">
                <p class="min-w-0 flex-1 text-sm font-normal leading-150 text-space">
                  <TextWithLinks :text="cert.title" />
                </p>
                <a
                  v-if="cert.url"
                  :href="cert.url"
                target="_blank"
                rel="noopener noreferrer"
                  class="shrink-0 text-sm font-normal text-slate-custom hover:text-dodger"
                >
                  Посмотреть &gt;
              </a>
          </div>
              <p
                v-if="cert.organization"
                class="mt-1 text-sm font-normal leading-150 text-slate-custom"
              >
                {{ cert.organization }}
              </p>
              <p
                v-if="cert.year"
                class="mt-1 text-xs font-normal leading-normal text-slate-custom"
              >
                {{ cert.year }}
            </p>
          </div>
        </div>
        </div>
        <div v-if="c.candidateResumeTestsEntries.length > 0" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Тесты</p>
          <div class="space-y-4">
            <div
              v-for="(test, testIdx) in c.candidateResumeTestsEntries"
              :key="testIdx"
              class="min-w-0"
            >
              <p class="text-sm font-normal leading-150 text-space">
                {{ test.name }}
              </p>
              <p
                v-if="c.formatTestScoreLine(test)"
                class="mt-1 text-sm font-normal leading-150 text-slate-custom"
              >
                {{ c.formatTestScoreLine(test) }}
              </p>
            </div>
          </div>
        </div>
        <div v-if="c.candidatePortfolioEntries.length > 0" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Портфолио</p>
          <div class="space-y-5">
            <div
              v-for="(pf, pfIdx) in c.candidatePortfolioEntries"
              :key="pfIdx"
              class="min-w-0"
            >
              <div class="flex items-start justify-between gap-3">
                <p class="min-w-0 flex-1 text-sm font-normal leading-150 text-space">
                  <TextWithLinks :text="pf.title" />
                </p>
                <a
                  v-if="pf.url"
                  :href="pf.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="shrink-0 text-sm font-normal text-slate-custom hover:text-dodger"
                >
                  Открыть &gt;
                </a>
              </div>
              <p
                v-if="pf.description"
                class="mt-1 text-sm font-normal leading-150 text-slate-custom"
              >
                <TextWithLinks :text="pf.description" />
              </p>
            </div>
          </div>
        </div>
        <div v-if="c.candidateAwardEntries.length > 0" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Награды</p>
          <div class="space-y-4">
            <div
              v-for="(aw, awIdx) in c.candidateAwardEntries"
              :key="awIdx"
              class="min-w-0"
            >
              <p class="text-sm font-normal leading-150 text-space">
                <TextWithLinks :text="aw.name" />
              </p>
              <p
                v-if="c.formatAwardSecondaryLine(aw)"
                class="mt-1 text-sm font-normal leading-150 text-slate-custom"
              >
                <TextWithLinks :text="c.formatAwardSecondaryLine(aw)" />
              </p>
            </div>
          </div>
        </div>
        <div v-if="c.hasAdditionalInfoSection" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Дополнительно</p>
          <ul class="list-none space-y-3 p-0">
            <li
              v-for="(row, rowIdx) in c.candidateAdditionalRowsFilled"
              :key="rowIdx"
              class="text-sm font-normal leading-150"
            >
              <span class="text-slate-custom">{{ row.label }}: </span>
              <span class="text-space">{{ row.value }}</span>
            </li>
          </ul>
        </div>
  </div>
</template>
