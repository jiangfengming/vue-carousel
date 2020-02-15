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
const a = 0.08

import panEvents from 'pan-events'

export default {
  name: 'VCarousel',

  props: {
    direction: {
      type: String,
      default: 'horizontal' // horizontal, vertical
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

  computed: {
    isVertical() {
      return this.direction === 'vertical'
    },

    isHorizontal() {
      return this.direction === 'horizontal'
    }
  },

  mounted() {
    panEvents(this.$refs.slides)
    this.calcTransitionOffsets()
  },

  methods: {
    calcTransitionOffsets() {
      this.transitionOffsets = []
      const $slides = this.$refs.slides
      const slides = $slides.children

      if (!slides.length) {
        return
      }

      const clientSize = this.isHorizontal ? $slides.clientWidth : $slides.clientHeight
      const scrollSize = this.isHorizontal ? $slides.scrollWidth : $slides.scrollHeight
      const minOffset = scrollSize - clientSize
      const parentOffset = this.isHorizontal ? $slides.offsetLeft : $slides.offsetTop

      let prevOffset = 0
      let nextOffset = 0

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i]
        const offset = (this.isHorizontal ? slide.offsetLeft : slide.offsetTop) - parentOffset

        if (i === 0) {
          this.transitionOffsets.push(-offset)
          prevOffset = offset
        } else if (offset >= minOffset) {
          this.transitionOffsets.push(-minOffset)
          break
        } else if (i === 1 || offset - prevOffset <= clientSize) {
          nextOffset = offset
        } else {
          this.transitionOffsets.push(-nextOffset)
          prevOffset = nextOffset
          nextOffset = offset
        }
      }
    },

    onPanStart(e) {
      this.RAF = false
      this.prevPanTime = this.panTime = e.timeStamp
      this.prevPanPos = this.panPos = this.isHorizontal ? e.detail.clientX : e.detail.clientY
      this.currOffset = this.offset
    },

    onPanMove(e) {
      const panPos = this.isHorizontal ? e.detail.clientX : e.detail.clientY

      if (panPos !== this.prevPanPos) {
        this.prevPanTime = this.panTime
        this.prevPanPos = this.panPos
        this.panTime = e.timeStamp
        this.panPos = panPos
        const offset = this.offset + (this.isHorizontal ? e.detail.offsetX : e.detail.offsetY)

        this.currOffset = offset > this.transitionOffsets[0]
          ? this.transitionOffsets[0]
          : offset < this.transitionOffsets[this.transitionOffsets.length - 1]
            ? this.transitionOffsets[this.transitionOffsets.length - 1]
            : offset

        this.transform = this.isHorizontal
          ? `translateX(${this.currOffset}px)`
          : `translateY(${this.currOffset}px)`
      }
    },

    onPanEnd(e) {
      if (this.currOffset !== this.offset) {
        let offset
        let v0 = Math.abs(this.panPos - this.prevPanPos) / Math.abs(e.timeStamp - this.prevPanTime)
        console.log(v0)
        const nextOffset = this.getOffset(this.currOffset, this.currOffset < this.offset ? 'left' : 'right')

        if (v0 >= a * Math.sqrt(2 * Math.abs(this.nextOffset - this.currOffset) / a)) {
          offset = nextOffset
        } else {
          const nearOffset = this.getOffset(this.currOffset, 'near')

          if (Math.abs(this.currOffset - this.offset) < this.threshold ||
              this.currOffset < this.offset && nearOffset < this.offset ||
              this.currOffset > this.offset && nearOffset > this.offset) {
            offset = nearOffset
          } else {
            offset = nextOffset
          }

          v0 = a * Math.sqrt(2 * Math.abs(offset - this.currOffset) / a)
        }

        this.animate(this.currOffset, offset, v0)
      }
    },

    animate(from, to, v0) {
      console.log(from, to, v0)
      this.RAF = true
      this.offset = from
      const s1 = Math.abs(to - from)
      const t1 = (v0 - Math.sqrt(r(v0 * v0 - 2 * a * s1))) / a

      function r(n) {
        return Math.round(n * 100000) / 100000
      }

      let start

      const animate = now => {
        if (!start) {
          start = now
        } else {
          const t = now - start

          const s = t >= t1
            ? s1
            : Math.abs(Math.round(v0 * t - a * t * t / 2))

          this.offset = from + (from > to ? -s : s)
          console.log(t, s, this.offset)

          this.transform = this.isHorizontal
            ? `translateX(${this.offset}px)`
            : `translateY(${this.offset}px)`
        }

        if (this.RAF && this.offset !== to) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    },

    getOffset(offset, dir) {
      const left = this.transitionOffsets.find(o => o <= offset)

      if (left === offset) {
        return offset
      }

      const right = [...this.transitionOffsets].reverse().find(o => o >= offset)

      return dir === 'near'
        ? Math.abs(offset - left) < Math.abs(offset - right) ? left : right
        : dir === 'left' ? left : right
    }
  }
}
</script>

<style scoped>
.slides {
  display: flex;
}

.slides.horizontal {
  flex-wrap: nowrap;
}

.slides.vertical {
  flex-direction: column
}
</style>
