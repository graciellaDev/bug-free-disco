<template>
    <div :class="isOpen ? 'overflow-visible' : 'overflow-hidden'">
        <div @click="toggle" class="cursor-pointer flex items-center">
            <svg-icon :name="isOpen ? 'accordion-minus' : 'accordion-plus'" width="20" height="20" class="mr-5px" />
            <span class="text-dodger text-sm font-medium select-none">{{ isOpen ? `Скрыть ${title}` : title }}</span>
        </div>
        <div ref="content" :style="contentStyles" :class="['transition-all duration-300 ease-in-out', isOpen ? 'overflow-visible' : 'overflow-hidden']">
            <div ref="innerContent" class="pt-25px pb-15px">
                <slot />
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "MyAccordion",
    props: {
        title: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            isOpen: false,
            contentHeight: 0,
            resizeObserver: null,
            observedEl: null,
        };
    },
    computed: {
        contentStyles() {
            return {
                maxHeight: this.isOpen ? `${this.contentHeight}px` : "0px",
            };
        },
    },
    methods: {
        toggle() {
            this.isOpen = !this.isOpen;
            this.updateContentHeight();
        },
        updateContentHeight() {
            this.$nextTick(() => {
                const content = this.$refs.innerContent || this.$refs.content?.querySelector("div");
                this.contentHeight = content ? content.scrollHeight : 0;
            });
        },
    },
    mounted() {
        this.$nextTick(() => {
            const el = this.$refs.innerContent || this.$refs.content?.querySelector("div");
            if (el && typeof ResizeObserver !== "undefined") {
                this.observedEl = el;
                this.resizeObserver = new ResizeObserver(() => {
                    if (this.isOpen) this.updateContentHeight();
                });
                this.resizeObserver.observe(el);
            }
        });
    },
    beforeUnmount() {
        if (this.resizeObserver && this.observedEl) {
            this.resizeObserver.unobserve(this.observedEl);
        }
    },
};
</script>
