<template>
    <div class="table-container">
            <div class="table-header">
                <div class="px-2.5">Профиль</div>
                <div class="px-2.5">Email</div>
                <div class="px-2.5">Роль</div>
                <div></div>
            </div>
            <div class="table-body">
                <div v-for="item in users" :key="item.id" class="table-row">
                    <div class="text-sm font-medium text-dodger px-2.5 flex items-center gap-x-2.5">
                        <div class="rounded-full user-outline">
                            <CardIcon :icon="true" :isPng="true" imagePath="/img/user.png" :width="45"
                              :height="45" />
                        </div>
                        <div @mouseenter="hoveredIndex = item.id" @mouseleave="hoveredIndex = null"
                          :class="{ 'user-hovered': hoveredIndex === item.id }" class="cursor-pointer select-none">{{
                            item.name
                            }}</div>
                    </div>
                    <div class="text-sm font-medium text-space px-2.5">{{ item.email }}</div>
                    <div class="text-sm font-medium text-space px-2.5">{{ item.role }} </div>
                    <div>
                        <DotsDropdonw :items="dropdownOptions" @select-item="(selectedItem) => handleDropdownSelect(selectedItem, item)" />
                    </div>
                </div>
            </div>
        </div>
</template>

<script setup>
import CardIcon from '~/components/custom/CardIcon.vue';
import DotsDropdonw from '~/components/custom/DotsDropdown.vue';

const props = defineProps({
    users: {
        type: Array,
        default: []
    },
    dropdownOptions: {
        type: Array,
        default: []
    }
})

const emit = defineEmits(['delete-user']);

const handleDropdownSelect = (item, user) => {
    if (item === 'Удалить') {
        emit('delete-user', user);
    }
};

const hoveredIndex = ref(null);
</script>

<style scoped>
.table-container {
    display: grid;
    grid-template-rows: auto;
    gap: 1px;
    width: 100%;
}

.table-body {
    display: grid;
    gap: 1px;
}

.table-header,
.table-row {
    display: grid;
    grid-template-columns: 26.667% 44.89% 17.778% 3.556%;
    gap: 15px;
    /* Горизонтальный отступ */
    padding: 20px 25px;
    align-items: center;
    /* Центрирование содержимого */
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
}

.user-outline {
    outline: 2px solid rgba(0, 82, 208, 0.2);
    outline-offset: -2px;
}

.table-row:last-child {
    border-radius: 0 0 15px 15px;
}

.user-hovered {
    text-decoration: underline;
}
</style>