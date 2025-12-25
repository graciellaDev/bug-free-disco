<script setup lang="ts">
  import { ref } from 'vue';
  import BtnTab from '~/components/custom/BtnTab.vue';
  import type { Candidate } from '@/types/candidates';
  import MyInputSecond from '~/components/custom/MyInputSecond.vue';
  import PhoneInputSecond from '~/components/custom/PhoneInputSecond.vue';
  import FileUpload from '~/components/custom/FileUpload.vue';
  import MinDropdownSecond from '~/components/custom/MinDropdownSecond.vue';
  import MoreQuestions from '~/components/custom/MoreQuestions.vue';
  import Timeline from '~/components/timeline/index.vue';
  import ChatInput from '~/components/chat/ChatInput.vue';
  import { useForms } from '~/stores/forms';

  // import UiButton from '~/components/ui/UiButton.vue';

  const newName = ref('');
  const newEmail = ref('');
  const newPhone = ref('');
  const newHeader = ref('');
  const newLocation = ref('');
  const newEducation = ref('');
  const newExperience = ref('');
  const uploadPhoto = ref(null);
  const uploadResume = ref(null);
  const uploadLetter = ref(null);
  const newPosition = ref(null);
  const newCustomFirst = ref('');
  const newCustomSecond = ref('');
  const newCustomThird = ref('');
  const questions = ref([]);
  const answers = ref([]);

  const formsStore = useForms();

  const activeTab = ref('resume'); // Начальный таб

  const tabs = [
    { label: 'Резюме', value: 'resume' },
    // { label: 'Поля', value: 'fields' },
    { label: 'Общение', value: 'chat', notification: '+1' },
    // { label: 'Рассмотрения', value: 'review' },
  ];

  const positions = [
    {
      id: 'position_1',
      name: '1 разряд',
    },
    {
      id: 'position_2',
      name: '2 разряд',
    },
    {
      id: 'position_3',
      name: '3 разряд 3 разряд',
    },
    {
      id: 'position_4',
      name: '4 разряд',
    },
    {
      id: 'position_5',
      name: '5 разряд',
    },
  ];

  const dropdownOptions = ['Опция 1', 'Опция 2', 'Опция 3'];

  // const timelineGroups = ref<TimelineGroup[]>([]);
  const timelineGroups = ref([]);

  // const timelineGroups = ref([
  //   {
  //     date: '13/12/2025',
  //     events: [
  //       {
  //         id: 1,
  //         type: 'system',
  //         time: '18.01.2024 15:04',
  //         content: 'создан кандидат Анатольев Дмитрий Корсаров',
  //       },
  //       {
  //         id: 2,
  //         type: 'system',
  //         time: '18.01.2024 15:04',
  //         content:
  //           'кандидат Анатольев Дмитрий Корсаров откликнулся на вакансию Консультант продавцов',
  //       },
  //       {
  //         id: 3,
  //         type: 'system',
  //         time: '18.01.2024 15:04',
  //         content:
  //           'Перемещение на этап Подумать пользователем Анатолий Семенов',
  //       },
  //     ],
  //   },
  //   {
  //     date: 'Сегодня',
  //     events: [
  //       {
  //         id: 4,
  //         type: 'call',
  //         calls: [
  //           {
  //             time: '18.01.2024 15:04',
  //             candidateName: 'Марго Роби',
  //           },
  //           {
  //             time: '18.01.2024 15:04',
  //             candidateName: 'Марго Роби',
  //           },
  //         ],
  //       },
  //       {
  //         id: 5,
  //         type: 'note',
  //         time: '18.01.2024 15:04',
  //         author: 'Анатолий Семенов',
  //         content:
  //           'Кандидат утверждает что у него есть знакомые которые работали в компании и отзываются не очень хорошо, но самому ему все нравится. Ему нужно время подумать.',
  //       },
  //       {
  //         id: 6,
  //         type: 'task',
  //         time: '18.01.2024 15:04',
  //         user: 'Анатолий Семенов',
  //         title: 'Интервью с кандидатом',
  //         scheduled: '13/02/2024 в 13:30',
  //       },
  //       {
  //         id: 7,
  //         type: 'email',
  //         emails: [
  //           {
  //             time: '18.01.2024 15:04',
  //             direction: 'входящее',
  //             from: 'Анатолий Семенов',
  //             to: 'Марго Роби',
  //             subject: 'Реквизиты компании',
  //             content: `Здравствуйте, [Имя клиента]! Для завершения оформления документов нам необходимо уточнить ваши реквизиты. Пожалуйста, отправьте следующую информацию: [Запрашиваемые данные, например: название организации, ИНН, расчётный счёт и т.д.] Если у вас возникнут вопросы, буду рад помочь! Спасибо за оперативность. С уважением, [Ваше имя] [Ваша должность] [Контактные данные]`,
  //           },
  //           {
  //             time: '18.01.2024 15:04',
  //             direction: 'входящее',
  //             from: 'Марго Роби',
  //             to: 'Анатолий Семенов',
  //             status: 'Доставлено',
  //             subject: 'Реквизиты компании',
  //             content: `Благодарю за обращение. Вот реквизиты нашей компании: Название организации: [Название] ИНН: [Ваш ИНН] КПП: [Ваш КПП] Расчётный счёт: [Ваш счёт] Банк: [Название банка] БИК: [Ваш БИК] Корреспондентский счёт: [Ваш корр. счёт] Если потребуется дополнительная информация, пожалуйста, дайте знать. С уважением, [Имя клиента] [Должность, если есть] [Контактные данные] [Запрашиваемые данные, например: название организации, ИНН, расчётный счёт и т.д.] Если у вас возникнут вопросы, буду рад помочь! Спасибо за оперативность. С уважением, [Ваше имя] [Ваша должность] [Контактные данные]`,
  //           },
  //         ],
  //       },
  //       {
  //         id: 8,
  //         type: 'email',
  //         emails: [
  //           {
  //             time: '18.01.2024 15:04',
  //             direction: 'входящее',
  //             from: 'Марго Роби',
  //             to: 'Анатолий Семенов',
  //             subject: 'Другая тема письма',
  //             content: `Здравствуйте, [Имя клиента]! Для завершения оформления документов нам необходимо уточнить ваши реквизиты. Пожалуйста, отправьте следующую информацию: [Запрашиваемые данные, например: название организации, ИНН, расчётный счёт и т.д.] Если у вас возникнут вопросы, буду рад помочь! Спасибо за оперативность. С уважением, [Ваше имя] [Ваша должность] [Контактные данные]`,
  //           },
  //         ],
  //       },
  //       {
  //         id: 9,
  //         type: 'hh_chat',
  //         time: '18.01.2024 15:04',
  //         author: 'Марго Роби',
  //         company: 'ООО КОМПАНИЯ',
  //         content: 'Здравствуйте! Посмотрите пожалуйста мой отклик',
  //         initials: 'СК',
  //       },
  //       {
  //         id: 10,
  //         type: 'telegram',
  //         time: '18.01.2024 15:04',
  //         author: 'Марго Роби',
  //         content:
  //           'Здравствуйте, как думаете, с моими скиллами какие у меня есть шансы попасть к вам на работу?',
  //         initials: 'МР',
  //       },
  //       {
  //         id: 11,
  //         type: 'whatsapp',
  //         time: '18.01.2024 15:04',
  //         author: 'Марго Роби',
  //         content:
  //           'Здравствуйте, как думаете, с моими скиллами какие у меня есть шансы попасть к вам на работу?',
  //         initials: 'МР',
  //       },
  //       {
  //         id: 12,
  //         type: 'comment',
  //         time: '18.01.2024 15:04',
  //         author: 'Марго Роби',
  //         content:
  //           'Коллеги, кандидат не плохой, давайте рассмотрим его под микроскопом?',
  //         initials: 'АС',
  //       },
  //     ],
  //   },
  // ]);

  // function sanitazeCandidate(data) {
  //   if (!data) return null;

  //   let address = data?.area.name ? `г. ${data?.area.name}` : '';
  //   address += data?.metro?.name ? `, м. ${data.metro.name}` : '';

  //   return {
  //     id: data.id ?? null,
  //     created: data.created_at ?? null,
  //     age: data.age ?? null,
  //     firstName: data.first_name ?? '',
  //     surname: data.last_name ?? '',
  //     patronymic: data.patronymic ?? '',
  //     email: data.contact
  //       ? data.contact.find(function (value) {
  //           return value.kind === 'email';
  //         })?.contact_value
  //       : '',
  //     phone: data.contact
  //       ? data.contact.find(function (value) {
  //           return value.kind === 'phone';
  //         })?.contact_value
  //       : '',
  //     location: data?.area.name ?? '',
  //     vacancy: data.title ?? '',
  //     gender: data.gender.name ?? '',
  //     status: data.status ?? '',
  //     skills: data.skill_set ?? [],
  //     experience: data.experience ?? '',
  //     skype: data.skype ?? '',
  //     telegram: data.telegram ?? '',
  //     tags: data.tags ?? '',
  //     quickInfo: data.quickInfo ?? '',
  //     education: data.education ?? '',
  //     attachedFiles: data.attachments ?? [],
  //     links: [
  //       // 'www.testlink-null.com',
  //       // 'www.testlink-one.com',
  //       // 'www.testlink-second.com',
  //     ],
  //     header: data.title ?? '',
  //     locationFull: address,
  //     educationLevel: data.education.level.name ?? '',
  //     resumeDownloadLink: data.resumeDownloadLink ?? '',
  //     coverLetter: data.coverPath ?? '',
  //     comments: data.comments ?? [],
  //     timeline: data.timeline ?? [],
  //     customFields: data.customFields ?? null,
  //     customer: data.customer ?? null,
  //     icon: data.icon ?? null,
  //     photo: data.photo?.medium !== null ? data.photo?.medium : null,
  //   };
  // }

  const props = defineProps<{
    candidate: Candidate;
  }>();

  interface ChatMessage {
    format: string;
    message: string;
    attachments: File[];
    recipient: string;
  }

  const handleChatSend = (messageData: ChatMessage) => {
    console.log('Получены данные в родительском компоненте:', messageData);
    return messageData;
    // TODO: Implement message sending logic
  };
</script>

<template>
  <div>
    <div class="mb-px rounded-t-fifteen bg-catskill px-25px py-15px">
      <BtnTab :tabs="tabs" v-model="activeTab" />
    </div>
    <div>
      <div v-if="activeTab === 'resume'">
        <div class="mb-px bg-white p-25px pt-[27px]">
          <p class="mb-15px text-15px font-medium text-space">
            Краткие сведения
          </p>
          <p class="text-sm leading-150 text-slate-custom">
            {{ candidate.quickInfo }}
          </p>
        </div>
        <div class="mb-px bg-white p-25px">
          <p class="mb-4 text-15px font-medium text-space">Образование</p>
          <p class="mb-8 text-sm text-slate-custom">
            {{ candidate.education }}
          </p>
          <!-- <ul v-if="candidate?.education?.primary && candidate?.education?.primary?.length > 0">
                <li
                  v-for="(item, index) in candidate.education.primary"
                  :key="index"
                  class="mb-4 text-sm text-slate-custom"
                >
                  {{ item.name }}
                  <p class="text-xs">
                    <span v-if="item.university_acronym">
                      {{ item.university_acronym }},
                    </span>
                    <span v-if="item.organization">
                      {{ item.organization }},
                    </span>
                    <span v-if="item.result">{{ item.result }},</span>
                    <span v-if="item.year">{{ item.year }}</span>
                  </p>
                </li>
              </ul> -->
        </div>
        <div class="mb-px bg-white p-25px">
          <p class="mb-4 text-15px font-medium text-space">
            Курсы повышения квалификации
          </p>
          <!-- <p class="mb-8 text-sm text-slate-custom">
                {{ candidate.education.additional.name }}
              </p> -->
          <!-- <ul v-if="candidate.education.additional.length > 0">
                <li
                  v-for="(item, index) in candidate.education.additional"
                  :key="index"
                  class="mb-4 text-sm text-slate-custom"
                >
                  {{ item.name }}
                  <p class="text-xs">
                    <span v-if="item.organization">
                      {{ item.organization }},
                    </span>
                    <span v-if="item.result">{{ item.result }},</span>
                    <span v-if="item.year">{{ item.year }}</span>
                  </p>
                </li>
              </ul> -->
        </div>
        <div class="mb-px bg-white p-25px">
          <p class="mb-3.5 text-15px font-medium text-space">Навыки</p>
          <div>
            <div v-if="candidate?.skills && candidate?.skills?.length === 0">
              <p class="text-sm font-normal text-slate-custom">
                Кандидат не указал навыки
              </p>
            </div>
            <div v-else class="flex flex-wrap gap-5px">
              <span
                v-for="(skill, index) in candidate?.skills"
                :key="index"
                class="max-h-[27px] whitespace-nowrap rounded-plus bg-athens-gray px-[10.56px] py-5px text-13px font-normal text-space"
              >
                {{ skill }}
              </span>
            </div>
          </div>
        </div>
        <div class="mb-px bg-white p-25px pb-[23px] pt-27px">
          <p class="mb-15px text-15px font-medium text-space">
            Прикрепленные файлы
          </p>
          <div
            v-if="
              candidate?.attachments && candidate?.attachments?.length === 0
            "
          >
            <p class="text-sm font-normal text-slate-custom">
              Кандидат не прикрепил файлы
            </p>
          </div>
          <div v-else class="flex gap-25px">
            <div
              v-for="file in candidate?.attachments"
              :key="file.id"
              class="max-w-[100px]"
            >
              <a :href="file.link" target="_blank">
                <span
                  class="mb-9px flex h-[100px] w-[100px] items-center justify-center rounded-b-fifteen rounded-tl-fifteen rounded-tr-[35px] bg-zumthor text-sm font-medium uppercase text-dodger"
                >
                  {{ 'file.type' }}
                </span>
                <div class="flex">
                  <span class="truncate text-sm font-medium text-dodger">
                    {{ 'file.name' }}
                  </span>
                  <span class="text-sm font-medium text-dodger">
                    .{{ 'file.type' }}
                  </span>
                </div>
              </a>
            </div>
          </div>
        </div>
        <div class="rounded-b-fifteen bg-white p-25px">
          <p class="mb-4 text-15px font-medium text-space">Ссылки</p>
          <div>
            <p class="text-sm font-normal text-slate-custom">
              {{
                candidate.link
                  ? candidate.link
                  : 'Кандидат не поделился ссылками'
              }}
            </p>
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'fields'">
        <div class="mb-px bg-white p-25px pb-[37px] pl-30px">
          <div class="mb-22px flex items-center">
            <p class="mr-2.5 text-lg font-bold leading-normal text-space">
              Форма отклика
            </p>
            <span
              class="h-fit rounded-fifteen bg-feta px-2.5 py-[3.5px] text-xs font-normal"
            >
              Заполнено
            </span>
          </div>
          <div class="mb-5 flex gap-2.5">
            <p class="min-w-[250px] text-sm font-normal text-space">
              Фамилия Имя Отчество
            </p>
            <p class="text-sm font-normal leading-150 text-space">
              {{ candidate.surname }} {{ candidate.firstname }}
              {{ candidate.patronymic || '' }}
            </p>
          </div>
          <div v-if="candidate.age" class="mb-5 flex gap-2.5">
            <p class="min-w-[250px] text-sm font-normal text-space">Возраст</p>
            <p class="text-sm font-normal leading-150 text-space">
              {{ candidate.age }}
              {{
                [0, 5, 6, 7, 8, 9].includes(candidate.age % 10) ? 'лет' : 'года'
              }}
            </p>
          </div>
          <div class="mb-5 flex gap-2.5">
            <p class="min-w-[250px] text-sm font-normal text-space">
              Электронная почта
            </p>
            <p class="text-sm font-normal leading-150 text-space">
              {{ candidate.email }}
            </p>
          </div>
          <div class="mb-5 flex gap-2.5">
            <p class="min-w-[250px] text-sm font-normal text-space">Телефон</p>
            <p class="text-sm font-normal leading-150 text-space">
              {{ candidate.phone }}
            </p>
          </div>
          <div class="mb-5 flex gap-2.5">
            <p class="min-w-[250px] text-sm font-normal text-space">
              Заголовок
            </p>
            <p class="text-sm font-normal leading-150 text-space">
              <!-- {{ candidate.header }} -->
            </p>
          </div>
          <div class="mb-5 flex gap-2.5">
            <p class="min-w-[250px] text-sm font-normal text-space">
              Адрес проживания
            </p>
            <p class="text-sm font-normal leading-150 text-space">
              {{ candidate.location }}
            </p>
          </div>
          <div class="mb-5 flex gap-2.5">
            <p class="min-w-[250px] text-sm font-normal text-space">
              Образование
            </p>
            <p class="text-sm font-normal leading-150 text-space">
              {{ candidate.education }}
            </p>
          </div>
          <div class="mb-5 flex gap-2.5">
            <p class="min-w-[250px] text-sm font-normal text-space">
              Опыт работы
            </p>
            <!-- <ul
                  v-if="candidate.experience && candidate.experience?.length > 0"
                  class="text-sm font-normal leading-150 text-space"
                >
                  <li
                    class="mb-5"
                    v-for="(exp, index) in candidate.experience"
                    :key="index"
                  >
                    <div
                      class="mb-7px text-13px font-normal leading-normal text-slate-custom"
                    >
                      <p
                        class="mb-7px text-13px font-normal leading-normal text-slate-custom"
                      >
                        {{ exp?.start ? dateStringToDots(exp?.start) : '' }} -
                        {{
                          exp?.end
                            ? dateStringToDots(exp?.start)
                            : 'по настоящее время'
                        }}
                      </p>
                      <p
                        v-if="exp.employer !== null"
                        class="flex items-center gap-2"
                      >
                        <img
                          v-if="exp.employer?.logo_urls"
                          :src="exp.employer.logo_urls[90]"
                          width="40"
                        />
                        <a
                          v-if="exp.employer?.alternate_url"
                          class="text-dodger"
                          :href="exp.employer.alternate_url"
                          target="_blank"
                        >
                          {{ exp?.employer.name }}
                        </a>
                      </p>
                    </div>
                    <p
                      class="mb-2 text-sm font-medium leading-normal text-space underline"
                    >
                      {{ exp?.position }}
                    </p>
                    <template v-if="exp?.description.split('\n').length > 0">
                      <p
                        v-for="(description, index) in exp?.description.split(
                          '\n'
                        )"
                        :key="index"
                        class="text-sm font-normal text-space"
                      >
                        {{ description }}
                      </p>
                    </template>
                  </li>
                </ul> -->
          </div>
          <div class="mb-5 flex gap-2.5">
            <p class="min-w-[250px] text-sm font-normal text-space">
              Загрузка резюме
            </p>
            <!-- <a
                  :href="candidate.resumeDownload"
                  target="_blank"
                  class="text-sm font-normal text-dodger"
                >
                  {{
                    candidate.resumeDownload?.split('/').pop() ??
                    'Резюме не загружено'
                  }}
                </a> -->
          </div>
          <div class="flex gap-2.5">
            <p class="min-w-[250px] text-sm font-normal text-space">
              Сопроводительное письмо
            </p>
            <!-- <a
                  :href="candidate.coverLetter"
                  target="_blank"
                  class="text-sm font-normal text-dodger"
                >
                  {{
                    candidate.coverLetter?.split('/').pop() ??
                    'Файл не загружен'
                  }}
                </a> -->
          </div>
        </div>
        <div class="mb-px bg-white p-25px pl-30px">
          <div class="mb-2.5 flex items-center">
            <p class="mr-2.5 text-lg font-bold leading-normal text-space">
              Анкета
            </p>
            <span
              class="h-fit rounded-fifteen bg-serenade px-2.5 py-[3.5px] text-xs font-normal"
            >
              Отправлено, ожидает заполнения
            </span>
          </div>
          <div class="mb-0.5 flex items-center gap-2.5">
            <p class="min-w-[235px] text-sm font-normal text-space">
              Фамилия Имя Отчество
            </p>
            <MyInputSecond v-model="newName" />
          </div>
          <div class="mb-0.5 flex items-center gap-2.5">
            <p class="min-w-[235px] text-sm font-normal text-space">
              Электронная почта
            </p>
            <MyInputSecond v-model="newEmail" type="email" />
          </div>
          <div class="flex items-center gap-2.5">
            <p class="min-w-[235px] text-sm font-normal text-space">Телефон</p>
            <PhoneInputSecond v-model="newPhone" />
          </div>
          <div class="flex items-center gap-2.5">
            <p class="min-w-[235px] text-sm font-normal text-space">
              Заголовок
            </p>
            <MyInputSecond v-model="newHeader" />
          </div>
          <div class="mb-0.5 flex items-center gap-2.5">
            <p class="min-w-[235px] text-sm font-normal text-space">
              Адрес проживания
            </p>
            <MyInputSecond v-model="newLocation" />
          </div>
          <div class="mb-0.5 flex items-center gap-2.5">
            <p class="min-w-[235px] text-sm font-normal text-space">
              Образование
            </p>
            <MyInputSecond v-model="newEducation" />
          </div>
          <div class="flex items-center gap-2.5">
            <p class="min-w-[235px] text-sm font-normal text-space">
              Опыт работы
            </p>
            <MyInputSecond v-model="newExperience" />
          </div>
          <div class="mb-0.5">
            <FileUpload
              label="Фото"
              inputId="photo"
              @update:file="uploadPhoto = $event"
            />
          </div>
          <div>
            <FileUpload
              label="Загрузка резюме"
              inputId="resume"
              @update:file="uploadResume = $event"
            />
          </div>
          <div>
            <FileUpload
              label="Сопроводительное письмо"
              inputId="letter"
              @update:file="uploadLetter = $event"
            />
          </div>
        </div>
        <div class="bg-white p-25px pl-30px">
          <div class="mb-26px flex items-center">
            <p class="mr-2.5 text-lg font-bold leading-normal text-space">
              Пользовательские поля
            </p>
            <span
              class="h-fit rounded-fifteen bg-athens-gray px-2.5 py-[3.5px] text-xs font-normal"
            >
              Используется в системе
            </span>
          </div>
          <div class="flex items-center gap-2.5">
            <p class="min-w-[240px] text-sm font-normal text-space">Разряд</p>
            <MinDropdownSecond :options="positions" v-model="newPosition" />
          </div>
          <div class="mb-0.5 flex items-center gap-2.5">
            <p class="min-w-[240px] text-sm font-normal text-space">Раз</p>
            <MyInputSecond v-model="newCustomFirst" />
          </div>
          <div class="mb-0.5 flex items-center gap-2.5">
            <p class="min-w-[240px] text-sm font-normal text-space">Два</p>
            <MyInputSecond v-model="newCustomSecond" />
          </div>
          <div class="flex items-center gap-2.5">
            <p class="min-w-[240px] text-sm font-normal text-space">Три</p>
            <MyInputSecond v-model="newCustomThird" />
          </div>
          <!-- <div
                v-for="(q, idx) in questions"
                :key="q.id"
                class="flex items-center gap-2.5"
              >
                <div v-if="q.type === 'Поле для ввода в одну строку'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <MyInput
                    :placeholder="'Введите ваш ответ'"
                    v-model="answers[idx]"
                  />
                </div>
                <div v-if="q.type === 'Поле для ввода в несколько строк'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <MyTextarea
                    :maxHeight="100"
                    :placeholder="'Введите ваш ответ'"
                    v-model="answers[idx]"
                  />
                </div>
                <div v-if="q.type === 'Выпадающий список (один выбор)'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <MyDropdown
                    :defaultValue="'Выберите вариант ответа'"
                    :options="q.options"
                    v-model="answers[idx]"
                  />
                </div>
                <div
                  v-if="q.type === 'Мультисписок (вопрос с вариантами ответа)'"
                >
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <MultiSelect :options="q.options" v-model="answers[idx]" />
                </div>
                <div v-if="q.type === 'Время (выбор времени)'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <ChooseTime v-model="answers[idx]" />
                </div>
                <div v-if="q.type === 'Дата (выбор даты)'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <DropdownCalendarStatic
                    :is-open="isOpenDate"
                    @isOpen="isOpenCalendar"
                    v-model="answers[idx]"
                  />
                </div>
                <div v-if="q.type === 'Дата (срок)'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <div class="flex gap-x-15px">
                    <DropdownCalendarStatic
                      :is-open="isOpenDateFrom"
                      @isOpen="isOpenCalendarFrom"
                      v-model="answers[idx + '_from']"
                      :dateFrom="true"
                    />
                    <DropdownCalendarStatic
                      :is-open="isOpenDateTo"
                      @isOpen="isOpenCalendarTo"
                      v-model="answers[idx + '_to']"
                      :dateTo="true"
                    />
                  </div>
                </div>
                <div v-if="q.type === 'Ссылка'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <MyInput :placeholder="'https://'" v-model="answers[idx]" />
                </div>
                <div v-if="q.type === 'Адрес'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <geo-input v-model="answers[idx]" />
                </div>
                <div v-if="q.type === 'Файл'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <InputUpload v-model="answers[idx]" :minStyle="true" />
                </div>
                <div v-if="q.type === 'Чекбокс'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <div class="[&>*:not(:last-child)]:mb-2.5">
                    <CheckboxGroup
                      :options="
                        q.options.map(opt => ({ label: opt, value: opt }))
                      "
                      v-model="answers[idx]"
                    />
                  </div>
                </div>
              </div> -->
          <button class="mt-25px flex items-center gap-x-5px">
            <MoreQuestions
              v-model:modelValue="questions"
              texButton="Добавить"
            />
          </button>
        </div>
        <div class="rounded-b-fifteen bg-white px-15px pb-25px">
          <div>
            <UiButton class="mr-15px" variant="semiaction" size="semiaction">
              Сохранить изменения
            </UiButton>
            <UiButton variant="back" size="back">Отмена</UiButton>
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'chat'">
        <div>
          <Timeline :timeline-groups="timelineGroups" />
          <ChatInput
            :initial-recipient="`${candidate.firstname} ${candidate.surname}`"
            @send="handleChatSend"
          />
        </div>
      </div>
      <div v-if="activeTab === 'review'">Рассмотрения</div>
    </div>
  </div>
</template>
