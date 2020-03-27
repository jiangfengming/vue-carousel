<template>
  <div class="slide"><slot /></div>
</template>

<script>
import elementResizeDetectorMaker from 'element-resize-detector'

export default {
  name: 'Slide',
  inject: ['carousel'],

  mounted() {
    this.carousel.$emit('slide-resize')

    this.resizeDetector = elementResizeDetectorMaker({
      strategy: 'scroll',
      callOnAdd: false
    })

    this.resizeDetector.listenTo(this.$el, () => {
      this.carousel.$emit('slide-resize')
    })
  },

  destroyed() {
    this.resizeDetector.uninstall(this.$el)
    this.carousel.$emit('slide-resize')
  }
}
</script>

<style scoped>
.slide {
  flex-shrink: 0;
}
</style>
