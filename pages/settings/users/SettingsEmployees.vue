<template>
  <div class="page-wrap">
    <div class="default-template header-block">
      <UsersHead
        typeUser="recruiter"
        title="Сотрудники"
        :show-tabs="false"
        activeTab="list"
        @childClick="refreshList"
      />
    </div>
    <div class="default-template table-block">
      <TableClients
        typeList="list"
        :list="mergedList"
        emptyText="У вас пока нет сотрудников"
        @update="refreshList"
        @delete-user="onDeleteUser"
        @save-edit="onSaveEdit"
      />
    </div>
  </div>
</template>

<script setup>
import TableClients from '@/components/settings/TableClients.vue';
import UsersHead from '@/components/settings/UsersHead.vue';
import { clientsList } from '@/utils/clientsList';
import { updateEmployee, deleteEmployee } from '@/utils/registerUser';

definePageMeta({
  layout: 'settings',
});

useHead({
  title: 'Настройки — Сотрудники',
});

const listActive = ref([]);

async function loadAll() {
  const [employeesRes, invitesRes, clientsActiveRes, clientsInvitesRes] = await Promise.all([
    clientsList('employees'),
    clientsList('recruiters', 'status=new'),
    clientsList('clients', 'status=active'),
    clientsList('clients', 'status=new'),
  ]);
  const byId = new Map();
  if (!employeesRes.errors && Array.isArray(employeesRes.clients)) {
    for (const c of employeesRes.clients) {
      byId.set(c.id, { ...c, statusDisplay: 'Активен' });
    }
  }
  if (!invitesRes.errors && Array.isArray(invitesRes.clients)) {
    for (const c of invitesRes.clients) {
      if (!byId.has(c.id)) {
        byId.set(c.id, {
          ...c,
          role: c.role || 'Рекрутер',
          statusDisplay: 'Сотрудник еще не принял приглашение, отправленное на почту',
        });
      }
    }
  }
  // Добавляем заказчиков из API clients (активные и приглашённые), чтобы они точно отображались в разделе «Заказчики»
  const addClients = (res, statusDisplay) => {
    if (res.errors || !Array.isArray(res.clients)) return;
    for (const c of res.clients) {
      const existing = byId.get(c.id);
      if (existing) {
        if (!existing.role || existing.role === 'Менеджер') {
          byId.set(c.id, { ...existing, role: 'Заказчик' });
        }
      } else {
        byId.set(c.id, { ...c, role: 'Заказчик', statusDisplay });
      }
    }
  };
  addClients(clientsActiveRes, 'Активен');
  addClients(clientsInvitesRes, 'Сотрудник еще не принял приглашение, отправленное на почту');
  listActive.value = Array.from(byId.values());
}

const mergedList = computed(() => listActive.value);

function refreshList() {
  return loadAll();
}

await loadAll();

async function onDeleteUser(user) {
  const id = user?.id ?? user?.user_id;
  if (id == null || id === undefined) return;
  const numId = Number(id);
  const { error, message } = await deleteEmployee(numId);
  if (error) {
    console.warn('Ошибка удаления сотрудника:', message ?? numId);
  }
  await refreshList();
}

async function onSaveEdit(payload) {
  if (payload?.id) {
    const { error } = await updateEmployee(Number(payload.id), payload);
    if (error) {
      console.warn('Ошибка сохранения сотрудника:', payload);
    }
  }
  refreshList();
}
</script>

<style scoped>
.default-template {
  background-color: #fff;
  padding: 25px;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
}
/* Шапка без внешнего padding — отступы только внутри (25px), как на странице «Отделы и роли» */
.default-template.header-block {
  padding: 0;
}
.default-template.table-block {
  padding: 0;
  flex: 1;
  min-height: 0;
}
/* Отступ до таблицы = половина отступа до меню слева (25px / 2) */
.default-template:not(:last-child) {
  margin-bottom: 12.5px;
}
.page-wrap {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
</style>
