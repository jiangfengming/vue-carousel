<template>
  <div
    class="carousel"
    @panstart="onPanStart"
    @panmove="onPanMove"
    @panend="onPanEnd"
    @click.capture="onClick"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @dragstart.prevent
  >
    <div ref="slides" class="slides" :class="direction" :style="{ transform }">
      <slot />
    </div>
  </div>
</template>

<script>
import panEvents from 'pan-events'
import elementResizeDetectorMaker from 'element-resize-detector'

const a = -0.01

export default {
  name: 'Carousel',

  props: {
    direction: {
      type: String,
      default: 'horizontal' // horizontal, vertical
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

  provide() {
    return {
      carousel: this
    }
  },

  watch: {
    direction: 'onResize',

    currentPage(n) {
      this.goto(n)
    },

    autoplay: 'setAutoplay'
  },

  mounted() {
    panEvents(this.$el)
    this.calcTransitionOffsets()
    this.$on('slide-resize', this.onResize)

    this.resizeDetector = elementResizeDetectorMaker({
      strategy: 'scroll',
      callOnAdd: false
    })

    this.resizeDetector.listenTo(this.$el, this.onResize)
    this.goto(this.currentPage)
    this.setAutoplay()
  },

  beforeDestroy() {
    this.$off('slide-resize')
    this.resizeDetector.uninstall(this.$el)
  },

  methods: {
    onResize() {
      Promise.resolve(this.animating).then(() => {
        if (!this.resizeTimer) {
          this.resizeTimer = setTimeout(() => {
            this.resizeTimer = null
            const curOffsetIndex = this.transitionOffsets.indexOf(this.getOffset(this.offset, 'near'))
            const oldOffsets = this.transitionOffsets.concat()
            this.calcTransitionOffsets()

            if (!this.transitionOffsets.every((v, i) => oldOffsets[i] === v)) {
              this.goto(curOffsetIndex + 1, true)
            }
          }, 10)
        }
      })
    },

    calcTransitionOffsets() {
      this.transitionOffsets = []
      const slides = this.$refs.slides.children

      if (slides.length) {
        const offset = this.getSlideOffset(slides[0])
        this.transitionOffsets.push(-offset)
        const clientSize = this.isHorizontal ? this.$el.clientWidth : this.$el.clientHeight
        const scrollSize = this.isHorizontal ? this.$refs.slides.scrollWidth : this.$refs.slides.scrollHeight
        const maxOffset = scrollSize - clientSize

        if (slides.length > 1 && offset < maxOffset) {
          let prevTransitionOffset = offset
          let nextSlideOffset = this.getSlideOffset(slides[1])

          for (let i = 1; i < slides.length; i++) {
            const offset = nextSlideOffset

            if (offset >= maxOffset) {
              this.transitionOffsets.push(-maxOffset)
              break
            }

            if (i + 1 < slides.length) {
              nextSlideOffset = this.getSlideOffset(slides[i + 1])

              if (nextSlideOffset - prevTransitionOffset > clientSize) {
                this.transitionOffsets.push(-offset)
                prevTransitionOffset = offset
              }
            }
          }
        }
      }

      this.$emit('update:total-pages', this.transitionOffsets.length)
    },

    getSlideOffset(slide) {
      return this.isHorizontal
        ? slide.offsetLeft - this.$refs.slides.offsetLeft
        : slide.offsetTop - this.$refs.slides.offsetTop
    },

    onPanStart(e) {
      this.panning = true
      this.animating = false
      this.panDirection = null
      this.panOffset = this.offset

      this.panTracks = [{
        timeStamp: e.timeStamp,
        position: this.isHorizontal ? e.detail.clientX : e.detail.clientY
      }]

      this.panTracks.push(this.panTracks[0])
    },

    onPanMove(e) {
      const damping = 5

      if (Math.abs(e.detail.offsetX) - damping > 0 || Math.abs(e.detail.offsetY) - damping > 0) {
        if (!this.panDirection) {
          this.panDirection = Math.abs(e.detail.offsetX) - Math.abs(e.detail.offsetY) > 0 ? 'horizontal' : 'vertical'
        }

        let offset = this.isHorizontal ? e.detail.offsetX : e.detail.offsetY

        if (this.panDirection === this.direction && Math.abs(offset) - damping > 0) {
          this.panTracks.push({
            timeStamp: e.timeStamp,
            position: this.isHorizontal ? e.detail.clientX : e.detail.clientY
          })

          this.panTracks.shift()

          offset += (offset < 0 ? damping : -damping) + this.offset

          this.panOffset = offset > this.transitionOffsets[0]
            ? this.transitionOffsets[0]
            : offset < this.transitionOffsets[this.transitionOffsets.length - 1]
              ? this.transitionOffsets[this.transitionOffsets.length - 1]
              : offset

          this.transform = this.isHorizontal
            ? `translateX(${this.panOffset}px)`
            : `translateY(${this.panOffset}px)`
        }
      }
    },

    onPanEnd() {
      this.panning = false

      if (this.panOffset !== this.offset || this.transitionOffsets.indexOf(this.offset) === -1) {
        let offset

        let v0 = Math.abs(this.panTracks[1].position - this.panTracks[0].position) /
          Math.abs(this.panTracks[1].timeStamp - this.panTracks[0].timeStamp)

        const nextOffset = this.getOffset(this.panOffset, this.panOffset < this.offset ? 'left' : 'right')

        if (v0 > 0.2) {
          v0 = Math.max(v0, this.calcVMin(nextOffset - this.panOffset))
          offset = nextOffset
        } else {
          const nearOffset = this.getOffset(this.panOffset, 'near')

          if (Math.abs(this.panOffset - this.offset) < Math.abs(nextOffset - nearOffset) / 3 ||
              this.panOffset < this.offset && nearOffset < this.offset ||
              this.panOffset > this.offset && nearOffset > this.offset) {
            offset = nearOffset
          } else {
            offset = nextOffset
          }

          v0 = this.calcVMin(offset - this.panOffset)
        }

        this.animate(this.panOffset, offset, v0)
      }
    },

    calcVMin(r) {
      return -a * Math.sqrt(2 * Math.abs(r) / -a)
    },

    onClick(e) {
      if (this.animating) {
        e.preventDefault()
      }
    },

    onMouseEnter() {
      this.mouseHovering = true
    },

    onMouseLeave() {
      this.mouseHovering = false
    },

    animate(from, to, v0) {
      const animating = this.animating = new Promise(resolve => {
        this.$emit('update:current-page', this.transitionOffsets.indexOf(to) + 1)
        this.offset = from
        const s1 = Math.abs(to - from)
        const t1 = (-v0 + Math.sqrt(r(v0 * v0 + 2 * a * s1))) / a

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
              : Math.abs(Math.round(v0 * t + a * t * t / 2))

            this.offset = from + (from > to ? -s : s)

            this.transform = this.isHorizontal
              ? `translateX(${this.offset}px)`
              : `translateY(${this.offset}px)`
          }

          if (this.animating === animating) {
            if (this.offset === to) {
              this.setAutoplay()
              this.$emit('animation-end')
              this.animating = false
              resolve(true)
            } else {
              requestAnimationFrame(animate)
            }
          } else {
            resolve(false)
          }
        }

        requestAnimationFrame(animate)
      })

      return this.animating
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

    getPageOfSlide(n) {
      return this.transitionOffsets.indexOf(
        this.getOffset(-this.getSlideOffset(this.$refs.slides.children[n - 1]), 'near')
      ) + 1
    },

    goto(page, immediate) {
      if (page != null && !this.animating && !this.panning && this.transitionOffsets.length) {
        if (page < 1) {
          page = 1
        } else if (page > this.transitionOffsets.length) {
          page = this.transitionOffsets.length
        }

        const to = this.transitionOffsets[page - 1]

        if (to !== this.offset) {
          if (immediate) {
            this.$emit('update:current-page', this.transitionOffsets.indexOf(to) + 1)
            this.offset = to

            this.transform = this.isHorizontal
              ? `translateX(${this.offset}px)`
              : `translateY(${this.offset}px)`

            this.setAutoplay()
          } else {
            this.animate(this.offset, to, this.calcVMin(to - this.offset))
          }
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
          if (!this.panning && !this.animating && !this.mouseHovering) {
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
  height: 100%;
}

.slides.horizontal {
  flex-wrap: nowrap;
}

.slides.vertical {
  flex-direction: column
}
</style>
