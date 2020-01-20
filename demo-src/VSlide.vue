<template>
  <div class="slide"><slot /></div>
</template>

<script>
export default {
  name: 'VSlide'
}
</script>

<style scoped>
.slide {
  flex-shrink: 0;
}
</style>
