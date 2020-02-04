<template>
  <div class="carousel">
    <div
      ref="slides"
      class="slides"
      :class="direction"
      :style="{ transform }"
      @panstart="onPanStart"
      @panmove="onPanMove"
      @panend="onPanEnd"
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
    },

    threshold: {
      type: Number,
      default: 20
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
    onPanStart(e) {
      this.RAF = false
      this.prevPanTime = this.panTime = e.timeStamp
      this.prevPanPos = this.panPos = this.direction === 'row' ? e.detail.clientX : e.detail.clientY
      this.currOffset = this.offset
      this.clientSize = this.direction === 'row' ? this.$refs.slides.clientWidth : this.$refs.slides.clientHeight
      this.scrollSize = this.direction === 'row' ? this.$refs.slides.scrollWidth : this.$refs.slides.scrollHeight
      this.minOffset = this.clientSize - this.scrollSize
    },

    onPanMove(e) {
      const panPos = this.direction === 'row' ? e.detail.clientX : e.detail.clientY

      if (panPos !== this.prevPanPos) {
        this.prevPanTime = this.panTime
        this.prevPanPos = this.panPos
        this.panTime = e.timeStamp
        this.panPos = panPos

        this.currOffset = this.getOffset(this.offset + (this.direction === 'row' ? e.detail.offsetX : e.detail.offsetY))

        this.transform = this.direction === 'row'
          ? `translateX(${this.currOffset}px)`
          : `translateY(${this.currOffset}px)`
      }
    },

    onPanEnd(e) {
      if (this.currOffset !== this.offset) {
        let offset = this.offset
        const s = Math.abs(this.panPos - this.prevPanPos)
        const v = s / Math.abs(e.timeStamp - this.prevPanTime)
        console.log(v)

        if (Math.abs(this.currOffset - this.offset) >= this.threshold || v >= 0.5) {
          offset = this.getOffset(
            (this.currOffset > this.offset ? Math.ceil : Math.floor)(this.currOffset / this.clientSize) *
            this.clientSize
          )
        }

        this.animate(this.currOffset, offset, v >= 0.5 ? v : 0.5)
      }
    },

    animate(from, to, v0) {
      console.log(to)
      this.RAF = true
      const d = Math.abs(to - from)
      let start

      const animate = now => {
        if (!start) {
          start = now
        } else {
          const t = now - start
          let s = Math.abs(Math.round(v0 * t - 0.15 * t * t / 2))

          if (s > d) {
            s = d
          }

          this.offset = from + (from > to ? -s : s)
          console.log(this.offset)

          this.transform = this.direction === 'row'
            ? `translateX(${this.offset}px)`
            : `translateY(${this.offset}px)`
        }

        if (this.RAF && this.offset !== to) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    },

    getOffset(offset) {
      return Math.max(Math.min(offset, 0), this.minOffset)
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
