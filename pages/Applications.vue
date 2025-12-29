<script setup>
  import {
    ref,
    computed,
    onMounted,
    onUnmounted,
    onBeforeUnmount,
    nextTick,
    watch,
  } from 'vue';
  import dayjs from 'dayjs';
  import ResponseInput from '~/components/custom/ResponseInput.vue';
  import DotsDropdown from '~/components/custom/DotsDropdown.vue';
  import Popup from '~/components/custom/Popup.vue';
  import SimpleInput from '~/components/custom/SimpleInput.vue';
  import InputCalendar from '~/components/custom/InputCalendar.vue';
  import BtnResponseInput from '~/components/custom/BtnResponseInput.vue';
  import BtnAddBindVacancy from '~/components/custom/BtnAddBindVacancy.vue';
  import MyInput from '~/components/custom/MyInput.vue';
  import GeoInput from '~/components/custom/GeoInput.vue';
  import SalaryRange from '~/components/custom/SalaryRange.vue';
  import MyDropdown from '~/components/custom/MyDropdown.vue';
  import MyTextarea from '~/components/custom/MyTextarea.vue';
  import ChatMin from '~/components/custom/chat-min';
  import UiDotsLoader from '~/components/custom/UiDotsLoader.vue';
  import UiCircleLoader from '~/components/custom/UiCircleLoader.vue';
  import Pagination from '~/components/custom/Pagination.vue';
  import DropdownCalendarStatic from '~/components/custom/DropdownCalendarStatic.vue';
  import responses from '~/src/data/responses.json';
  import currency from '~/src/data/currency.json';

  import { fetchApplications } from '~/utils/applicationsList';
  import { fetchApplicationDetail, approve } from '~/utils/applicationItem';
  import { createApplication } from '~/utils/applicationCreate';
  import { deleteApplication } from '~/utils/applicationRemove';
  import { clientsList } from '~/utils/clientsList';
  import { executorsList, getDepartments } from '~/utils/executorsList';
  import { fetchApplicationUpdate } from '~/utils/applicationUpdate';
  import { getVacanciesNames } from '~/utils/getVacancies';
  import { loadScript } from '@/plugins/loader';
  import { profile } from '@/utils/loginUser';
  import { reject } from '@/utils/applicationItem';
  const isCreateVacancy = ref(false);

  import { API_YANDEX_KEY, API_YANDEX_SUGGEST } from '@/src/constants.ts';

  import { useRouter } from 'vue-router';

  const router = useRouter();

  const applications = ref([]);
  const data = ref([]);
  const pagination = ref({
    current_page: 1,
    total: 1,
    per_page: 10,
    last_page: 1,
    links: [],
  });
  const error = ref(null);
  const loading = ref(true);
  const loadingItem = ref(false);
  const errorItem = ref(null);
  const isOpenDateFrom = ref(false);
  const isOpenDateTo = ref(false);
  const errorReject = ref(null);

  const headers = computed(() => {
    const baseHeaders = [
      { key: 'title', label: 'Вакансия' },
      { key: 'status', label: 'Статус' },
      { key: 'dateStart', label: 'Дата создания' },
      { key: 'executor', label: 'Согласующий' },
      { key: 'region', label: 'Город' },
      { key: 'dateWork', label: 'Закрыть до' },
    ];

    if (['admin', 'responsible'].includes(userRole.value)) {
      baseHeaders.splice(2, 0, { key: 'customer', label: 'Автор' });
    } else if (userRole.value === 'customer') {
      baseHeaders.splice(2, 0, { key: 'responsible', label: 'Ответственный' });
    }

    return baseHeaders;
  });

  const sortKey = ref('');
  const sortOrder = ref('asc');
  const userRole = ref('admin'); // Change to "admin" or "responsible" and "customer" for testing
  const dropdownOptions = ['Управлять', 'Копировать заявку', 'Удалить'];
  // const isNewAppPopup = ref(false)
  const isNewAppPopupAdmin = ref(false);
  const isNewAppPopupCustomer = ref(false);
  const isNewAppPopupResponsible = ref(false);
  const showNewResponse = ref(false);
  const newResponse = ref('');
  const responseContainer = ref(null);
  const newApplication = ref({});
  const newResponseResponsible = ref('');
  const showNewResponseResponsible = ref(false);
  const responseContainerResponsible = ref(null);
  const newExecutor = ref({ id: null, name: '' });
  const showNewExecutor = ref(false);
  const executorContainer = ref(null);
  const newCustomer = ref({ id: null, name: '' });
  const showNewCustomer = ref(false);
  const newClient = ref({ id: null, name: '' });
  const customerContainer = ref(false);
  const newPositionResponsible = ref('');
  const newDepartmentResponsible = ref('');
  const newRegionResponsible = ref('');
  const newReasonResponsible = ref('');
  const salaryMinResponsible = ref('');
  const salaryMaxResponsible = ref('');
  const vacancyCountResponsible = ref('');
  const requirementsResponsible = ref('');
  const responsibilitiesResponsible = ref('');
  const newResponseCustomer = ref('');
  const newPositionCustomer = ref('');
  const newDepartmentCustomer = ref('');
  const newRegionCustomer = ref('');
  const newReasonCustomer = ref('');
  const salaryMinCustomer = ref('');
  const salaryMaxCustomer = ref('');
  const vacancyCountCustomer = ref('');
  const requirementsCustomer = ref('');
  const responsibilitiesCustomer = ref('');
  const selectedVacancy = ref(null);
  const detailedVacancy = ref(null);
  const popupSelectedTab = ref('popupMainInfo');
  const tabContentInner = ref(null);
  const tabContentHeight = ref(0);
  const popupResponse = ref(null);
  const isSaveVacancy = ref(false);
  const rejectReason = ref('');

  const ArrayCurrency = currency;
  const clients = ref([]);
  const executors = ref([]);
  const departments = ref([]);
  const vacancies = ref([]);
  let resizeObserver = null;
  const errors = ref({});
  const updateData = ref({});
  const isDeleteApplication = ref(false);
  const isAddApprove = ref(false);
  const isApprove = ref(false);
  const isNotApprove = ref(false);
  const reasonReject = ref(false);

  const { data: profileCustomer, error: errorProfile } = await profile();
  if (!errorProfile) {
  }
  // Функция обновления высоты контента
  const updateTabHeight = () => {
    nextTick(() => {
      if (tabContentInner.value) {
        tabContentHeight.value = tabContentInner.value.offsetHeight;
      } else {
        console.warn('tabContent is null when updating height');
      }
    });
  };

  const closeCalendare = () => {
    isOpenFrom(false);
  };

  const isOpenFrom = value => {
    isOpenDateFrom.value = value;
  };

  const deleteApplicationSelect = async id => {
    await deleteApplication(id);
    isDeleteApplication.value = false;
    selectedVacancy.value = false;
    loadApplications();
  };

  const statusWeights = {
    new: 1,
    in_review: 2,
    in_work: 3,
    paused: 4,
  };

  const sortedData = computed(() => {
    if (!sortKey.value) return data.value;

    return [...data.value].sort((a, b) => {
      const multiplier = sortOrder.value === 'asc' ? 1 : -1;

      if (sortKey.value === 'status') {
        return (statusWeights[a.status] - statusWeights[b.status]) * multiplier;
      }

      if (a[sortKey.value] > b[sortKey.value]) return 1 * multiplier;
      if (a[sortKey.value] < b[sortKey.value]) return -1 * multiplier;
      return 0;
    });
  });

  const sortBy = key => {
    if (sortKey.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey.value = key;
      sortOrder.value = 'asc';
    }
    let asc = sortOrder.value === 'asc' ? '' : '&asc=0';
    loadApplications(1, `sort=${sortKey.value}${asc}`);
  };

  const sortArrowStyle = key => {
    return {
      transform:
        sortKey.value === key && sortOrder.value === 'asc'
          ? 'rotate(180deg)'
          : 'rotate(0deg)',
      transition: 'transform 0.3s ease',
    };
  };

  const takeInWork = vacancy => {
    console.log(`Вакансия взята в работу: ${vacancy.title}`);
  };

  const openResponseInput = (vacancy, event) => {
    event.stopPropagation(); // Останавливаем всплытие события
    vacancy.showResponseInput = true;
  };

  const handleClickOutside = event => {
    const elTarget = event.target;
    //console.log('event', event.target);
    //обработчик события клика вне календаря
    // if ((!elTarget || !elTarget.classList.contains('.shadow-shadow-droplist')) || !elTarget.closest('.calendar-wrapper')) {
    console.log('close');
    // if (isOpenDateFrom.value)
    //     isOpenDateFrom.value = false
    // if (isOpenDateTo.value)
    //     isOpenDateTo.value = false
    //   console.log('isOpen', isOpenDateFrom.value);
    // }

    if (!isNewAppPopupAdmin.value && newApplication.value) {
      newApplication.value = {};
      errors.value = {};
    }
    data.value.forEach(vacancy => {
      if (vacancy.showResponseInput) {
        const element = document.querySelector(
          `[data-vacancy="${vacancy.title}"]`
        );
        if (element && !element.contains(event.target)) {
          // Если не было выбора, оставляем кнопку "Добавить"
          if (!vacancy.responseChoose) {
            vacancy.showResponseInput = false;
          } else {
            vacancy.showResponseInput = false;
          }
        }
      }
    });
  };

  const handleClickOutsideNewAppPopup = event => {
    if (
      responseContainer.value &&
      !responseContainer.value.contains(event.target)
    ) {
      if (!newResponse.value) {
        showNewResponse.value = false; // Закрываем input, если ничего не выбрано
      }
    }
  };

  const handleClickOutsideNewAppPopupResponsible = event => {
    if (
      responseContainerResponsible.value &&
      !responseContainerResponsible.value.contains(event.target)
    ) {
      if (!newResponseResponsible.value) {
        showNewResponseResponsible.value = false; // Закрываем input, если ничего не выбрано
      }
    }
  };

  const handleClickOutsideNewAppPopupExecutor = event => {
    if (
      executorContainer.value &&
      !executorContainer.value.contains(event.target)
    ) {
      if (!newExecutor.value.name) {
        showNewExecutor.value = false; // Закрываем input, если ничего не выбрано
      }
    }
  };

  const handleClickOutsideNewAppPopupCustomer = event => {
    if (
      customerContainer.value &&
      !customerContainer.value.contains(event.target)
    ) {
      if (!newCustomer.value.name) {
        showNewCustomer.value = false; // Закрываем input, если ничего не выбрано
      }
    }
  };

  const loadApplications = async (page = 1, params = '') => {
    // load data applications
    loading.value = true;
    try {
      const {
        applications: fetchedApplications,
        pagination: fetchedPagination,
      } = await fetchApplications(page, params);
      applications.value = fetchedApplications;
      data.value = applications.value.map(vacancy => ({
        ...vacancy,
        responsible: vacancy.responsible, // TODO: Заменить на данные из API
        candidates: 0, // TODO: Заменить на данные из API
        showResponseInput: false,
        responseChoose: '',
        approvals: vacancy.approvals,
      }));
      pagination.value = fetchedPagination;

      // получаем динамический список клиентов
      const { clients: clientData } = await clientsList();
      clients.value = clientData;
    } catch (error) {
      error.value = 'Ошибка загрузки заявок.';
      console.error(error);
    } finally {
      loading.value = false;
    }

    // получаем динамический список вакансий
    vacancies.value = await getVacanciesNames();

    // получаем динамический список исполнителей
    const { executors: executorData } = await executorsList();
    executors.value = executorData;
  };

  // Получаем динамический список отделов
  departments.value = await getDepartments();

  const handlePageChange = async page => {
    pagination.value.current_page = page;
    await loadApplications(page);
  };

  const getClients = async () => {
    const { clients } = await clientsList();

    return clients;
  };

  const getExecutors = async () => {
    const { executors } = await executorsList();

    return executors;
  };

  onMounted(async () => {
    await loadScript(
      `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${API_YANDEX_KEY}&suggest_apikey=${API_YANDEX_SUGGEST}`
    );
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('click', handleClickOutsideNewAppPopup);
    document.addEventListener(
      'click',
      handleClickOutsideNewAppPopupResponsible
    );
    document.addEventListener('click', handleClickOutsideNewAppPopupExecutor);
    document.addEventListener('click', handleClickOutsideNewAppPopupCustomer);
    loadApplications();
  });

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('click', handleClickOutsideNewAppPopup);
    document.removeEventListener(
      'click',
      handleClickOutsideNewAppPopupResponsible
    );
    document.removeEventListener(
      'click',
      handleClickOutsideNewAppPopupExecutor
    );
    document.removeEventListener(
      'click',
      handleClickOutsideNewAppPopupCustomer
    );
  });

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  });

  const updateResponseChoose = (vacancy, value) => {
    if (value) {
      vacancy.responseChoose = value;
      vacancy.showResponseInput = false;
    }
  };

  // popup's settings
  // config for control scroll
  function disableBodyScroll() {
    document.body.style.overflow = 'hidden'; // Отключаем прокрутку
  }

  function enableBodyScroll() {
    document.body.style.overflow = ''; // Включаем прокрутку
  }

  // const openNewResponse = event => {
  //   event.stopPropagation()
  //   showNewResponse.value = true
  // }

  // const updateNewResponse = value => {
  //   if (value) {
  //     newResponse.value = value
  //     showNewResponse.value = false
  //   }
  // }

  const openNewResponseResponsible = event => {
    event.stopPropagation();
    showNewResponseResponsible.value = true;
  };

  const openNewExecutor = event => {
    event.stopPropagation();
    showNewExecutor.value = true;
  };

  const openNewCustomer = event => {
    event.stopPropagation();
    showNewCustomer.value = true;
  };

  const updateNewResponseResponsible = value => {
    if (value) {
      newResponseResponsible.value = value;
      showNewResponseResponsible.value = false;
    }
  };

  function updateNewExecutor(value, id) {
    // сonsole.log('value executor ', value)
    if (value) {
      newExecutor.value.name = value;
      newExecutor.value.id = id;
      showNewExecutor.value = false;
      if (!newApplication.value.executor) {
        newApplication.value.executor = {};
      }
      newApplication.value.executor.id = id;
      newApplication.value.executor.name = value;
      // сonsole.log('newApplication.value.executor.id ', newApplication.value.executor.id)
    }
  }

  function updateNewResponsible(value, id) {
    if (value) {
      newExecutor.value.name = value;
      newExecutor.value.id = id;
      showNewExecutor.value = false;
      if (!newApplication.value.responsible) {
        newApplication.value.responsible = {};
      }
      newApplication.value.responsible.id = id;
      newApplication.value.responsible.name = value;
    }
  }

  const updateNewCustomer = (value, id) => {
    if (value) {
      newCustomer.value.name = value;
      newCustomer.value.id = id;
      showNewCustomer.value = false;
    }
  };

  const updateNewClient = (value, id) => {
    if (value) {
      newClient.value.name = value;
      newClient.value.id = id;
      showNewCustomer.value = false;
      if (!newApplication.value.client) {
        newApplication.value.client = {};
      }
      newApplication.value.client.id = id;
      newApplication.value.client.name = value;
    }
  };

  const closeNewApplicationPopup = () => {
    if (newApplication.value) {
      newApplication.value = {};
    }

    isNewAppPopupAdmin.value = false;
  };

  watch(selectedVacancy, newValue => {
    if (newValue) {
      // popup is opening
      nextTick(() => {
        if (tabContentInner.value) {
          let isInitialUpdate = true;
          resizeObserver = new ResizeObserver(() => {
            if (isInitialUpdate) {
              isInitialUpdate = false;
            } else {
              updateTabHeight();
            }
          });
          resizeObserver.observe(tabContentInner.value);
          updateTabHeight();
        } else {
          console.warn('tabContentInner is null after popup open');
        }
      });
    } else {
      // popup is closing
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
    }
  });

  // Следим за изменением выбранного таба и обновляем высоту
  watch(popupSelectedTab, () => {
    updateTabHeight();
  });

  const openPopup = async vacancy => {
    loadingItem.value = true;
    try {
      const fullData = await fetchApplicationDetail(vacancy.id);
      detailedVacancy.value = fullData.data; // save full response.data
      if (detailedVacancy.value.status.name == 'На рассмотрении') {
        if (
          profileCustomer.data.role.name == 'Рекрутер' ||
          profileCustomer.data.role.name == 'Администратор'
        ) {
          isAddApprove.value = true;
        }
        if (
          profileCustomer.data.role.name == 'Клиент' ||
          profileCustomer.data.role.name == 'Администратор'
        ) {
          if (!isDeleteApplication.value) {
            isDeleteApplication.value = true;
          }
        } else {
          if (isDeleteApplication.value) {
            isDeleteApplication.value = false;
          }
        }
        reasonReject.value ? (reasonReject.value = false) : '';
      } else {
        if (isDeleteApplication.value) {
          isDeleteApplication.value = false;
        }
        if (
          detailedVacancy.value.status.name == 'Отклонена' &&
          detailedVacancy.value.approvals.length > 0
        ) {
          reasonReject.value = true;
        } else {
          reasonReject.value = false;
        }
        isAddApprove.value = false;
      }

      selectedVacancy.value = vacancy; // open popup
    } catch (error) {
      error.value = 'Ошибка загрузки деталей заявки.';
      console.error(error);
    } finally {
      loadingItem.value = false;
    }
  };

  const closePopup = () => {
    selectedVacancy.value = null;
    detailedVacancy.value = null;
  };

  const reasonseForOpenVacancy = [
    {
      name: 'Замена позиции',
      value: 0,
    },
    {
      name: 'Расширения',
      value: 1,
    },
    {
      name: 'Причина 3',
      value: 2,
    },
    {
      name: 'Причина 4',
      value: 3,
    },
    {
      name: 'Причина 5',
      value: 4,
    },
  ];

  const EVENT_TYPES = {
    CREATED: 'Создана заявка',
    UNDER_REVIEW: 'Принята к рассмотрению',
    ASSIGNED: 'Назначен ответственный',
  };

  const historyTabEvents = [
    {
      id: 1,
      eventTitle: EVENT_TYPES.CREATED,
      eventContent: 'Программист 1С на неполный день',
      eventLogDateTime: '2024-09-11T18:03:00',
    },
    {
      id: 2,
      eventTitle: EVENT_TYPES.UNDER_REVIEW,
      eventContent: 'Василисов Василий Сергеевич',
      eventLogDateTime: '2024-09-11T18:03:00',
    },
    {
      id: 3,
      eventTitle: EVENT_TYPES.ASSIGNED,
      eventContent: 'Михайлов Михаил Михайлович',
      eventLogDateTime: '2024-09-11T18:03:00',
    },
  ];

  const formatDateTime = dateTime => {
    return {
      date: dayjs(dateTime).format('DD.MM.YYYY'),
      time: dayjs(dateTime).format('HH:mm'),
    };
  };

  // const getStatusLabel = statusId => {
  //   console.log('Статус: ', statusId)
  //   const statusKey = Object.keys(statusWeights).find(
  //     key => statusWeights[key] === statusId
  //   )
  //   return statusKey ? statusLabels[statusKey] : 'Не указан'
  // }

  // Начальные данные (позже можно заменить на API)
  const messages = ref([
    {
      id: 1,
      type: 'standard',
      author: 'Василисов Василий Сергеевич',
      content: 'Пожалуйста, кто-то, закройте окно в коридоре, уже ДУЕТ!',
      dateTime: '2024-09-11T18:03:00',
    },
    {
      id: 2,
      type: 'with-recipient',
      author: 'Алексеев Алексей Алексеевич',
      recipients: ['Василисов Василий Сергеевич'],
      content: 'Коллега уважаемый, попробуй сделать это самостоятельно!',
      dateTime: '2024-09-11T18:03:00',
    },
    {
      id: 3,
      type: 'with-file',
      author: 'Георгиева Настасья Самбурская',
      recipients: [
        'Василисов Василий Сергеевич',
        'Алексеев Алексей Алексеевич',
      ],
      content:
        'Коллеги! Отчет готов! Прошу ознакомиться и дать обратную связь ближайшее время',
      file: { name: 'Какой-то отчет.pdf', format: 'pdf' },
      dateTime: '2024-09-11T18:03:00',
    },
    {
      id: 4,
      type: 'standard',
      author: 'Денисов Василис Алексеевич',
      content: 'Благодарность за отчет!',
      dateTime: '2024-09-11T18:03:00',
    },
    {
      id: 5,
      type: 'standard',
      author: 'Василисов Василий Сергеевич',
      content: 'Пожалуйста, кто-то, откройте окно в коридоре, уже не ДУЕТ!',
      dateTime: '2024-09-11T18:03:00',
    },
  ]);

  const validateForm = () => {
    const newErrors = {};

    if (!newApplication.value.responsible)
      newErrors.response = 'Укажите согласующего';
    if (!newApplication.value.position) newErrors.post = 'Укажите должность';
    if (!newApplication.value.city) newErrors.location = 'Укажите город поиска';
    if (!newApplication.value.count || newApplication.value.count <= 0) {
      newErrors.positions = 'Укажите корректное количество позиций';
    }
    if (newApplication.value.salaryFrom && newApplication.value.salaryTo) {
      if (newApplication.value.salaryFrom > newApplication.value.salaryTo) {
        newErrors.salaryTo =
          'Максимальная зарплата должна быть больше минимальной';
      }
    }
    if (!newApplication.value.currency)
      newApplication.value.currency = currency[0]['name'];
    if (!newApplication.value.reason) {
      newErrors.reason = 'Укажите причину открытия вакансии';
    }

    errors.value = newErrors;

    return Object.keys(newErrors).length === 0; // Возвращаем true, если ошибок нет
  };

  const applicationData = computed(() => {
    return {
      position: newApplication.value.position,
      division: newApplication.value.division,
      count: newApplication.value.count,
      salaryFrom: newApplication.value.salaryFrom,
      salaryTo: newApplication.value.salaryTo,
      currency: newApplication.value.currency,
      require: newApplication.value.require,
      duty: newApplication.value.duty,
      city: newApplication.value.city,
      reason: newApplication.value.reason.name,
      dateStart: newApplication.value.dateStart,
      dateWork: newApplication.value.dateWork,
      vacancy: newApplication.value.vacancy?.id,
      status: newApplication.value.status?.id,
      executor: newApplication.value.executor?.id,
      client: newApplication.value.client?.id,
      responsible: newApplication.value.responsible?.id,
    };
  });

  const createApplicationHandler = async () => {
    if (validateForm()) {
      try {
        const { data, error } = await createApplication(applicationData.value);
        if (!error) {
          isNewAppPopupAdmin.value = false; // Закрываем попап
          loadApplications();
          isSaveVacancy.value = true;
        } else if (error) {
          const status = error.status;
          const message = error.data?.message || error.message;

          if (status === 422) {
            console.warn('Validate error:', message);
          } else {
            console.warn('Error:', message);
          }
        }
      } catch (error) {
        console.error('Network error:', error.message);
      }
    } else {
      console.log('Form validation failed');
    }
  };

  const clientName = computed({
    get: () => {
      // Безопасная проверка на client и client.name
      return detailedVacancy.value.client?.name || '';
    },
    set: newValue => {
      // Обновляем detailedVacancy.client, если это необходимо
      if (detailedVacancy.value.client) {
        detailedVacancy.value.client.name = newValue;
      } else {
        // Если client === null, создаем объект client
        detailedVacancy.value.client = { id: 0, name: newValue }; // Или другой id
      }
    },
  });

  const responsibleName = computed({
    get: () => {
      // Безопасная проверка на responsible и responsible.name
      return detailedVacancy.value.responsible?.name || '';
    },
    set: newValue => {
      // Обновляем detailedVacancy.responsible, если это необходимо

      if (detailedVacancy.value.name) {
        detailedVacancy.value.responsible.name = newValue;
      } else {
        // Если responsible === null, создаем объект responsible
        detailedVacancy.value.responsible = { id: 0, name: newValue }; // Или другой id
      }
    },
  });

  const vacancy = computed({
    get: () => {
      // Безопасная проверка на responsible и responsible.name
      return detailedVacancy.value?.vacancy || null;
    },
    set: newValue => {
      // Обновляем detailedVacancy.responsible, если это необходимо

      if (detailedVacancy.value.name) {
        isCreateVacancy.value = false;
        detailedVacancy.value.vacancy.name = newValue;
      } else {
        isCreateVacancy.value = true;
        detailedVacancy.value.vacancy = { id: 0, name: newValue }; // Или другой id
      }
    },
  });

  const updateResponse = (value, id, key = null) => {
    if (key) {
      updateData.value[key] = id;
    }
  };

  const updateExecutor = () => {
    updateData.value.append('executor', id);
  };

  const handleRemoveApplication = async (item, vacancy) => {
    if (item === 'Удалить') {
      try {
        const { data, error } = await deleteApplication(vacancy.id);
        if (error) {
          console.error('Failed to delete application:', error);
          return;
        }
        // Опционально: обнови список заявок после удаления
        loadApplications(); // Если нужно перезагрузить список
      } catch (err) {
        console.error('Unexpected error during deletion:', err);
      }
    }
    if (item === 'Копировать заявку') {
      const { data, error } = await fetchApplicationDetail(vacancy.id);
      newApplication.value = data;
      isNewAppPopupAdmin.value = true;
    }
    if (item === 'Управлять') {
      openPopup(vacancy);
    }
  };

  const handlerUpdateApplication = async vacancy => {
    if (Object.keys(updateData.value).length > 0) {
      const { data, error } = await fetchApplicationUpdate(
        updateData.value,
        vacancy.id
      );
      updateData.value = {};
      loadApplications();
    }

    closePopup();
  };

  const rejectApplication = () => {
    selectedVacancy.value = false;
    isNotApprove.value = true;
  };

  const sendReject = async reason => {
    const { data: message, error: errorResponse } = await reject(
      detailedVacancy.value.id,
      reason
    );
    if (!errorResponse) {
      if (errorReject.value) {
        errorReject.value = null;
      }
      isNotApprove.value = false;
      await handlePageChange(pagination.value.current_page);
    } else {
      errorReject.value = errorResponse;
    }
  };

  const addApprove = async () => {
    selectedVacancy.value = false;
    if (!vacancy.value) {
      router.push(
        `/vacancies/newvacancy/?application=${detailedVacancy.value.id}`
      );
    } else {
      const idApplication = detailedVacancy.value.id;
      handlerUpdateApplication(detailedVacancy.value);
      await approve(idApplication);
      loadApplications();
    }
  };
</script>

<template>
  <div class="container pb-72 pt-[34px]">
    <div
      class="mb-3.5 flex items-center justify-between rounded-fifteen bg-white p-25px"
    >
      <div>
        <p class="mb-2.5 text-xl font-semibold leading-normal text-space">
          Заявки
        </p>
        <p class="text-sm font-normal leading-normal text-slate-custom">
          Отправьте приглашение заказчику и управляйте доступом
        </p>
      </div>
      <div>
        <UiButton
          v-if="userRole === 'admin'"
          size="semiaction"
          variant="action"
          @click="isNewAppPopupAdmin = true"
        >
          Новая заявка
        </UiButton>
        <UiButton
          v-else-if="userRole === 'responsible'"
          size="semiaction"
          variant="action"
          @click="isNewAppPopupResponsible = true"
        >
          Новая заявка
        </UiButton>
        <UiButton
          v-else-if="userRole === 'customer'"
          size="semiaction"
          variant="action"
          @click="isNewAppPopupCustomer = true"
        >
          Новая заявка
        </UiButton>
      </div>
    </div>

    <div
      class="mb-px w-full rounded-t-fifteen bg-catskill pl-15px pr-25px leading-normal"
    >
      <div
        class="header-wrapper grid min-h-[71px] grid-cols-8 items-center gap-x-2.5"
      >
        <div
          v-for="header in headers"
          :key="header.key"
          class="flex pl-2.5 text-sm font-medium text-slate-custom"
          @click="
            ['dateStart', 'dateWork', 'status'].includes(header.key) &&
            sortBy(header.key)
          "
          :class="{
            'cursor-pointer select-none': [
              'dateStart',
              'dateWork',
              'status',
            ].includes(header.key),
          }"
        >
          <span>{{ header.label }}</span>
          <button
            v-if="['dateStart', 'dateWork', 'status'].includes(header.key)"
            class="custom-button relative ml-[2.2px] flex items-center justify-center"
          >
            <span :style="sortArrowStyle(header.key)" class="ml-1">
              <svg-icon name="sort-arrow" width="16px" height="15px" />
            </span>
          </button>
        </div>
        <div></div>
      </div>
    </div>
    <div class="rounded-b-fifteen bg-white p-25px" v-if="loading">
      <UiDotsLoader />
    </div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <div v-if="data.length === 0">Заявки не найдены.</div>
      <div v-else>
        <div
          v-for="(vacancy, index) in data"
          :key="index"
          :data-vacancy="vacancy.title"
          class="items-wrapper mb-px grid min-h-[61px] grid-cols-8 gap-x-2.5 bg-white pl-15px pr-25px last-of-type:rounded-b-fifteen"
        >
          <!-- simple values -->
          <div class="py-5 pl-2.5 text-sm font-medium text-space">
            <button
              @click="openPopup(vacancy)"
              class="text-left text-dodger underline"
            >
              {{ vacancy.title }}
            </button>
          </div>
          <!-- status vacancy -->
          <div class="py-5 pl-2.5 text-sm font-medium text-space">
            {{ vacancy.status }}
          </div>
          <!-- admin or responsible column on user role -->
          <div
            class="py-5 pl-2.5 text-sm font-medium text-space"
            v-if="['admin', 'responsible'].includes(userRole)"
          >
            {{ vacancy.customer }}
          </div>
          <div class="py-5 pl-2.5 text-sm font-medium text-space">
            {{ vacancy.createdAt }}
          </div>
          <div
            v-if="userRole === 'customer'"
            class="py-5 pl-5px text-sm font-medium text-space"
          >
            {{ vacancy.responsible }}
          </div>

          <!-- admin or customer column -->
          <div>
            <div v-if="userRole === 'admin'">
              <div
                class="py-5 pl-2.5 text-sm font-medium text-space"
                v-if="vacancy.responsible"
              >
                {{ vacancy.responsible }}
              </div>
              <div v-else>
                <!-- Если выбрано значение, показываем его -->
                <div
                  v-if="vacancy.responseChoose"
                  class="py-5 pl-2.5 text-sm font-medium text-dodger"
                >
                  {{ vacancy.responseChoose }}
                </div>
                <button
                  v-else-if="!vacancy.showResponseInput"
                  @click="openResponseInput(vacancy, $event)"
                  class="py-5 pl-2.5 text-sm font-medium text-dodger"
                >
                  Добавить
                </button>
                <response-input
                  v-model="vacancy.responseChoose"
                  v-show="vacancy.showResponseInput"
                  @update:modelValue="
                    value => updateResponseChoose(vacancy, value)
                  "
                  class="max-w-input mb-0 w-full py-5"
                  :responses="vacancy.responsible"
                />
              </div>
            </div>
            <div v-if="userRole === 'responsible'">
              <div
                v-if="vacancy.responsible"
                class="py-5 pl-2.5 text-sm font-medium text-space"
              >
                {{ vacancy.responsible }}
              </div>
              <div v-else>
                <button
                  @click="takeInWork(vacancy)"
                  class="py-5 pl-2.5 text-sm font-medium text-dodger"
                >
                  Взять в работу
                </button>
              </div>
            </div>
            <div div v-if="userRole === 'customer'">
              <div
                v-if="vacancy.responsible"
                class="py-5 pl-2.5 text-sm font-medium text-space"
              >
                {{ vacancy.responsible }}
              </div>
              <div v-else>
                <p class="py-5 pl-2.5 text-sm font-normal text-bali">
                  Не назначен
                </p>
              </div>
            </div>
          </div>
          <div class="py-5 pl-2.5 text-sm font-medium text-space">
            {{ vacancy.region }}
          </div>
          <div class="py-5 pl-2.5 text-sm font-medium text-space">
            {{ vacancy.closeDate }}
          </div>
          <!-- dropdown item -->
          <div class="py-2.5">
            <DotsDropdown
              :items="dropdownOptions"
              @select-item="
                selectedItem => handleRemoveApplication(selectedItem, vacancy)
              "
            />
          </div>
        </div>
      </div>
    </div>
    <div v-if="userRole === 'admin' && isNewAppPopupAdmin">
      <transition
        name="fade"
        @after-leave="enableBodyScroll"
        @enter="disableBodyScroll"
      >
        <Popup
          :isOpen="isNewAppPopupAdmin"
          @close="() => (isNewAppPopupAdmin = false)"
          :width="'740px'"
          :showCloseButton="false"
          :disableOverflowHidden="true"
          :overflowContainer="true"
          maxHeight
          :lgSize="true"
        >
          <!-- администратор -->
          <p class="mb-[39px] text-xl font-semibold leading-normal text-space">
            Новая заявка
          </p>
          <div class="mb-22">
            <div class="mb-15px">
              <p class="mb-7px text-sm font-medium text-space">
                Согласующий
                <span class="text-red-500">*</span>
              </p>
              <response-input
                class="w-full"
                :responses="executors"
                :model-value="
                  newApplication.responsible
                    ? newApplication.responsible.name
                    : null
                "
                :showRoles="true"
                placeholder="Кому отправить заявку"
                @update:modelValue="updateNewResponsible"
              />
              <div v-if="errors.response" class="mt-1 text-xs text-red-500">
                {{ errors.response }}
              </div>
            </div>
            <div class="mb-15px flex w-full justify-between gap-x-15px">
              <div class="w-full max-w-[400px]">
                <p
                  class="mb-15px text-sm font-medium leading-normal text-space"
                >
                  Название должности
                  <span class="text-red-500">*</span>
                </p>
                <MyInput
                  placeholder="Введите должность"
                  v-model="newApplication.position"
                />
                <div v-if="errors.post" class="mt-1 text-xs text-red-500">
                  {{ errors.post }}
                </div>
              </div>
              <div class="w-full">
                <p
                  class="mb-15px text-sm font-medium leading-normal text-space"
                >
                  Отдел
                </p>
                <response-input
                  class="w-full"
                  :responses="departments"
                  :model-value="
                    newApplication.division
                      ? newApplication.division.name
                      : null
                  "
                  :showRoles="true"
                  notFound="Отдел не найден"
                  placeholder="Введите название отдела"
                  @update:modelValue="newApplication.division = $event"
                />
                <!-- <MyInput
                  placeholder="Введите название подразделения"
                  v-model="newApplication.division"
                /> -->
                <!-- <div v-if="errors.department" class="text-red-500 text-xs mt-1">
                  {{ errors.department }}
                </div> -->
              </div>
            </div>
            <div class="mb-15px w-full">
              <p class="mb-15px text-sm font-medium leading-normal text-space">
                Город поиска
                <span class="text-red-500">*</span>
              </p>
              <geo-input
                v-model="newApplication.city"
                :placeholder="'Введите город'"
              />
              <div v-if="errors.location" class="mt-1 text-xs text-red-500">
                {{ errors.location }}
              </div>
            </div>
            <div class="mb-15px w-full">
              <p class="mb-15px text-sm font-medium leading-normal text-space">
                Сколько человек нужно нанять
                <span class="text-red-500">*</span>
              </p>
              <MyInput
                placeholder="Введите число позиций на вакансию"
                v-model="newApplication.count"
                :type="'Number'"
              />
              <div v-if="errors.positions" class="mt-1 text-xs text-red-500">
                {{ errors.positions }}
              </div>
            </div>
            <div class="mb-15px flex w-full gap-x-15px">
              <div class="w-full">
                <p
                  class="mb-15px text-sm font-medium leading-normal text-space"
                >
                  Зарплата
                </p>
                <SalaryRange
                  :from="newApplication.salaryFrom"
                  :to="newApplication.salaryTo"
                  @update:from="newApplication.salaryFrom = $event"
                  @update:to="newApplication.salaryTo = $event"
                />
                <div v-if="errors.salaryFrom" class="mt-1 text-xs text-red-500">
                  {{ errors.salaryFrom }}
                </div>
                <div v-if="errors.salaryTo" class="mt-1 text-xs text-red-500">
                  {{ errors.salaryTo }}
                </div>
              </div>
              <div class="w-full">
                <p
                  class="mb-15px text-sm font-medium leading-normal text-space"
                >
                  Валюта
                </p>
                <my-dropdown
                  :defaultValue="'Валюта'"
                  :options="ArrayCurrency"
                  :selected="0"
                  v-model="newApplication.currency"
                />
                <div v-if="errors.currency" class="mt-1 text-xs text-red-500">
                  {{ errors.currency }}
                </div>
              </div>
            </div>
            <div class="mb-15px w-full">
              <p class="mb-15px text-sm font-medium leading-normal text-space">
                Причина открытия вакансии
                <span class="text-red-500">*</span>
              </p>
              <my-dropdown
                :options="reasonseForOpenVacancy"
                v-model="newApplication.reason"
              />
              <div v-if="errors.reason" class="mt-1 text-xs text-red-500">
                {{ errors.reason }}
              </div>
            </div>
            <div class="mb-15px flex w-full gap-x-15px">
              <div class="w-full" @click="closeCalendare">
                <p class="mb-15px text-sm font-medium text-space">
                  Начать подбор не позднее
                </p>
                <!-- <InputCalendar :fullStyles="true" /> -->
                <DropdownCalendarStatic
                  @update:model-value="newApplication.dateStart = $event"
                  :is-open="isOpenDateFrom"
                  @update:isOpen="isOpenDateFrom"
                />

                <div v-if="errors.dateStart" class="mt-1 text-xs text-red-500">
                  {{ errors.dateStart }}
                </div>
              </div>
              <div class="w-full">
                <p class="mb-15px text-sm font-medium text-space">
                  Желаемая дата выхода кандидата
                </p>
                <DropdownCalendarStatic
                  @update:model-value="newApplication.dateWork = $event"
                  :is-open="isOpenDateTo"
                />
                <div v-if="errors.dateWork" class="mt-1 text-xs text-red-500">
                  {{ errors.dateWork }}
                </div>
              </div>
            </div>
            <div class="mb-15px w-full">
              <p class="mb-15px text-sm font-medium leading-normal text-space">
                Требования к кандидату
              </p>
              <MyTextarea
                v-model="newApplication.require"
                :placeholder="'Опишите ключевые требования'"
              />
              <div v-if="errors.requirements" class="mt-1 text-xs text-red-500">
                {{ errors.requirements }}
              </div>
            </div>
            <div class="mb-15px w-full">
              <p class="mb-4 text-sm font-medium leading-normal text-space">
                Обязанности кандидата
              </p>
              <MyTextarea
                v-model="newApplication.duty"
                :placeholder="'Опишите ключевые обязанности кандидата'"
              />
              <div
                v-if="errors.responsibilities"
                class="mt-1 text-xs text-red-500"
              >
                {{ errors.responsibilities }}
              </div>
            </div>
            <div class="mb-15px w-full">
              <p class="mb-4 text-sm font-medium leading-normal text-space">
                Условия работы
              </p>
              <MyTextarea
                v-model="newApplication.conditions"
                :placeholder="'Опишите условия работы для кандидата'"
              />
            </div>
            <div class="mb-25px w-full">
              <p class="mb-4 text-sm font-medium leading-normal text-space">
                Комментарий или заметки
              </p>
              <MyTextarea
                v-model="newApplication.comments"
                :placeholder="'Опишите комментарий или заметки для кандидата'"
              />
            </div>
            <div></div>
            <div class="flex w-fit justify-between gap-15px">
              <UiButton
                variant="action"
                size="semiaction"
                class="font-bold"
                @click="createApplicationHandler()"
              >
                Отправить заявку
              </UiButton>
              <UiButton
                variant="back"
                size="second-back"
                class="font-medium"
                @click="closeNewApplicationPopup"
              >
                Отмена
              </UiButton>
            </div>
          </div>
        </Popup>
      </transition>
    </div>
    <div v-else-if="userRole === 'responsible'">
      <transition
        name="fade"
        @after-leave="enableBodyScroll"
        @enter="disableBodyScroll"
      >
        <Popup
          :isOpen="isNewAppPopupResponsible"
          @close="() => (isNewAppPopupResponsible = false)"
          :width="'740px'"
          :showCloseButton="false"
          :disableOverflowHidden="true"
          :overflowContainer="true"
          maxHeight
          lgSize
        >
          <p class="mb-[39px] text-xl font-semibold leading-normal text-space">
            Новая заявка
          </p>
          <div class="mb-22px">
            <div class="mb-6">
              <p class="mb-7px pl-15px text-sm font-medium text-space">
                Ответственный
              </p>
              <div ref="responseContainerResponsible">
                <div
                  v-if="newResponseResponsible"
                  class="pl-15px text-sm font-medium text-dodger"
                >
                  {{ newResponseResponsible }}
                </div>
                <button
                  v-else-if="!showNewResponseResponsible"
                  @click="openNewResponseResponsible"
                  class="px-15px py-2.5 text-sm font-medium text-dodger"
                >
                  Добавить
                </button>
                <response-input
                  class="w-full"
                  :responses="responses"
                  v-model="newResponseResponsible"
                  v-show="showNewResponseResponsible"
                  @update:modelValue="
                    value => updateNewResponseResponsible(value)
                  "
                />
              </div>
            </div>
            <div class="mb-5 grid grid-flow-col grid-cols-2 gap-x-5">
              <div>
                <p class="mb-7px pl-15px text-sm font-medium text-space">
                  Исполнитель
                </p>
                <div ref="executorContainer">
                  <div
                    v-if="newExecutor.name"
                    class="pl-15px text-sm font-medium text-dodger"
                  >
                    {{ newExecutor.name }}
                  </div>
                  <button
                    v-else-if="!showNewExecutor"
                    @click="openNewExecutor"
                    class="px-15px py-2.5 text-sm font-medium text-dodger"
                  >
                    Добавить
                  </button>
                  <response-input
                    class="w-full"
                    :responses="responses"
                    v-model="newExecutor"
                    v-show="showNewExecutor"
                    @update:modelValue="updateNewExecutor"
                  />
                </div>
              </div>
              <div>
                <p class="mb-7px pl-15px text-sm font-medium text-space">
                  Заказчик
                </p>
                <div ref="customerContainer">
                  <div
                    v-if="newCustomer.name"
                    class="pl-15px text-sm font-medium text-dodger"
                  >
                    {{ newCustomer.name }}
                  </div>
                  <button
                    v-else-if="!showNewCustomer"
                    @click="openNewCustomer"
                    class="px-15px py-2.5 text-sm font-medium text-dodger"
                  >
                    Добавить
                  </button>
                  <response-input
                    class="w-full"
                    :responses="responses"
                    v-model="newCustomer.name"
                    v-show="showNewCustomer"
                    @update:modelValue="
                      (value, id) => updateNewCustomer(value, id)
                    "
                  />
                </div>
              </div>
            </div>
            <div class="mb-6 grid grid-flow-col gap-x-5">
              <div>
                <p class="mb-1 pl-15px text-sm font-medium text-space">
                  Должность
                </p>
                <SimpleInput
                  placeholder="Введите название должности"
                  v-model="newPositionResponsible"
                />
              </div>
              <div>
                <p class="mb-1 pl-15px text-sm font-medium text-space">
                  Департамент
                </p>
                <SimpleInput v-model="newDepartmentResponsible" />
              </div>
            </div>
            <div class="mb-6 grid grid-flow-col gap-x-5">
              <div>
                <p class="mb-1 pl-15px text-sm font-medium text-space">
                  Город поиска
                </p>
                <SimpleInput v-model="newRegionResponsible" />
              </div>
              <div>
                <p class="mb-1 pl-15px text-sm font-medium text-space">
                  Причина открытия вакансии
                </p>
                <SimpleInput v-model="newReasonResponsible" />
              </div>
            </div>
            <div class="mb-6 grid grid-flow-col gap-x-5">
              <div>
                <p class="mb-1 pl-15px text-sm font-medium text-space">
                  Зарплата от
                </p>
                <SimpleInput v-model="salaryMinResponsible" type="number" />
              </div>
              <div>
                <p class="mb-1 pl-15px text-sm font-medium text-space">
                  Зарплата до
                </p>
                <SimpleInput v-model="salaryMaxResponsible" type="number" />
              </div>
            </div>
            <div class="mb-6">
              <p class="mb-1 pl-15px text-sm font-medium text-space">
                Количество позиций
              </p>
              <SimpleInput v-model="vacancyCountResponsible" type="number" />
            </div>
            <div class="mb-6">
              <p class="mb-1 pl-15px text-sm font-medium text-space">
                Требования кандидата
              </p>
              <SimpleInput v-model="requirementsResponsible" />
            </div>
            <div class="mb-6">
              <p class="mb-1 pl-15px text-sm font-medium text-space">
                Обязанности кандидата
              </p>
              <SimpleInput v-model="responsibilitiesResponsible" />
            </div>
            <div class="mb-9 grid grid-flow-col grid-cols-2 gap-x-5">
              <div>
                <p class="mb-1 pl-15px text-sm font-medium text-space">
                  Начать подбор не позднее
                </p>
                <InputCalendar />
              </div>
              <div>
                <p class="mb-1 pl-15px text-sm font-medium text-space">
                  Желаемая дата выхода кандидата
                </p>
                <InputCalendar />
              </div>
            </div>
          </div>
          <div class="flex w-fit justify-between gap-15px">
            <UiButton variant="action" size="semiaction" class="font-bold">
              Отправить на согласование
            </UiButton>
            <UiButton
              variant="back"
              size="second-back"
              class="font-medium"
              @click="isNewAppPopupResponsible = false"
            >
              Отмена
            </UiButton>
          </div>
        </Popup>
      </transition>
    </div>
    <div v-else-if="userRole === 'customer'">
      <transition
        name="fade"
        @after-leave="enableBodyScroll"
        @enter="disableBodyScroll"
      >
        <Popup
          :isOpen="isNewAppPopupCustomer"
          @close="() => (isNewAppPopupCustomer = false)"
          :width="'740px'"
          :showCloseButton="false"
          :disableOverflowHidden="true"
          :overflowContainer="true"
          maxHeight
        >
          <p class="mb-[39px] text-xl font-semibold leading-normal text-space">
            Новая заявка
          </p>
          <div class="mb-22px">
            <div class="mb-6">
              <p class="mb-7px pl-15px text-sm font-medium text-space">
                Ответственный
              </p>
              <BtnResponseInput
                v-model="newResponseCustomer"
                :responses="responses"
                :customer="'responsible'"
              />
            </div>
            <div class="mb-6 grid grid-flow-col gap-x-5">
              <div>
                <p class="mb-1 pl-15px text-sm font-medium text-space">
                  Должность
                </p>
                <SimpleInput
                  placeholder="Введите название должности"
                  v-model="newPositionCustomer"
                />
              </div>
              <div>
                <p class="mb-1 pl-15px text-sm font-medium text-space">
                  Департамент
                </p>
                <SimpleInput v-model="newDepartmentCustomer" />
              </div>
            </div>
            <div class="mb-6 grid grid-flow-col gap-x-5">
              <div>
                <p class="mb-1 pl-15px text-sm font-medium text-space">
                  Город поиска
                </p>
                <SimpleInput v-model="newRegionCustomer" />
              </div>
              <div>
                <p class="mb-1 pl-15px text-sm font-medium text-space">
                  Причина открытия вакансии
                </p>
                <SimpleInput v-model="newReasonCustomer" />
              </div>
            </div>
            <div class="mb-6 grid grid-flow-col gap-x-5">
              <div>
                <p class="mb-1 pl-15px text-sm font-medium text-space">
                  Зарплата от
                </p>
                <SimpleInput v-model="salaryMinCustomer" type="number" />
              </div>
              <div>
                <p class="mb-1 pl-15px text-sm font-medium text-space">
                  Зарплата до
                </p>
                <SimpleInput v-model="salaryMaxCustomer" type="number" />
              </div>
            </div>
            <div class="mb-6">
              <p class="mb-1 pl-15px text-sm font-medium text-space">
                Количество позиций
              </p>
              <SimpleInput v-model="vacancyCountCustomer" type="number" />
            </div>
            <div class="mb-6">
              <p class="mb-1 pl-15px text-sm font-medium text-space">
                Требования кандидата
              </p>
              <SimpleInput v-model="requirementsCustomer" />
            </div>
            <div class="mb-6">
              <p class="mb-1 pl-15px text-sm font-medium text-space">
                Обязанности кандидата
              </p>
              <SimpleInput v-model="responsibilitiesCustomer" />
            </div>
            <div class="mb-8 grid grid-flow-col grid-cols-2 gap-x-5">
              <div>
                <p class="mb-1 pl-15px text-sm font-medium text-space">
                  Начать подбор не позднее
                </p>
                <InputCalendar />
              </div>
              <div>
                <p class="mb-1 pl-15px text-sm font-medium text-space">
                  Желаемая дата выхода кандидата
                </p>
                <InputCalendar />
              </div>
            </div>
          </div>
          <div class="flex w-fit justify-between gap-15px">
            <UiButton variant="action" size="semiaction" class="font-bold">
              Отправить на согласование
            </UiButton>
            <UiButton
              variant="back"
              size="second-back"
              class="font-medium"
              @click="isNewAppPopupCustomer = false"
            >
              Отмена
            </UiButton>
          </div>
        </Popup>
      </transition>
    </div>
    <transition
      name="fade"
      @after-leave="enableBodyScroll"
      @enter="disableBodyScroll"
    >
      <Popup
        v-if="selectedVacancy"
        :isOpen="!!selectedVacancy"
        @close="closePopup"
        :width="'750px'"
        :showCloseButton="false"
        :disableOverflowHidden="true"
        :overflowContainer="true"
        maxHeight
        :lgSize="true"
      >
        <template #default>
          <div v-if="errorItem">{{ errorItem }}</div>
          <div v-else-if="detailedVacancy">
            <h3 class="mb-5 text-xl font-semibold text-space">
              {{ detailedVacancy.position }}
            </h3>
            <div v-if="reasonReject">
              <p
                class="mb-10px text-sm font-normal text-red-500 text-slate-custom"
              >
                Причина отклонения заявки
              </p>
              <div class="relative z-10">
                {{ detailedVacancy.approvals[0]?.description }}
              </div>
              <p class="mb-25px text-xs font-normal text-slate-custom">
                *Чтобы внести изменения после отклонения заявки, скопируйте
                заявку на вакансию, нажав на кнопку "Копировать" внизу окна
                созданной вами заявки. Заявка будет скопирована и создана
                заново.
              </p>
            </div>
            <p class="mb-25px text-sm font-normal text-slate-custom">
              {{ detailedVacancy.city }}
            </p>
            <div class="relative z-10">
              <button
                @click="popupSelectedTab = 'popupMainInfo'"
                class="p-15px text-15px font-medium transition-colors"
                :class="
                  popupSelectedTab === 'popupMainInfo'
                    ? 'border-b-2 border-space text-space'
                    : 'border-none text-slate-custom'
                "
              >
                Основная информация
              </button>
              <button
                @click="popupSelectedTab = 'popupHistory'"
                class="p-15px text-15px font-medium transition-colors"
                :class="
                  popupSelectedTab === 'popupHistory'
                    ? 'border-b-2 border-space text-space'
                    : 'border-none text-slate-custom'
                "
              >
                История
              </button>
              <button
                @click="popupSelectedTab = 'popupComments'"
                class="p-15px text-15px font-medium transition-colors"
                :class="
                  popupSelectedTab === 'popupComments'
                    ? 'border-b-2 border-space text-space'
                    : 'border-none text-slate-custom'
                "
              >
                Комментарии
              </button>
            </div>
            <div
              class="relative"
              :style="{ height: tabContentHeight + 'px' }"
              :class="popupSelectedTab === 'popupComments' ? 'mb-0' : 'mb-25px'"
            >
              <div
                ref="tabContentInner"
                class="absolute left-[-25px] top-[-2px] w-[calc(100%+50px)] bg-athens-gray"
                :class="popupSelectedTab === 'popupComments' ? 'p-0' : 'p-15px'"
              >
                <div v-if="popupSelectedTab === 'popupMainInfo'">
                  <div
                    class="mb-2.5 flex gap-x-5 rounded-fifteen bg-white p-25px"
                  >
                    <div class="w-full">
                      <p class="mb-5px text-sm font-medium">Исполнитель</p>
                      <BtnResponseInput
                        v-model="selectedVacancy.executor"
                        :responses="executors"
                        :customer="'executor'"
                        @update:modelValue="updateResponse"
                      />
                    </div>
                    <div class="w-full">
                      <p class="mb-15px text-sm font-medium">Статус заявки</p>
                      <p class="text-sm text-slate-custom">
                        {{ selectedVacancy.status || 'Неизвестный статус' }}
                      </p>
                    </div>
                  </div>
                  <div
                    class="mb-2.5 flex gap-x-5 rounded-fifteen bg-white p-25px"
                  >
                    <div class="w-full">
                      <p class="mb-15px text-sm font-medium">Вакансия</p>
                      <BtnAddBindVacancy
                        v-model="vacancy"
                        :vacancies="vacancies"
                        @update:modelValue="updateResponse"
                      />
                    </div>
                    <div class="w-full">
                      <p class="mb-15px text-sm font-medium">Кандидаты</p>
                      <p class="text-sm text-slate-custom">
                        {{
                          detailedVacancy.vacancy
                            ? detailedVacancy.vacancy.candidates_count
                            : '0'
                        }}
                      </p>
                    </div>
                  </div>
                  <div class="rounded-fifteen bg-white p-25px">
                    <div class="mb-5 flex gap-x-15px">
                      <div class="w-full">
                        <p class="mb-15px text-sm font-medium">Заказчик</p>
                        <BtnResponseInput
                          :responses="clients"
                          v-model="clientName"
                          :placeholder="'ФИО заказчика'"
                          :minStyles="true"
                          :showRoles="true"
                          :customer="'client'"
                          @update:modelValue="updateResponse"
                        />
                      </div>
                      <div class="w-full">
                        <p class="mb-15px text-sm font-medium">
                          Ответственный заявки
                        </p>
                        <BtnResponseInput
                          :responses="executors"
                          v-model="responsibleName"
                          :placeholder="'ФИО ответственного'"
                          :minStyles="true"
                          :showRoles="true"
                          :customer="'responsible'"
                          @update:modelValue="updateResponse"
                        />
                      </div>
                    </div>
                    <div class="mb-5 flex gap-x-15px">
                      <div class="w-full">
                        <p class="mb-15px text-sm font-medium">Департамент</p>
                        <p class="text-sm font-normal text-slate-custom">
                          {{ detailedVacancy.division }}
                        </p>
                      </div>
                      <div class="w-full">
                        <p class="mb-15px text-sm font-medium">
                          Причина открытия вакансии
                        </p>
                        <p class="text-sm font-normal text-slate-custom">
                          {{ detailedVacancy.reason }}
                        </p>
                      </div>
                    </div>
                    <div class="mb-5 flex gap-x-15px">
                      <div class="w-full">
                        <p class="mb-15px text-sm font-medium">Зарплата</p>
                        <p class="text-sm font-normal text-slate-custom">
                          от {{ detailedVacancy.salaryFrom }} до
                          {{ detailedVacancy.salaryTo }}
                          {{ detailedVacancy.currency }}
                        </p>
                      </div>
                      <div class="w-full">
                        <p class="mb-15px text-sm font-medium">
                          Количество позиций
                        </p>
                        <p class="text-sm font-normal text-slate-custom">
                          {{ detailedVacancy.count }}
                        </p>
                      </div>
                    </div>
                    <div class="mb-5">
                      <p class="mb-15px text-sm font-medium">
                        Требования кандидата
                      </p>
                      <p class="text-sm font-normal text-slate-custom">
                        {{ detailedVacancy.require }}
                      </p>
                    </div>
                    <div class="mb-5">
                      <p class="mb-15px text-sm font-medium">
                        Обязанности кандидата
                      </p>
                      <p class="text-sm font-normal text-slate-custom">
                        {{ detailedVacancy.duty }}
                      </p>
                    </div>
                    <div class="flex gap-x-15px">
                      <div class="w-full">
                        <p class="mb-15px text-sm font-medium">
                          Начать подбор не позднее
                        </p>
                        <p class="text-sm font-normal text-slate-custom">
                          {{ detailedVacancy.dateStart }}
                        </p>
                      </div>
                      <div class="w-full">
                        <p class="mb-15px text-sm font-medium">
                          Желаемая дата выхода кандидата
                        </p>
                        <p class="text-sm font-normal text-slate-custom">
                          {{ detailedVacancy.dateWork }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="popupSelectedTab === 'popupHistory'">
                  <div class="[&>*:not(:last-of-type)]:mb-2.5">
                    <div
                      v-for="event in historyTabEvents"
                      :key="event.id"
                      class="flex rounded-fifteen bg-white px-25px py-15px"
                    >
                      <div>
                        <p class="mb-5px text-sm font-medium text-space">
                          {{ event.eventTitle }}
                        </p>
                        <p class="text-sm font-normal text-slate-custom">
                          {{ event.eventContent }}
                        </p>
                      </div>
                      <div class="ml-auto">
                        <p class="text-sm font-normal text-slate-custom">
                          {{
                            formatDateTime(event.eventLogDateTime).date
                          }}&nbsp;/&nbsp;{{
                            formatDateTime(event.eventLogDateTime).time
                          }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="popupSelectedTab === 'popupComments'">
                  <div>
                    <!-- <div>
                      <MinTimeline
                        :messages="messages"
                        :container-height="400"
                        :padding="{ top: 4, bottom: 25, left: 25, right: 25 }"
                      />
                    </div>
                    <MinChat /> -->
                    <ChatMin
                      :container-height="400"
                      :initial-messages="messages"
                      :padding="{ top: 10, bottom: 20, left: 25, right: 25 }"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div v-if="isDelete" class="flex gap-x-15px">
              <UiButton
                v-if="isDeleteApplication"
                variant="action"
                size="semiaction"
                @click="deleteApplicationSelect(selectedVacancy.id)"
              >
                Удалить
              </UiButton>
              <UiButton
                variant="action"
                size="semiaction"
                @click="() => handlerUpdateApplication(selectedVacancy)"
              >
                Готово
              </UiButton>
              <UiButton
                variant="back"
                size="second-back"
                class="font-medium"
                @click="closePopup"
              >
                Отмена
              </UiButton>
            </div>
            <div v-else class="flex gap-x-15px">
              <UiButton variant="action" size="semiaction" @click="addApprove">
                {{ !vacancy ? 'Создать вакансию' : 'Согласовать' }}
              </UiButton>
              <UiButton
                variant="back"
                size="second-back"
                class="font-medium"
                @click="rejectApplication"
              >
                Отклонить
              </UiButton>
            </div>
          </div>
        </template>
      </Popup>
    </transition>
    <transition
      name="fade"
      @after-leave="enableBodyScroll"
      @enter="disableBodyScroll"
    >
      <Popup
        :isOpen="isSaveVacancy"
        @close="() => (isSaveVacancy = false)"
        :width="'740px'"
        :showCloseButton="false"
        :disableOverflowHidden="true"
        :overflowContainer="true"
        maxHeight
        :lgSize="true"
      >
        <p class="mb-[10px] text-xl font-semibold leading-normal text-space">
          Заявка отправлена
        </p>
        <p class="mb-35px text-base font-normal text-slate-custom">
          Вы получите уведомление о ходе работы на почту
        </p>
        <UiButton
          variant="action"
          size="semiaction"
          class="font-bold"
          @click="() => (isSaveVacancy = false)"
        >
          Закрыть
        </UiButton>
      </Popup>
    </transition>
    <div
      v-if="loadingItem"
      class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
    >
      <UiCircleLoader />
    </div>
    <Pagination
      v-if="pagination.total_page > 1"
      :currentPage="pagination.current_page"
      :totalPages="pagination.last_page"
      @page-changed="handlePageChange"
    />

    <Popup
      :isOpen="isApprove"
      @close="() => (isApprove = false)"
      :width="'740px'"
      :showCloseButton="true"
      :disableOverflowHidden="true"
      :overflowContainer="true"
      maxHeight
      :lgSize="true"
    >
      <p class="mb-[10px] text-xl font-semibold leading-normal text-space">
        Вакансия успешно создана
      </p>
    </Popup>
    <Popup
      :isOpen="isNotApprove"
      @close="() => (isNotApprove = false)"
      :width="'740px'"
      :showCloseButton="true"
      :disableOverflowHidden="true"
      :overflowContainer="true"
      maxHeight
      :lgSize="true"
    >
      <p class="mb-[10px] text-xl font-semibold leading-normal text-space">
        Отклонение заявки
      </p>
      <p class="mb-35px text-base font-normal text-slate-custom">
        Заявка будет отклонена, заказчику придет уведомление об этом. Информация
        будет отражена в Заявке.
      </p>
      <p class="mb-13px text-sm font-medium text-space">Причина</p>
      <p class="mb-25px text-sm font-medium text-space">
        <MyTextarea
          v-model="rejectReason"
          :placeholder="'Заполните это поле'"
        />
      </p>
      <UiButton
        class="mt-20px"
        variant="action"
        size="semiaction"
        @click="sendReject(rejectReason)"
      >
        Отправить
      </UiButton>
      <span v-if="errorReject" class="mt-1 pl-3 text-xs text-red-500">
        {{ errorReject }}
      </span>
    </Popup>
  </div>
</template>

<script setup>
  import {
    ref,
    computed,
    onMounted,
    onUnmounted,
    onBeforeUnmount,
    nextTick,
    watch,
  } from 'vue';
  import dayjs from 'dayjs';
  import ResponseInput from '~/components/custom/ResponseInput.vue';
  import DotsDropdown from '~/components/custom/DotsDropdown.vue';
  import Popup from '~/components/custom/Popup.vue';
  import SimpleInput from '~/components/custom/SimpleInput.vue';
  import InputCalendar from '~/components/custom/InputCalendar.vue';
  import BtnResponseInput from '~/components/custom/BtnResponseInput.vue';
  import BtnAddBindVacancy from '~/components/custom/BtnAddBindVacancy.vue';
  import MyInput from '~/components/custom/MyInput.vue';
  import GeoInput from '~/components/custom/GeoInput.vue';
  import SalaryRange from '~/components/custom/SalaryRange.vue';
  import MyDropdown from '~/components/custom/MyDropdown.vue';
  import MyTextarea from '~/components/custom/MyTextarea.vue';
  import ChatMin from '~/components/custom/chat-min';
  import UiDotsLoader from '~/components/custom/UiDotsLoader.vue';
  import UiCircleLoader from '~/components/custom/UiCircleLoader.vue';
  import Pagination from '~/components/custom/Pagination.vue';
  import DropdownCalendarStatic from '~/components/custom/DropdownCalendarStatic.vue';
  import responses from '~/src/data/responses.json';
  import currency from '~/src/data/currency.json';

  import { fetchApplications } from '~/utils/applicationsList';
  import { fetchApplicationDetail, approve } from '~/utils/applicationItem';
  import { createApplication } from '~/utils/applicationCreate';
  import { deleteApplication } from '~/utils/applicationRemove';
  import { clientsList } from '~/utils/clientsList';
  import { executorsList, getDepartments } from '~/utils/executorsList';
  import { fetchApplicationUpdate } from '~/utils/applicationUpdate';
  import { getVacanciesNames } from '~/utils/getVacancies';
  import { loadScript } from '@/plugins/loader';
  import { profile } from '@/utils/loginUser';
  import { reject } from '@/utils/applicationItem';
  const isCreateVacancy = ref(false);

  import { API_YANDEX_KEY, API_YANDEX_SUGGEST } from '@/src/constants';

  import { useRouter } from 'vue-router';

  const router = useRouter();

  const applications = ref([]);
  const data = ref([]);
  const pagination = ref({
    current_page: 1,
    total: 1,
    per_page: 10,
    last_page: 1,
    links: [],
  });
  const error = ref(null);
  const loading = ref(true);
  const loadingItem = ref(false);
  const errorItem = ref(null);
  const isOpenDateFrom = ref(false);
  const isOpenDateTo = ref(false);
  const errorReject = ref(null);

  const headers = computed(() => {
    const baseHeaders = [
      { key: 'title', label: 'Вакансия' },
      { key: 'status', label: 'Статус' },
      { key: 'dateStart', label: 'Дата создания' },
      { key: 'executor', label: 'Согласующий' },
      { key: 'region', label: 'Город' },
      { key: 'dateWork', label: 'Закрыть до' },
    ];

    if (['admin', 'responsible'].includes(userRole.value)) {
      baseHeaders.splice(2, 0, { key: 'customer', label: 'Автор' });
    } else if (userRole.value === 'customer') {
      baseHeaders.splice(2, 0, { key: 'responsible', label: 'Ответственный' });
    }

    return baseHeaders;
  });

  const sortKey = ref('');
  const sortOrder = ref('asc');
  const userRole = ref('admin'); // Change to "admin" or "responsible" and "customer" for testing
  const dropdownOptions = ['Управлять', 'Копировать заявку', 'Удалить'];
  // const isNewAppPopup = ref(false)
  const isNewAppPopupAdmin = ref(false);
  const isNewAppPopupCustomer = ref(false);
  const isNewAppPopupResponsible = ref(false);
  const showNewResponse = ref(false);
  const newResponse = ref('');
  const responseContainer = ref(null);
  const newApplication = ref({});
  const newResponseResponsible = ref('');
  const showNewResponseResponsible = ref(false);
  const responseContainerResponsible = ref(null);
  const newExecutor = ref({ id: null, name: '' });
  const showNewExecutor = ref(false);
  const executorContainer = ref(null);
  const newCustomer = ref({ id: null, name: '' });
  const showNewCustomer = ref(false);
  const newClient = ref({ id: null, name: '' });
  const customerContainer = ref(false);
  const newPositionResponsible = ref('');
  const newDepartmentResponsible = ref('');
  const newRegionResponsible = ref('');
  const newReasonResponsible = ref('');
  const salaryMinResponsible = ref('');
  const salaryMaxResponsible = ref('');
  const vacancyCountResponsible = ref('');
  const requirementsResponsible = ref('');
  const responsibilitiesResponsible = ref('');
  const newResponseCustomer = ref('');
  const newPositionCustomer = ref('');
  const newDepartmentCustomer = ref('');
  const newRegionCustomer = ref('');
  const newReasonCustomer = ref('');
  const salaryMinCustomer = ref('');
  const salaryMaxCustomer = ref('');
  const vacancyCountCustomer = ref('');
  const requirementsCustomer = ref('');
  const responsibilitiesCustomer = ref('');
  const selectedVacancy = ref(null);
  const detailedVacancy = ref(null);
  const popupSelectedTab = ref('popupMainInfo');
  const tabContentInner = ref(null);
  const tabContentHeight = ref(0);
  const popupResponse = ref(null);
  const isSaveVacancy = ref(false);
  const rejectReason = ref('');

  const ArrayCurrency = currency;
  const clients = ref([]);
  const executors = ref([]);
  const departments = ref([]);
  const vacancies = ref([]);
  let resizeObserver = null;
  const errors = ref({});
  const updateData = ref({});
  const isDelete = ref(false);
  const isDeleteApplication = ref(false);
  const isAddApprove = ref(false);
  const isApprove = ref(false);
  const isNotApprove = ref(false);
  const reasonReject = ref(false);

  const { data: profileCustomer, error: errorProfile } = await profile();
  console.log('profileCustomer', profileCustomer);
  if (!errorProfile) {
  }
  // Функция обновления высоты контента
  const updateTabHeight = () => {
    nextTick(() => {
      if (tabContentInner.value) {
        tabContentHeight.value = tabContentInner.value.offsetHeight;
      } else {
        console.warn('tabContent is null when updating height');
      }
    });
  };

  const closeCalendare = () => {
    isOpenFrom(false);
  };

  const isOpenFrom = value => {
    isOpenDateFrom.value = value;
  };

  const deleteApplicationSelect = async id => {
    await deleteApplication(id);
    isDeleteApplication.value = false;
    selectedVacancy.value = false;
    loadApplications();
  };

  const statusWeights = {
    new: 1,
    in_review: 2,
    in_work: 3,
    paused: 4,
  };

  const sortedData = computed(() => {
    if (!sortKey.value) return data.value;

    return [...data.value].sort((a, b) => {
      const multiplier = sortOrder.value === 'asc' ? 1 : -1;

      if (sortKey.value === 'status') {
        return (statusWeights[a.status] - statusWeights[b.status]) * multiplier;
      }

      if (a[sortKey.value] > b[sortKey.value]) return 1 * multiplier;
      if (a[sortKey.value] < b[sortKey.value]) return -1 * multiplier;
      return 0;
    });
  });

  const sortBy = key => {
    if (sortKey.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey.value = key;
      sortOrder.value = 'asc';
    }
    let asc = sortOrder.value === 'asc' ? '' : '&asc=0';
    loadApplications(1, `sort=${sortKey.value}${asc}`);
  };

  const sortArrowStyle = key => {
    return {
      transform:
        sortKey.value === key && sortOrder.value === 'asc'
          ? 'rotate(180deg)'
          : 'rotate(0deg)',
      transition: 'transform 0.3s ease',
    };
  };

  const takeInWork = vacancy => {
    console.log(`Вакансия взята в работу: ${vacancy.title}`);
  };

  const openResponseInput = (vacancy, event) => {
    event.stopPropagation(); // Останавливаем всплытие события
    vacancy.showResponseInput = true;
  };

  const handleClickOutside = event => {
    const elTarget = event.target;
    //console.log('event', event.target);
    //обработчик события клика вне календаря
    // if ((!elTarget || !elTarget.classList.contains('.shadow-shadow-droplist')) || !elTarget.closest('.calendar-wrapper')) {
    console.log('close');
    // if (isOpenDateFrom.value)
    //     isOpenDateFrom.value = false
    // if (isOpenDateTo.value)
    //     isOpenDateTo.value = false
    //   console.log('isOpen', isOpenDateFrom.value);
    // }

    if (!isNewAppPopupAdmin.value && newApplication.value) {
      newApplication.value = {};
      errors.value = {};
    }
    data.value.forEach(vacancy => {
      if (vacancy.showResponseInput) {
        const element = document.querySelector(
          `[data-vacancy="${vacancy.title}"]`
        );
        if (element && !element.contains(event.target)) {
          // Если не было выбора, оставляем кнопку "Добавить"
          if (!vacancy.responseChoose) {
            vacancy.showResponseInput = false;
          } else {
            vacancy.showResponseInput = false;
          }
        }
      }
    });
  };

  const handleClickOutsideNewAppPopup = event => {
    if (
      responseContainer.value &&
      !responseContainer.value.contains(event.target)
    ) {
      if (!newResponse.value) {
        showNewResponse.value = false; // Закрываем input, если ничего не выбрано
      }
    }
  };

  const handleClickOutsideNewAppPopupResponsible = event => {
    if (
      responseContainerResponsible.value &&
      !responseContainerResponsible.value.contains(event.target)
    ) {
      if (!newResponseResponsible.value) {
        showNewResponseResponsible.value = false; // Закрываем input, если ничего не выбрано
      }
    }
  };

  const handleClickOutsideNewAppPopupExecutor = event => {
    if (
      executorContainer.value &&
      !executorContainer.value.contains(event.target)
    ) {
      if (!newExecutor.value.name) {
        showNewExecutor.value = false; // Закрываем input, если ничего не выбрано
      }
    }
  };

  const handleClickOutsideNewAppPopupCustomer = event => {
    if (
      customerContainer.value &&
      !customerContainer.value.contains(event.target)
    ) {
      if (!newCustomer.value.name) {
        showNewCustomer.value = false; // Закрываем input, если ничего не выбрано
      }
    }
  };

  const loadApplications = async (page = 1, params = '') => {
    // load data applications
    loading.value = true;
    try {
      const {
        applications: fetchedApplications,
        pagination: fetchedPagination,
      } = await fetchApplications(page, params);
      applications.value = fetchedApplications;
      data.value = applications.value.map(vacancy => ({
        ...vacancy,
        responsible: vacancy.responsible, // TODO: Заменить на данные из API
        candidates: 0, // TODO: Заменить на данные из API
        showResponseInput: false,
        responseChoose: '',
        approvals: vacancy.approvals,
      }));
      pagination.value = fetchedPagination;

      // получаем динамический список клиентов
      const { clients: clientData } = await clientsList();
      clients.value = clientData;
    } catch (error) {
      error.value = 'Ошибка загрузки заявок.';
      console.error(error);
    } finally {
      loading.value = false;
    }

    // получаем динамический список вакансий
    vacancies.value = await getVacanciesNames();

    // получаем динамический список исполнителей
    const { executors: executorData } = await executorsList();
    executors.value = executorData;
  };

  // Получаем динамический список отделов
  departments.value = await getDepartments();

  const handlePageChange = async page => {
    pagination.value.current_page = page;
    await loadApplications(page);
  };

  const getClients = async () => {
    const { clients } = await clientsList();

    return clients;
  };

  const getExecutors = async () => {
    const { executors } = await executorsList();

    return executors;
  };

  onMounted(async () => {
    await loadScript(
      `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${API_YANDEX_KEY}&suggest_apikey=${API_YANDEX_SUGGEST}`
    );
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('click', handleClickOutsideNewAppPopup);
    document.addEventListener(
      'click',
      handleClickOutsideNewAppPopupResponsible
    );
    document.addEventListener('click', handleClickOutsideNewAppPopupExecutor);
    document.addEventListener('click', handleClickOutsideNewAppPopupCustomer);
    loadApplications();
  });

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('click', handleClickOutsideNewAppPopup);
    document.removeEventListener(
      'click',
      handleClickOutsideNewAppPopupResponsible
    );
    document.removeEventListener(
      'click',
      handleClickOutsideNewAppPopupExecutor
    );
    document.removeEventListener(
      'click',
      handleClickOutsideNewAppPopupCustomer
    );
  });

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  });

  const updateResponseChoose = (vacancy, value) => {
    if (value) {
      vacancy.responseChoose = value;
      vacancy.showResponseInput = false;
    }
  };

  // popup's settings
  // config for control scroll
  function disableBodyScroll() {
    document.body.style.overflow = 'hidden'; // Отключаем прокрутку
  }

  function enableBodyScroll() {
    document.body.style.overflow = ''; // Включаем прокрутку
  }

  // const openNewResponse = event => {
  //   event.stopPropagation()
  //   showNewResponse.value = true
  // }

  // const updateNewResponse = value => {
  //   if (value) {
  //     newResponse.value = value
  //     showNewResponse.value = false
  //   }
  // }

  const openNewResponseResponsible = event => {
    event.stopPropagation();
    showNewResponseResponsible.value = true;
  };

  const openNewExecutor = event => {
    event.stopPropagation();
    showNewExecutor.value = true;
  };

  const openNewCustomer = event => {
    event.stopPropagation();
    showNewCustomer.value = true;
  };

  const updateNewResponseResponsible = value => {
    if (value) {
      newResponseResponsible.value = value;
      showNewResponseResponsible.value = false;
    }
  };

  function updateNewExecutor(value, id) {
    // сonsole.log('value executor ', value)
    if (value) {
      newExecutor.value.name = value;
      newExecutor.value.id = id;
      showNewExecutor.value = false;
      if (!newApplication.value.executor) {
        newApplication.value.executor = {};
      }
      newApplication.value.executor.id = id;
      newApplication.value.executor.name = value;
      // сonsole.log('newApplication.value.executor.id ', newApplication.value.executor.id)
    }
  }

  function updateNewResponsible(value, id) {
    if (value) {
      newExecutor.value.name = value;
      newExecutor.value.id = id;
      showNewExecutor.value = false;
      if (!newApplication.value.responsible) {
        newApplication.value.responsible = {};
      }
      newApplication.value.responsible.id = id;
      newApplication.value.responsible.name = value;
    }
  }

  const updateNewCustomer = (value, id) => {
    if (value) {
      newCustomer.value.name = value;
      newCustomer.value.id = id;
      showNewCustomer.value = false;
    }
  };

  const updateNewClient = (value, id) => {
    if (value) {
      newClient.value.name = value;
      newClient.value.id = id;
      showNewCustomer.value = false;
      if (!newApplication.value.client) {
        newApplication.value.client = {};
      }
      newApplication.value.client.id = id;
      newApplication.value.client.name = value;
    }
  };

  const closeNewApplicationPopup = () => {
    if (newApplication.value) {
      newApplication.value = {};
    }

    isNewAppPopupAdmin.value = false;
  };

  watch(selectedVacancy, newValue => {
    if (newValue) {
      // popup is opening
      nextTick(() => {
        if (tabContentInner.value) {
          let isInitialUpdate = true;
          resizeObserver = new ResizeObserver(() => {
            if (isInitialUpdate) {
              isInitialUpdate = false;
            } else {
              updateTabHeight();
            }
          });
          resizeObserver.observe(tabContentInner.value);
          updateTabHeight();
        } else {
          console.warn('tabContentInner is null after popup open');
        }
      });
    } else {
      // popup is closing
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
    }
  });

  // Следим за изменением выбранного таба и обновляем высоту
  watch(popupSelectedTab, () => {
    updateTabHeight();
  });

  const openPopup = async vacancy => {
    loadingItem.value = true;
    try {
      const fullData = await fetchApplicationDetail(vacancy.id);

      detailedVacancy.value = fullData.data;
      vacancy.value = detailedVacancy.value;
      if (detailedVacancy.value.status.name == 'На рассмотрении') {
        if (
          profileCustomer.data.role.name == 'Рекрутер' ||
          profileCustomer.data.role.name == 'Администратор'
        ) {
          isAddApprove.value = true;
        }
        if (
          profileCustomer.data.role.name == 'Клиент' ||
          profileCustomer.data.role.name == 'Администратор'
        ) {
          if (profileCustomer.data.role.name == 'Клиент') {
            isDelete.value = true;
          } else {
            isDelete.value = false;
          }
          if (isDeleteApplication.value) {
            isDeleteApplication.value = false;
          }
        } else {
          if (isDeleteApplication.value) {
            isDeleteApplication.value = false;
          }
        }
        reasonReject.value ? (reasonReject.value = false) : '';
      } else {
        if (isDeleteApplication.value) {
          isDeleteApplication.value = false;
        }
        if (
          detailedVacancy.value.status.name == 'Отклонена' &&
          detailedVacancy.value.approvals.length > 0
        ) {
          reasonReject.value = true;
        } else {
          reasonReject.value = false;
        }
        isAddApprove.value = false;
      }

      selectedVacancy.value = vacancy; // open popup
    } catch (error) {
      error.value = 'Ошибка загрузки деталей заявки.';
      console.error(error);
    } finally {
      loadingItem.value = false;
    }
  };

  const closePopup = () => {
    selectedVacancy.value = null;
    detailedVacancy.value = null;
  };

  const reasonseForOpenVacancy = [
    {
      name: 'Замена позиции',
      value: 0,
    },
    {
      name: 'Расширения',
      value: 1,
    },
    {
      name: 'Причина 3',
      value: 2,
    },
    {
      name: 'Причина 4',
      value: 3,
    },
    {
      name: 'Причина 5',
      value: 4,
    },
  ];

  const EVENT_TYPES = {
    CREATED: 'Создана заявка',
    UNDER_REVIEW: 'Принята к рассмотрению',
    ASSIGNED: 'Назначен ответственный',
  };

  const historyTabEvents = [
    {
      id: 1,
      eventTitle: EVENT_TYPES.CREATED,
      eventContent: 'Программист 1С на неполный день',
      eventLogDateTime: '2024-09-11T18:03:00',
    },
    {
      id: 2,
      eventTitle: EVENT_TYPES.UNDER_REVIEW,
      eventContent: 'Василисов Василий Сергеевич',
      eventLogDateTime: '2024-09-11T18:03:00',
    },
    {
      id: 3,
      eventTitle: EVENT_TYPES.ASSIGNED,
      eventContent: 'Михайлов Михаил Михайлович',
      eventLogDateTime: '2024-09-11T18:03:00',
    },
  ];

  const formatDateTime = dateTime => {
    return {
      date: dayjs(dateTime).format('DD.MM.YYYY'),
      time: dayjs(dateTime).format('HH:mm'),
    };
  };

  // const getStatusLabel = statusId => {
  //   console.log('Статус: ', statusId)
  //   const statusKey = Object.keys(statusWeights).find(
  //     key => statusWeights[key] === statusId
  //   )
  //   return statusKey ? statusLabels[statusKey] : 'Не указан'
  // }

  // Начальные данные (позже можно заменить на API)
  const messages = ref([
    {
      id: 1,
      type: 'standard',
      author: 'Василисов Василий Сергеевич',
      content: 'Пожалуйста, кто-то, закройте окно в коридоре, уже ДУЕТ!',
      dateTime: '2024-09-11T18:03:00',
    },
    {
      id: 2,
      type: 'with-recipient',
      author: 'Алексеев Алексей Алексеевич',
      recipients: ['Василисов Василий Сергеевич'],
      content: 'Коллега уважаемый, попробуй сделать это самостоятельно!',
      dateTime: '2024-09-11T18:03:00',
    },
    {
      id: 3,
      type: 'with-file',
      author: 'Георгиева Настасья Самбурская',
      recipients: [
        'Василисов Василий Сергеевич',
        'Алексеев Алексей Алексеевич',
      ],
      content:
        'Коллеги! Отчет готов! Прошу ознакомиться и дать обратную связь ближайшее время',
      file: { name: 'Какой-то отчет.pdf', format: 'pdf' },
      dateTime: '2024-09-11T18:03:00',
    },
    {
      id: 4,
      type: 'standard',
      author: 'Денисов Василис Алексеевич',
      content: 'Благодарность за отчет!',
      dateTime: '2024-09-11T18:03:00',
    },
    {
      id: 5,
      type: 'standard',
      author: 'Василисов Василий Сергеевич',
      content: 'Пожалуйста, кто-то, откройте окно в коридоре, уже не ДУЕТ!',
      dateTime: '2024-09-11T18:03:00',
    },
  ]);

  const validateForm = () => {
    const newErrors = {};

    if (!newApplication.value.responsible)
      newErrors.response = 'Укажите согласующего';
    if (!newApplication.value.position) newErrors.post = 'Укажите должность';
    if (!newApplication.value.city) newErrors.location = 'Укажите город поиска';
    if (!newApplication.value.count || newApplication.value.count <= 0) {
      newErrors.positions = 'Укажите корректное количество позиций';
    }
    if (newApplication.value.salaryFrom && newApplication.value.salaryTo) {
      if (newApplication.value.salaryFrom > newApplication.value.salaryTo) {
        newErrors.salaryTo =
          'Максимальная зарплата должна быть больше минимальной';
      }
    }
    if (!newApplication.value.currency)
      newApplication.value.currency = currency[0]['name'];
    if (!newApplication.value.reason) {
      newErrors.reason = 'Укажите причину открытия вакансии';
    }

    errors.value = newErrors;

    return Object.keys(newErrors).length === 0; // Возвращаем true, если ошибок нет
  };

  const applicationData = computed(() => {
    return {
      position: newApplication.value.position,
      division: newApplication.value.division,
      count: newApplication.value.count,
      salaryFrom: newApplication.value.salaryFrom,
      salaryTo: newApplication.value.salaryTo,
      currency: newApplication.value.currency,
      require: newApplication.value.require,
      duty: newApplication.value.duty,
      city: newApplication.value.city,
      reason: newApplication.value.reason.name,
      dateStart: newApplication.value.dateStart,
      dateWork: newApplication.value.dateWork,
      vacancy: newApplication.value.vacancy?.id,
      status: newApplication.value.status?.id,
      executor: newApplication.value.executor?.id,
      client: newApplication.value.client?.id,
      responsible: newApplication.value.responsible?.id,
    };
  });

  const createApplicationHandler = async () => {
    if (validateForm()) {
      try {
        const { data, error } = await createApplication(applicationData.value);
        if (!error) {
          isNewAppPopupAdmin.value = false; // Закрываем попап
          loadApplications();
          isSaveVacancy.value = true;
        } else if (error) {
          const status = error.status;
          const message = error.data?.message || error.message;

          if (status === 422) {
            console.warn('Validate error:', message);
          } else {
            console.warn('Error:', message);
          }
        }
      } catch (error) {
        console.error('Network error:', error.message);
      }
    } else {
      console.log('Form validation failed');
    }
  };

  const clientName = computed({
    get: () => {
      // Безопасная проверка на client и client.name
      return detailedVacancy.value.client?.name || '';
    },
    set: newValue => {
      // Обновляем detailedVacancy.client, если это необходимо
      if (detailedVacancy.value.client) {
        detailedVacancy.value.client.name = newValue;
      } else {
        // Если client === null, создаем объект client
        detailedVacancy.value.client = { id: 0, name: newValue }; // Или другой id
      }
    },
  });

  const responsibleName = computed({
    get: () => {
      // Безопасная проверка на responsible и responsible.name
      return detailedVacancy.value.responsible?.name || '';
    },
    set: newValue => {
      // Обновляем detailedVacancy.responsible, если это необходимо

      if (detailedVacancy.value.name) {
        detailedVacancy.value.responsible.name = newValue;
      } else {
        // Если responsible === null, создаем объект responsible
        detailedVacancy.value.responsible = { id: 0, name: newValue }; // Или другой id
      }
    },
  });

  const vacancy = computed({
    get: () => {
      // Безопасная проверка на responsible и responsible.name
      return detailedVacancy.value?.vacancy || null;
    },
    set: newValue => {
      // Обновляем detailedVacancy.responsible, если это необходимо

      if (detailedVacancy.value.name) {
        isCreateVacancy.value = false;
        detailedVacancy.value.vacancy.name = newValue;
      } else {
        isCreateVacancy.value = true;
        detailedVacancy.value.vacancy = { id: 0, name: newValue }; // Или другой id
      }
    },
  });

  const updateResponse = (value, id, key = null) => {
    if (key) {
      updateData.value[key] = id;
    }
  };

  const updateExecutor = () => {
    updateData.value.append('executor', id);
  };

  const handleRemoveApplication = async (item, vacancy) => {
    if (item === 'Удалить') {
      try {
        const { data, error } = await deleteApplication(vacancy.id);
        if (error) {
          console.error('Failed to delete application:', error);
          return;
        }
        // Опционально: обнови список заявок после удаления
        loadApplications(); // Если нужно перезагрузить список
      } catch (err) {
        console.error('Unexpected error during deletion:', err);
      }
    }
    if (item === 'Копировать заявку') {
      const { data, error } = await fetchApplicationDetail(vacancy.id);
      newApplication.value = data;
      isNewAppPopupAdmin.value = true;
    }
    if (item === 'Управлять') {
      openPopup(vacancy);
    }
  };

  const handlerUpdateApplication = async vacancy => {
    if (Object.keys(updateData.value).length > 0) {
      const { data, error } = await fetchApplicationUpdate(
        updateData.value,
        vacancy.id
      );
      updateData.value = {};
      loadApplications();
    }

    closePopup();
  };

  const rejectApplication = () => {
    selectedVacancy.value = false;
    isNotApprove.value = true;
  };

  const sendReject = async reason => {
    const { data: message, error: errorResponse } = await reject(
      detailedVacancy.value.id,
      reason
    );
    if (!errorResponse) {
      if (errorReject.value) {
        errorReject.value = null;
      }
      isNotApprove.value = false;
      await handlePageChange(pagination.value.current_page);
    } else {
      errorReject.value = errorResponse;
    }
  };

  const addApprove = async () => {
    selectedVacancy.value = false;
    if (!vacancy.value) {
      router.push(
        `/vacancies/newvacancy/?application=${detailedVacancy.value.id}`
      );
    } else {
      const idApplication = detailedVacancy.value.id;
      handlerUpdateApplication(detailedVacancy.value);
      await approve(idApplication);
      loadApplications();
    }
  };
</script>

<style scoped>
  .header-wrapper {
    grid-template-columns: 14.01% 14.01% 10.485% 10.662% 13.128% 14.01% 14.01% 3.525%;
  }

  .items-wrapper {
    grid-template-columns: 13.833% 13.833% 10.485% 10.662% 13.833% 13.833% 13.833% 3.525%;
  }

  /* Анимация появления и скрытия */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .fade-leave-from {
    opacity: 1;
  }
  .text-red-500 {
    --tw-text-opacity: 1;
    color: rgb(239 68 68 / var(--tw-text-opacity, 1));
  }
  .text-green-500 {
    --tw-text-opacity: 1;
    color: rgb(73 145 73 / var(--tw-text-opacity, 1));
  }
</style>
