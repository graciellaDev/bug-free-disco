<template>
  <div
    class="auth-letter-pattern"
    aria-hidden="true"
  >
    <div class="auth-letter-pattern__glow auth-letter-pattern__glow--tl" />
    <div class="auth-letter-pattern__glow auth-letter-pattern__glow--br" />

    <svg
      v-for="(item, index) in letters"
      :key="index"
      class="auth-letter-pattern__glyph"
      :style="glyphStyle(item)"
      viewBox="0 0 133 133"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24.3833 54.958H44.6755V101.003H24.3833V54.958Z"
        fill="currentColor"
      />
      <path
        d="M54.5693 53.727L74.1779 48.9104L91.699 100.988L72.0904 101.003L54.5693 53.727Z"
        fill="currentColor"
      />
      <path
        d="M88.5028 32.2491H108.617L99.6179 101.065L79.5041 100.998L88.5028 32.2491Z"
        fill="currentColor"
      />
      <path
        d="M24.3833 55.1882C24.3833 49.5469 26.6205 44.0979 30.6779 39.8565C34.7354 35.6152 40.3366 32.8706 46.4377 32.1343C52.5389 31.3979 58.724 32.72 63.8408 35.8542C68.9575 38.9883 72.6568 43.7208 74.2495 49.1699L54.6488 53.9845C54.3302 52.8947 53.5903 51.9482 52.567 51.3214C51.5437 50.6946 50.3066 50.4302 49.0864 50.5774C47.8662 50.7247 46.7459 51.2736 45.9344 52.1219C45.1229 52.9701 44.6755 54.0599 44.6755 55.1882H24.3833Z"
        fill="currentColor"
      />
    </svg>
  </div>
</template>

<script setup>
/** Хаотичное поле букв N из фавикона — по краям экрана, центр светлее под карточку */
const letters = [
  { top: '4%', left: '3%', size: 88, rotate: -28, opacity: 0.09, blur: 0 },
  { top: '11%', left: '72%', size: 120, rotate: 19, opacity: 0.06, blur: 0 },
  { top: '22%', left: '14%', size: 56, rotate: 12, opacity: 0.11, blur: 0 },
  { top: '18%', left: '88%', size: 64, rotate: -35, opacity: 0.08, blur: 0 },
  { top: '38%', left: '2%', size: 140, rotate: -14, opacity: 0.05, blur: 1 },
  { top: '42%', left: '92%', size: 100, rotate: 24, opacity: 0.07, blur: 0 },
  { top: '55%', left: '8%', size: 48, rotate: -8, opacity: 0.12, blur: 0 },
  { top: '58%', left: '78%', size: 72, rotate: 42, opacity: 0.09, blur: 0 },
  { top: '68%', left: '22%', size: 96, rotate: -22, opacity: 0.06, blur: 0 },
  { top: '72%', left: '58%', size: 52, rotate: 16, opacity: 0.1, blur: 0 },
  { top: '78%', left: '4%', size: 76, rotate: 31, opacity: 0.08, blur: 0 },
  { top: '82%', left: '85%', size: 110, rotate: -18, opacity: 0.05, blur: 1 },
  { top: '88%', left: '38%', size: 44, rotate: -42, opacity: 0.11, blur: 0 },
  { top: '32%', left: '48%', size: 200, rotate: 6, opacity: 0.035, blur: 2 },
  { top: '6%', left: '42%', size: 36, rotate: 55, opacity: 0.14, blur: 0 },
  { top: '48%', left: '68%', size: 40, rotate: -55, opacity: 0.13, blur: 0 },
  { top: '92%', left: '62%', size: 68, rotate: 8, opacity: 0.07, blur: 0 },
  { top: '26%', left: '52%', size: 28, rotate: -12, opacity: 0.15, blur: 0 },
]

function glyphStyle(item) {
  return {
    top: item.top,
    left: item.left,
    width: `${item.size}px`,
    height: `${item.size}px`,
    transform: `rotate(${item.rotate}deg)`,
    opacity: String(item.opacity),
    filter: item.blur ? `blur(${item.blur}px)` : undefined,
  }
}
</script>

<style scoped>
.auth-letter-pattern {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background:
    radial-gradient(ellipse 85% 70% at 50% 45%, rgba(255, 255, 255, 0.55) 0%, transparent 62%),
    linear-gradient(145deg, #e4e9f2 0%, #edeff5 42%, #e8edf6 100%);
}

.auth-letter-pattern__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}

.auth-letter-pattern__glow--tl {
  top: -12%;
  left: -8%;
  width: 42vmin;
  height: 42vmin;
  background: rgba(88, 152, 255, 0.18);
}

.auth-letter-pattern__glow--br {
  bottom: -15%;
  right: -10%;
  width: 50vmin;
  height: 50vmin;
  background: rgba(88, 152, 255, 0.12);
}

.auth-letter-pattern__glyph {
  position: absolute;
  color: #5898ff;
  transform-origin: center center;
  will-change: transform;
  animation: auth-n-drift 22s ease-in-out infinite alternate;
}

.auth-letter-pattern__glyph:nth-child(odd) {
  animation-duration: 26s;
  animation-direction: alternate-reverse;
}

.auth-letter-pattern__glyph:nth-child(3n) {
  animation-duration: 30s;
}

@keyframes auth-n-drift {
  from {
    translate: 0 0;
  }
  to {
    translate: 6px -8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-letter-pattern__glyph {
    animation: none;
  }
}

@media (max-width: 640px) {
  .auth-letter-pattern__glyph:nth-child(n + 14) {
    display: none;
  }
}
</style>
