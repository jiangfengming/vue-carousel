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
import elementResizeDetectorMaker from 'element-resize-detector'

const a = 0.03

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
    },

    totalPages: {
      type: Number
    },

    currentPage: {
      type: Number
    },

    autoplay: [Boolean, Number]
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

  watch: {
    currentPage: 'goto',
    autoplay: 'setAutoplay'
  },

  mounted() {
    panEvents(this.$refs.slides)
    this.calcTransitionOffsets()
    this.$on('resize', this.onResize)

    this.resizeDetector = elementResizeDetectorMaker({
      strategy: 'scroll',
      callOnAdd: false
    })

    this.resizeDetector.listenTo(this.$el, this.onResize)
    this.goto(this.currentPage)
    this.setAutoplay()
  },

  beforeDestroy() {
    this.$off('resize')
    this.resizeDetector.uninstall(this.$el)
  },

  methods: {
    onResize() {
      console.log('onResize')
      const curOffsetIndex = this.transitionOffsets.indexOf(this.offset)
      this.calcTransitionOffsets()

      if (curOffsetIndex !== -1) {
        this.goto(curOffsetIndex + 1)
      }
    },

    calcTransitionOffsets() {
      this.transitionOffsets = []
      const $slides = this.$refs.slides
      const slides = $slides.children

      if (slides.length) {
        const clientSize = this.isHorizontal ? $slides.clientWidth : $slides.clientHeight
        const scrollSize = this.isHorizontal ? $slides.scrollWidth : $slides.scrollHeight
        const maxOffset = scrollSize - clientSize
        const parentOffset = this.isHorizontal ? $slides.offsetLeft : $slides.offsetTop

        let prevOffset = 0
        let nextOffset = 0

        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i]
          const offset = (this.isHorizontal ? slide.offsetLeft : slide.offsetTop) - parentOffset

          if (i === 0) {
            this.transitionOffsets.push(-offset)
            prevOffset = offset
          } else if (i === 1 || offset - prevOffset <= clientSize) {
            nextOffset = offset
          } else {
            if (nextOffset < maxOffset) {
              this.transitionOffsets.push(-nextOffset)
            }

            if (offset >= maxOffset) {
              this.transitionOffsets.push(-maxOffset)
              break
            } else {
              prevOffset = nextOffset
              nextOffset = offset
            }
          }
        }
      }

      this.$emit('update:totalPages', this.transitionOffsets.length)
    },

    onPanStart(e) {
      this.panning = true
      this.raf = false
      this.prevPanTime = this.panTime = e.timeStamp
      this.prevPanPos = this.panPos = this.isHorizontal ? e.detail.clientX : e.detail.clientY
      this.panOffset = this.offset
    },

    onPanMove(e) {
      const panPos = this.isHorizontal ? e.detail.clientX : e.detail.clientY

      if (panPos !== this.prevPanPos) {
        this.prevPanTime = this.panTime
        this.prevPanPos = this.panPos
        this.panTime = e.timeStamp
        this.panPos = panPos
        const offset = this.offset + (this.isHorizontal ? e.detail.offsetX : e.detail.offsetY)

        this.panOffset = offset > this.transitionOffsets[0]
          ? this.transitionOffsets[0]
          : offset < this.transitionOffsets[this.transitionOffsets.length - 1]
            ? this.transitionOffsets[this.transitionOffsets.length - 1]
            : offset

        this.transform = this.isHorizontal
          ? `translateX(${this.panOffset}px)`
          : `translateY(${this.panOffset}px)`
      }
    },

    onPanEnd(e) {
      this.panning = false

      if (this.panOffset !== this.offset || this.transitionOffsets.indexOf(this.offset) === -1) {
        let offset
        let v0 = Math.abs(this.panPos - this.prevPanPos) / Math.abs(e.timeStamp - this.prevPanTime)
        const nextOffset = this.getOffset(this.panOffset, this.panOffset < this.offset ? 'left' : 'right')

        if (v0 >= a * Math.sqrt(2 * Math.abs(this.nextOffset - this.panOffset) / a)) {
          offset = nextOffset
        } else {
          const nearOffset = this.getOffset(this.panOffset, 'near')

          if (Math.abs(this.panOffset - this.offset) < this.threshold ||
              this.panOffset < this.offset && nearOffset < this.offset ||
              this.panOffset > this.offset && nearOffset > this.offset) {
            offset = nearOffset
          } else {
            offset = nextOffset
          }

          v0 = a * Math.sqrt(2 * Math.abs(offset - this.panOffset) / a)
        }

        this.animate(this.panOffset, offset, v0)
      }
    },

    animate(from, to, v0) {
      this.$emit('update:currentPage', this.transitionOffsets.indexOf(to) + 1)
      this.raf = Math.random()
      this.offset = from
      const raf = this.raf
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

          this.transform = this.isHorizontal
            ? `translateX(${this.offset}px)`
            : `translateY(${this.offset}px)`
        }


        if (this.raf === raf) {
          if (this.offset === to) {
            this.raf = null
          } else {
            requestAnimationFrame(animate)
          }
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
    },

    goto(page) {
      if (page != null && !this.raf && !this.panning) {
        if (page < 1) {
          page = 1
        } else if (page > this.transitionOffsets.length) {
          page = this.transitionOffsets.length
        }

        if (this.transitionOffsets[page - 1] !== this.offset) {
          const to = this.transitionOffsets[page - 1]
          const v0 = a * Math.sqrt(2 * Math.abs(to - this.offset) / a)
          this.animate(this.offset, to, v0)
        }
      }
    },

    setAutoplay() {
      if (this.autoplayTimer) {
        clearInterval(this.autoplayTimer)
        this.autoplayTimer = null
      }

      if (this.autoplay) {
        this.autoplayTimer = setInterval(() => {
          if (!this.panning && !this.raf) {
            const curOffsetIndex = this.transitionOffsets.indexOf(this.offset)

            if (curOffsetIndex !== -1) {
              this.goto(curOffsetIndex === this.transitionOffsets.length - 1 ? 1 : curOffsetIndex + 2)
            }
          }
        }, this.autoplay.constructor === Number ? this.autoplay : 3000)
      }
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
