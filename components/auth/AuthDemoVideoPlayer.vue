<template>
  <video-player
    src="/assets/demo1.mp4"
    poster="/assets/cover3.png"
    controls
    :loop="false"
    :volume="0.6"
    :width="442.5"
    style="height: 100%"
  />
</template>

<script setup>
import { VideoPlayer } from '@videojs-player/vue'
import 'video.js/dist/video-js.css'
</script>
