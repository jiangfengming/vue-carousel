<template>
  <div class="slide"><slot /></div>
</template>

<script>
import elementResizeDetectorMaker from 'element-resize-detector'

export default {
  name: 'VSlide',

  mounted() {
    this.$parent.$emit('resize')

    this.resizeDetector = elementResizeDetectorMaker({
      strategy: 'scroll',
      callOnAdd: false
    })

    this.resizeDetector.listenTo(this.$el, () => {
      this.$parent.$emit('resize')
    })
  },

  destroyed() {
    this.resizeDetector.uninstall(this.$el)
    this.$parent.$emit('resize')
  }
}
</script>

<style scoped>
.slide {
  flex-shrink: 0;
}
</style>
