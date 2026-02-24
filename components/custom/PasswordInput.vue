<script setup>
import { ref, watch } from 'vue'

const passRef = ref(null)
const passView = ref(false)
const password = ref('')

const props = defineProps({
    modelValue: {
        type: [String, Number],
        default: null,
    },
    placeholder: {
        type: String,
        default: 'Введите пароль',
    },
    invalid: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['update:modelValue', 'blur'])

watch(() => props.modelValue, (newValue) => {
    password.value = newValue || '';
});

function passToggle() {
    passView.value = !passView.value;
    passRef.value.type = passView.value ? 'text' : 'password';
}

const updateValue = event => {
    password.value = event.target.value
    emit('update:modelValue', password.value)
}

const handleBlur = (event) => {
    console.log('Input value on blur:', event.target.value);
    emit('blur', event)
    console.log('Blur triggered')
}

</script>

<template>
    <div class="relative">
        <input type="password" ref="passRef"
          class="password-input text-sm font-normal rounded-ten min-h-10 w-full pl-15px focus:outline-none focus:border focus:border-dodger"
          :class="invalid ? 'border border-red-500 bg-athens-gray' : 'border border-athens bg-athens-gray'"
          :placeholder="placeholder" @blur="handleBlur" v-model="password" @input="updateValue">
        <button class="toggle-pass" @click="passToggle">
            <span v-if="passView" class="pass-show"></span>
            <span v-else class="pass-hide"></span>
        </button>
    </div>
</template>

<style scoped>
.toggle-pass {
    position: absolute;
    top: 50%;
    right: 15px;
    transform: translateY(-50%);
    display: flex;
}

.pass-show {
    background-image: url('/assets/img/eyeShow.svg');
    background-size: contain;
    background-repeat: no-repeat;
    width: 20px;
    height: 20px;
}

.pass-hide {
    background-image: url('/assets/img/eyeHide.svg');
    background-size: contain;
    background-repeat: no-repeat;
    width: 20px;
    height: 20px;
}
</style>