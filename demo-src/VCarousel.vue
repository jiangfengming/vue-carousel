<template>
  <div class="carousel">
    <div
      ref="slides"
      class="slides"
      :class="direction"
      :style="{ transform }"
      @panmove="panMove"
      @panend="panEnd"
    >
      <slot />
    </div>
  </div>
</template>

<script>
import panEvents from 'pan-events'

export default {
  name: 'VCarousel',

  props: {
    direction: {
      type: String,
      default: 'row' // row, column
    }
  },

  data: () => ({
    transform: '',
    offset: 0
  }),

  mounted() {
    panEvents(this.$refs.slides)
  },

  methods: {
    panMove(e) {
      this.transform = this.direction === 'row'
        ? `translateX(${this.getOffset(e)}px)`
        : `translateY(${this.getOffset(e)}px)`
    },

    panEnd(e) {
      this.offset = this.getOffset(e)
    },

    getOffset(e) {
      return this.direction === 'row'
        ? Math.max(
          Math.min(this.offset + e.detail.offsetX, 0),
          -(this.$refs.slides.scrollWidth - this.$refs.slides.clientWidth)
        )
        : Math.max(
          Math.min(this.offset + e.detail.offsetY, 0),
          -(this.$refs.slides.scrollHeight - this.$refs.slides.clientHeight)
        )
    }
  }
}
</script>

<style scoped>
.slides {
  display: flex;
}

.slides.row {
  flex-wrap: nowrap;
}

.slides.column {
  flex-direction: column
}
</style>
