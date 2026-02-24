<template>
    <div class="table-container" :class="{ 'table-container--vacancy-team': variant === 'vacancyTeam' }">
            <!-- Шапка: режим «Команда вакансии» -->
            <div v-if="variant === 'vacancyTeam'" class="table-header table-header--vacancy-team">
                <div class="cell-inner">Профиль (фио)</div>
                <div class="cell-inner">Email (почта)</div>
                <div class="cell-inner">Доступ</div>
                <div></div>
            </div>
            <!-- Шапка: режим «Настройки» -->
            <div v-else class="table-header">
                <div class="cell-inner">Профиль (фио и отдел)</div>
                <div class="cell-inner">Почта и телефон</div>
                <div class="cell-inner">Отдел и город</div>
                <div class="cell-inner">Статус</div>
                <div></div>
            </div>
            <!-- Тело: режим «Команда вакансии» — только плоский список -->
            <template v-if="variant === 'vacancyTeam'">
                <div class="table-body table-body--vacancy-team">
                    <div v-for="item in users" :key="item.id" class="table-row table-row--vacancy-team table-row-last-in-section">
                        <div class="cell-inner">
                            <span class="text-sm font-medium text-space">{{ item.name || '—' }}</span>
                        </div>
                        <div class="cell-inner">
                            <span class="text-sm font-medium text-space">{{ item.email || '—' }}</span>
                        </div>
                        <div class="cell-inner">
                            <span class="text-sm font-medium text-space">{{ item.role || '—' }}</span>
                        </div>
                        <div>
                            <DotsDropdonw :items="dropdownOptions" @select-item="(selectedItem) => handleDropdownSelect(selectedItem, item)" />
                        </div>
                    </div>
                </div>
            </template>
            <!-- Тело: режим «Настройки» с разделами или плоским списком -->
            <template v-else>
                <template v-if="groupedSections?.length">
                    <template v-for="(section, sIdx) in groupedSections" :key="section.sectionTitle">
                        <div class="table-section-title">{{ section.sectionTitle }}</div>
                        <div
                            v-for="item in section.users"
                            :key="item.id"
                            class="table-row"
                            :class="{ 'table-row-last-in-section': sIdx === groupedSections.length - 1 && section.users.indexOf(item) === section.users.length - 1 }"
                        >
                            <div class="cell-inner flex flex-col gap-0.5">
                                <span class="text-sm font-medium text-space">{{ item.name || '—' }}</span>
                                <span class="text-xs text-bali">{{ item.position || 'Должность не указана' }}</span>
                            </div>
                            <div class="cell-inner flex flex-col gap-0.5">
                                <span class="text-sm font-medium text-space">{{ item.email || '—' }}</span>
                                <span class="text-xs text-bali">{{ item.phone || 'Телефон не указан' }}</span>
                            </div>
                            <div class="cell-inner flex flex-col gap-0.5">
                                <span class="text-sm font-medium text-space">{{ item.departmentName || 'Отдел не указан' }}</span>
                                <span class="text-xs text-bali">{{ item.city || 'Город не указан' }}</span>
                            </div>
                            <div class="cell-inner flex flex-col gap-0.5">
                                <span class="text-sm font-medium text-space">{{ item.statusDisplay ?? statusText }}</span>
                            </div>
                            <div>
                                <DotsDropdonw :items="dropdownOptions" @select-item="(selectedItem) => handleDropdownSelect(selectedItem, item)" />
                            </div>
                        </div>
                    </template>
                </template>
                <div v-else class="table-body">
                    <div v-for="item in users" :key="item.id" class="table-row table-row-last-in-section">
                        <div class="cell-inner flex flex-col gap-0.5">
                            <span class="text-sm font-medium text-space">{{ item.name || '—' }}</span>
                            <span class="text-xs text-bali">{{ item.position || 'Должность не указана' }}</span>
                        </div>
                        <div class="cell-inner flex flex-col gap-0.5">
                            <span class="text-sm font-medium text-space">{{ item.email || '—' }}</span>
                            <span class="text-xs text-bali">{{ item.phone || 'Телефон не указан' }}</span>
                        </div>
                        <div class="cell-inner flex flex-col gap-0.5">
                            <span class="text-sm font-medium text-space">{{ item.departmentName || 'Отдел не указан' }}</span>
                            <span class="text-xs text-bali">{{ item.city || 'Город не указан' }}</span>
                        </div>
                        <div class="cell-inner flex flex-col gap-0.5">
                            <span class="text-sm font-medium text-space">{{ item.statusDisplay ?? statusText }}</span>
                        </div>
                        <div>
                            <DotsDropdonw :items="dropdownOptions" @select-item="(selectedItem) => handleDropdownSelect(selectedItem, item)" />
                        </div>
                    </div>
                </div>
            </template>
        </div>
</template>

<script setup>
import DotsDropdonw from '~/components/custom/DotsDropdown.vue';

const props = defineProps({
    users: {
        type: Array,
        default: () => []
    },
    /** Режим таблицы: 'settings' — настройки, 'vacancyTeam' — команда вакансии (профиль, email, доступ). */
    variant: {
        type: String,
        default: 'settings'
    },
    /** Если задано, таблица рендерится по разделам (Администраторы, Рекрутеры, Заказчики). Пустые разделы не показываются. Только для variant='settings'. */
    groupedSections: {
        type: Array,
        default: () => []
    },
    dropdownOptions: {
        type: Array,
        default: () => []
    },
    statusText: {
        type: String,
        default: ''
    }
})

const emit = defineEmits(['delete-user', 'edit-user', 'change-password']);

const handleDropdownSelect = (item, user) => {
    if (item === 'Удалить') {
        emit('delete-user', user);
    } else if (item === 'Редактировать') {
        emit('edit-user', user);
    } else if (item === 'Изменить пароль') {
        emit('change-password', user);
    }
};
</script>

<style scoped>
.table-container {
    display: grid;
    grid-template-rows: auto;
    gap: 1px;
    width: 100%;
    min-width: 0;
}

.table-body {
    display: grid;
    gap: 1px;
}

.table-header,
.table-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1.2fr 48px;
    gap: 15px;
    padding: 20px 25px;
    align-items: center;
}

.table-header--vacancy-team,
.table-row--vacancy-team {
    grid-template-columns: 1fr 1fr 1fr 48px;
}

.table-body--vacancy-team {
    display: grid;
    gap: 1px;
}

.table-header {
    background-color: #f5f7fa;
    border-radius: 15px 15px 0 0;
    font-weight: 500;
    font-size: 14px;
    color: #79869a;
    text-align: left;
}

.table-row {
    background-color: #ffffff;
    border-bottom: 1px solid #e8eaef;
}

.table-row-last-in-section.table-row:last-child,
.table-row.table-row-last-in-section:last-child {
    border-radius: 0 0 15px 15px;
}
.table-row:last-child {
    border-bottom: none;
}

.table-section-title {
    grid-column: 1 / -1;
    padding: 14px 25px;
    font-weight: 600;
    font-size: 20px;
    color: #2F353D;
    background-color: #fff;
    border-bottom: 1px solid #f0f0f0;
}
</style>
