import panEvents from 'pan-events';
import elementResizeDetectorMaker from 'element-resize-detector';

//
var a = -0.01;
var script = {
  name: 'Carousel',
  props: {
    direction: {
      type: String,
      "default": 'horizontal' // horizontal, vertical

    },
    totalPages: {
      type: Number
    },
    currentPage: {
      type: Number
    },
    autoplay: [Boolean, Number]
  },
  data: function data() {
    return {
      transform: '',
      offset: 0
    };
  },
  computed: {
    isVertical: function isVertical() {
      return this.direction === 'vertical';
    },
    isHorizontal: function isHorizontal() {
      return this.direction === 'horizontal';
    }
  },
  provide: function provide() {
    return {
      carousel: this
    };
  },
  watch: {
    direction: 'onResize',
    currentPage: function currentPage(n) {
      this["goto"](n);
    },
    autoplay: 'setAutoplay'
  },
  mounted: function mounted() {
    panEvents(this.$el);
    this.calcTransitionOffsets();
    this.$on('slide-resize', this.onResize);
    this.resizeDetector = elementResizeDetectorMaker({
      strategy: 'scroll',
      callOnAdd: false
    });
    this.resizeDetector.listenTo(this.$el, this.onResize);
    this["goto"](this.currentPage);
    this.setAutoplay();
  },
  beforeDestroy: function beforeDestroy() {
    this.$off('slide-resize');
    this.resizeDetector.uninstall(this.$el);
  },
  methods: {
    onResize: function onResize() {
      var _this = this;

      Promise.resolve(this.animating).then(function () {
        if (!_this.resizeTimer) {
          _this.resizeTimer = setTimeout(function () {
            _this.resizeTimer = null;

            var curOffsetIndex = _this.transitionOffsets.indexOf(_this.getOffset(_this.offset, 'near'));

            var oldOffsets = _this.transitionOffsets.concat();

            _this.calcTransitionOffsets();

            if (!_this.transitionOffsets.every(function (v, i) {
              return oldOffsets[i] === v;
            })) {
              _this["goto"](curOffsetIndex + 1, true);
            }
          }, 10);
        }
      });
    },
    calcTransitionOffsets: function calcTransitionOffsets() {
      this.transitionOffsets = [];
      var slides = this.$refs.slides.children;

      if (slides.length) {
        var offset = this.getSlideOffset(slides[0]);
        this.transitionOffsets.push(-offset);
        var clientSize = this.isHorizontal ? this.$el.clientWidth : this.$el.clientHeight;
        var scrollSize = this.isHorizontal ? this.$refs.slides.scrollWidth : this.$refs.slides.scrollHeight;
        var maxOffset = scrollSize - clientSize;

        if (slides.length > 1 && offset < maxOffset) {
          var prevTransitionOffset = offset;
          var nextSlideOffset = this.getSlideOffset(slides[1]);

          for (var i = 1; i < slides.length; i++) {
            var _offset = nextSlideOffset;

            if (_offset >= maxOffset) {
              this.transitionOffsets.push(-maxOffset);
              break;
            }

            if (i + 1 < slides.length) {
              nextSlideOffset = this.getSlideOffset(slides[i + 1]);

              if (nextSlideOffset - prevTransitionOffset > clientSize) {
                this.transitionOffsets.push(-_offset);
                prevTransitionOffset = _offset;
              }
            }
          }
        }
      }

      this.$emit('update:total-pages', this.transitionOffsets.length);
    },
    getSlideOffset: function getSlideOffset(slide) {
      return this.isHorizontal ? slide.offsetLeft - this.$refs.slides.offsetLeft : slide.offsetTop - this.$refs.slides.offsetTop;
    },
    onPanStart: function onPanStart(e) {
      this.panning = true;
      this.animating = false;
      this.panDirection = null;
      this.panOffset = this.offset;
      this.panTracks = [{
        timeStamp: e.timeStamp,
        position: this.isHorizontal ? e.detail.clientX : e.detail.clientY
      }];
      this.panTracks.push(this.panTracks[0]);
    },
    onPanMove: function onPanMove(e) {
      var damping = 5;

      if (Math.abs(e.detail.offsetX) - damping > 0 || Math.abs(e.detail.offsetY) - damping > 0) {
        if (!this.panDirection) {
          this.panDirection = Math.abs(e.detail.offsetX) - Math.abs(e.detail.offsetY) > 0 ? 'horizontal' : 'vertical';
        }

        var offset = this.isHorizontal ? e.detail.offsetX : e.detail.offsetY;

        if (this.panDirection === this.direction && Math.abs(offset) - damping > 0) {
          this.panTracks.push({
            timeStamp: e.timeStamp,
            position: this.isHorizontal ? e.detail.clientX : e.detail.clientY
          });
          this.panTracks.shift();
          offset += (offset < 0 ? damping : -damping) + this.offset;
          this.panOffset = offset > this.transitionOffsets[0] ? this.transitionOffsets[0] : offset < this.transitionOffsets[this.transitionOffsets.length - 1] ? this.transitionOffsets[this.transitionOffsets.length - 1] : offset;
          this.transform = this.isHorizontal ? "translateX(" + this.panOffset + "px)" : "translateY(" + this.panOffset + "px)";
        }
      }
    },
    onPanEnd: function onPanEnd() {
      this.panning = false;

      if (this.panOffset !== this.offset || this.transitionOffsets.indexOf(this.offset) === -1) {
        var offset;
        var v0 = Math.abs(this.panTracks[1].position - this.panTracks[0].position) / Math.abs(this.panTracks[1].timeStamp - this.panTracks[0].timeStamp);
        var nextOffset = this.getOffset(this.panOffset, this.panOffset < this.offset ? 'left' : 'right');

        if (v0 > 0.2) {
          v0 = Math.max(v0, this.calcVMin(nextOffset - this.panOffset));
          offset = nextOffset;
        } else {
          var nearOffset = this.getOffset(this.panOffset, 'near');

          if (Math.abs(this.panOffset - this.offset) < Math.abs(nextOffset - nearOffset) / 3 || this.panOffset < this.offset && nearOffset < this.offset || this.panOffset > this.offset && nearOffset > this.offset) {
            offset = nearOffset;
          } else {
            offset = nextOffset;
          }

          v0 = this.calcVMin(offset - this.panOffset);
        }

        this.animate(this.panOffset, offset, v0);
      }
    },
    calcVMin: function calcVMin(r) {
      return -a * Math.sqrt(2 * Math.abs(r) / -a);
    },
    onClick: function onClick(e) {
      if (this.animating) {
        e.preventDefault();
      }
    },
    onMouseEnter: function onMouseEnter() {
      this.mouseHovering = true;
    },
    onMouseLeave: function onMouseLeave() {
      this.mouseHovering = false;
    },
    animate: function animate(from, to, v0) {
      var _this2 = this;

      var animating = this.animating = new Promise(function (resolve) {
        _this2.$emit('update:current-page', _this2.transitionOffsets.indexOf(to) + 1);

        _this2.offset = from;
        var s1 = Math.abs(to - from);
        var t1 = (-v0 + Math.sqrt(r(v0 * v0 + 2 * a * s1))) / a;

        function r(n) {
          return Math.round(n * 100000) / 100000;
        }

        var start;

        var animate = function animate(now) {
          if (!start) {
            start = now;
          } else {
            var t = now - start;
            var s = t >= t1 ? s1 : Math.abs(Math.round(v0 * t + a * t * t / 2));
            _this2.offset = from + (from > to ? -s : s);
            _this2.transform = _this2.isHorizontal ? "translateX(" + _this2.offset + "px)" : "translateY(" + _this2.offset + "px)";
          }

          if (_this2.animating === animating) {
            if (_this2.offset === to) {
              _this2.setAutoplay();

              _this2.$emit('animation-end');

              _this2.animating = false;
              resolve(true);
            } else {
              requestAnimationFrame(animate);
            }
          } else {
            resolve(false);
          }
        };

        requestAnimationFrame(animate);
      });
      return this.animating;
    },
    getOffset: function getOffset(offset, dir) {
      var left = this.transitionOffsets.find(function (o) {
        return o <= offset;
      });

      if (left === offset) {
        return offset;
      }

      var right = [].concat(this.transitionOffsets).reverse().find(function (o) {
        return o >= offset;
      });
      return dir === 'near' ? Math.abs(offset - left) < Math.abs(offset - right) ? left : right : dir === 'left' ? left : right;
    },
    getPageOfSlide: function getPageOfSlide(n) {
      return this.transitionOffsets.indexOf(this.getOffset(-this.getSlideOffset(this.$refs.slides.children[n - 1]), 'near')) + 1;
    },
    "goto": function goto(page, immediate) {
      if (page != null && !this.animating && !this.panning && this.transitionOffsets.length) {
        if (page < 1) {
          page = 1;
        } else if (page > this.transitionOffsets.length) {
          page = this.transitionOffsets.length;
        }

        var to = this.transitionOffsets[page - 1];

        if (to !== this.offset) {
          if (immediate) {
            this.$emit('update:current-page', this.transitionOffsets.indexOf(to) + 1);
            this.offset = to;
            this.transform = this.isHorizontal ? "translateX(" + this.offset + "px)" : "translateY(" + this.offset + "px)";
            this.setAutoplay();
          } else {
            this.animate(this.offset, to, this.calcVMin(to - this.offset));
          }
        }
      }
    },
    setAutoplay: function setAutoplay() {
      var _this3 = this;

      if (this.autoplayTimer) {
        clearInterval(this.autoplayTimer);
        this.autoplayTimer = null;
      }

      if (this.autoplay) {
        this.autoplayTimer = setInterval(function () {
          if (!_this3.panning && !_this3.animating && !_this3.mouseHovering) {
            var curOffsetIndex = _this3.transitionOffsets.indexOf(_this3.offset);

            if (curOffsetIndex !== -1) {
              _this3["goto"](curOffsetIndex === _this3.transitionOffsets.length - 1 ? 1 : curOffsetIndex + 2);
            }
          }
        }, this.autoplay.constructor === Number ? this.autoplay : 3000);
      }
    }
  }
};

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier
/* server only */
, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
  if (typeof shadowMode !== 'boolean') {
    createInjectorSSR = createInjector;
    createInjector = shadowMode;
    shadowMode = false;
  } // Vue.extend constructor export interop.


  var options = typeof script === 'function' ? script.options : script; // render functions

  if (template && template.render) {
    options.render = template.render;
    options.staticRenderFns = template.staticRenderFns;
    options._compiled = true; // functional template

    if (isFunctionalTemplate) {
      options.functional = true;
    }
  } // scopedId


  if (scopeId) {
    options._scopeId = scopeId;
  }

  var hook;

  if (moduleIdentifier) {
    // server build
    hook = function hook(context) {
      // 2.3 injection
      context = context || // cached call
      this.$vnode && this.$vnode.ssrContext || // stateful
      this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext; // functional
      // 2.2 with runInNewContext: true

      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__;
      } // inject component styles


      if (style) {
        style.call(this, createInjectorSSR(context));
      } // register component module identifier for async chunk inference


      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier);
      }
    }; // used by ssr in case component is cached and beforeCreate
    // never gets called


    options._ssrRegister = hook;
  } else if (style) {
    hook = shadowMode ? function (context) {
      style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
    } : function (context) {
      style.call(this, createInjector(context));
    };
  }

  if (hook) {
    if (options.functional) {
      // register for functional component in vue file
      var originalRender = options.render;

      options.render = function renderWithStyleInjection(h, context) {
        hook.call(context);
        return originalRender(h, context);
      };
    } else {
      // inject component registration as beforeCreate hook
      var existing = options.beforeCreate;
      options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
    }
  }

  return script;
}

var isOldIE = typeof navigator !== 'undefined' && /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());

function createInjector(context) {
  return function (id, style) {
    return addStyle(id, style);
  };
}

var HEAD;
var styles = {};

function addStyle(id, css) {
  var group = isOldIE ? css.media || 'default' : id;
  var style = styles[group] || (styles[group] = {
    ids: new Set(),
    styles: []
  });

  if (!style.ids.has(id)) {
    style.ids.add(id);
    var code = css.source;

    if (css.map) {
      // https://developer.chrome.com/devtools/docs/javascript-debugging
      // this makes source maps inside style tags work properly in Chrome
      code += '\n/*# sourceURL=' + css.map.sources[0] + ' */'; // http://stackoverflow.com/a/26603875

      code += '\n/*# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) + ' */';
    }

    if (!style.element) {
      style.element = document.createElement('style');
      style.element.type = 'text/css';
      if (css.media) style.element.setAttribute('media', css.media);

      if (HEAD === undefined) {
        HEAD = document.head || document.getElementsByTagName('head')[0];
      }

      HEAD.appendChild(style.element);
    }

    if ('styleSheet' in style.element) {
      style.styles.push(code);
      style.element.styleSheet.cssText = style.styles.filter(Boolean).join('\n');
    } else {
      var index = style.ids.size - 1;
      var textNode = document.createTextNode(code);
      var nodes = style.element.childNodes;
      if (nodes[index]) style.element.removeChild(nodes[index]);
      if (nodes.length) style.element.insertBefore(textNode, nodes[index]);else style.element.appendChild(textNode);
    }
  }
}

/* script */
const __vue_script__ = script;

/* template */
var __vue_render__ = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    {
      staticClass: "carousel",
      on: {
        panstart: _vm.onPanStart,
        panmove: _vm.onPanMove,
        panend: _vm.onPanEnd,
        "!click": function($event) {
          return _vm.onClick($event)
        },
        mouseenter: _vm.onMouseEnter,
        mouseleave: _vm.onMouseLeave,
        dragstart: function($event) {
          $event.preventDefault();
        }
      }
    },
    [
      _c(
        "div",
        {
          ref: "slides",
          staticClass: "slides",
          class: _vm.direction,
          style: { transform: _vm.transform }
        },
        [_vm._t("default")],
        2
      )
    ]
  )
};
var __vue_staticRenderFns__ = [];
__vue_render__._withStripped = true;

  /* style */
  const __vue_inject_styles__ = function (inject) {
    if (!inject) return
    inject("data-v-2950aef9_0", { source: "\n.slides[data-v-2950aef9] {\n  display: flex;\n  height: 100%;\n}\n.slides.horizontal[data-v-2950aef9] {\n  flex-wrap: nowrap;\n}\n.slides.vertical[data-v-2950aef9] {\n  flex-direction: column\n}\n", map: {"version":3,"sources":["/Users/jfm/projects/vue-carousel/src/Carousel.vue"],"names":[],"mappings":";AAoXA;EACA,aAAA;EACA,YAAA;AACA;AAEA;EACA,iBAAA;AACA;AAEA;EACA;AACA","file":"Carousel.vue","sourcesContent":["<template>\n  <div\n    class=\"carousel\"\n    @panstart=\"onPanStart\"\n    @panmove=\"onPanMove\"\n    @panend=\"onPanEnd\"\n    @click.capture=\"onClick\"\n    @mouseenter=\"onMouseEnter\"\n    @mouseleave=\"onMouseLeave\"\n    @dragstart.prevent\n  >\n    <div ref=\"slides\" class=\"slides\" :class=\"direction\" :style=\"{ transform }\">\n      <slot />\n    </div>\n  </div>\n</template>\n\n<script>\nimport panEvents from 'pan-events'\nimport elementResizeDetectorMaker from 'element-resize-detector'\n\nconst a = -0.01\n\nexport default {\n  name: 'Carousel',\n\n  props: {\n    direction: {\n      type: String,\n      default: 'horizontal' // horizontal, vertical\n    },\n\n    totalPages: {\n      type: Number\n    },\n\n    currentPage: {\n      type: Number\n    },\n\n    autoplay: [Boolean, Number]\n  },\n\n  data: () => ({\n    transform: '',\n    offset: 0\n  }),\n\n  computed: {\n    isVertical() {\n      return this.direction === 'vertical'\n    },\n\n    isHorizontal() {\n      return this.direction === 'horizontal'\n    }\n  },\n\n  provide() {\n    return {\n      carousel: this\n    }\n  },\n\n  watch: {\n    direction: 'onResize',\n\n    currentPage(n) {\n      this.goto(n)\n    },\n\n    autoplay: 'setAutoplay'\n  },\n\n  mounted() {\n    panEvents(this.$el)\n    this.calcTransitionOffsets()\n    this.$on('slide-resize', this.onResize)\n\n    this.resizeDetector = elementResizeDetectorMaker({\n      strategy: 'scroll',\n      callOnAdd: false\n    })\n\n    this.resizeDetector.listenTo(this.$el, this.onResize)\n    this.goto(this.currentPage)\n    this.setAutoplay()\n  },\n\n  beforeDestroy() {\n    this.$off('slide-resize')\n    this.resizeDetector.uninstall(this.$el)\n  },\n\n  methods: {\n    onResize() {\n      Promise.resolve(this.animating).then(() => {\n        if (!this.resizeTimer) {\n          this.resizeTimer = setTimeout(() => {\n            this.resizeTimer = null\n            const curOffsetIndex = this.transitionOffsets.indexOf(this.getOffset(this.offset, 'near'))\n            const oldOffsets = this.transitionOffsets.concat()\n            this.calcTransitionOffsets()\n\n            if (!this.transitionOffsets.every((v, i) => oldOffsets[i] === v)) {\n              this.goto(curOffsetIndex + 1, true)\n            }\n          }, 10)\n        }\n      })\n    },\n\n    calcTransitionOffsets() {\n      this.transitionOffsets = []\n      const slides = this.$refs.slides.children\n\n      if (slides.length) {\n        const offset = this.getSlideOffset(slides[0])\n        this.transitionOffsets.push(-offset)\n        const clientSize = this.isHorizontal ? this.$el.clientWidth : this.$el.clientHeight\n        const scrollSize = this.isHorizontal ? this.$refs.slides.scrollWidth : this.$refs.slides.scrollHeight\n        const maxOffset = scrollSize - clientSize\n\n        if (slides.length > 1 && offset < maxOffset) {\n          let prevTransitionOffset = offset\n          let nextSlideOffset = this.getSlideOffset(slides[1])\n\n          for (let i = 1; i < slides.length; i++) {\n            const offset = nextSlideOffset\n\n            if (offset >= maxOffset) {\n              this.transitionOffsets.push(-maxOffset)\n              break\n            }\n\n            if (i + 1 < slides.length) {\n              nextSlideOffset = this.getSlideOffset(slides[i + 1])\n\n              if (nextSlideOffset - prevTransitionOffset > clientSize) {\n                this.transitionOffsets.push(-offset)\n                prevTransitionOffset = offset\n              }\n            }\n          }\n        }\n      }\n\n      this.$emit('update:total-pages', this.transitionOffsets.length)\n    },\n\n    getSlideOffset(slide) {\n      return this.isHorizontal\n        ? slide.offsetLeft - this.$refs.slides.offsetLeft\n        : slide.offsetTop - this.$refs.slides.offsetTop\n    },\n\n    onPanStart(e) {\n      this.panning = true\n      this.animating = false\n      this.panDirection = null\n      this.panOffset = this.offset\n\n      this.panTracks = [{\n        timeStamp: e.timeStamp,\n        position: this.isHorizontal ? e.detail.clientX : e.detail.clientY\n      }]\n\n      this.panTracks.push(this.panTracks[0])\n    },\n\n    onPanMove(e) {\n      const damping = 5\n\n      if (Math.abs(e.detail.offsetX) - damping > 0 || Math.abs(e.detail.offsetY) - damping > 0) {\n        if (!this.panDirection) {\n          this.panDirection = Math.abs(e.detail.offsetX) - Math.abs(e.detail.offsetY) > 0 ? 'horizontal' : 'vertical'\n        }\n\n        let offset = this.isHorizontal ? e.detail.offsetX : e.detail.offsetY\n\n        if (this.panDirection === this.direction && Math.abs(offset) - damping > 0) {\n          this.panTracks.push({\n            timeStamp: e.timeStamp,\n            position: this.isHorizontal ? e.detail.clientX : e.detail.clientY\n          })\n\n          this.panTracks.shift()\n\n          offset += (offset < 0 ? damping : -damping) + this.offset\n\n          this.panOffset = offset > this.transitionOffsets[0]\n            ? this.transitionOffsets[0]\n            : offset < this.transitionOffsets[this.transitionOffsets.length - 1]\n              ? this.transitionOffsets[this.transitionOffsets.length - 1]\n              : offset\n\n          this.transform = this.isHorizontal\n            ? `translateX(${this.panOffset}px)`\n            : `translateY(${this.panOffset}px)`\n        }\n      }\n    },\n\n    onPanEnd() {\n      this.panning = false\n\n      if (this.panOffset !== this.offset || this.transitionOffsets.indexOf(this.offset) === -1) {\n        let offset\n\n        let v0 = Math.abs(this.panTracks[1].position - this.panTracks[0].position) /\n          Math.abs(this.panTracks[1].timeStamp - this.panTracks[0].timeStamp)\n\n        const nextOffset = this.getOffset(this.panOffset, this.panOffset < this.offset ? 'left' : 'right')\n\n        if (v0 > 0.2) {\n          v0 = Math.max(v0, this.calcVMin(nextOffset - this.panOffset))\n          offset = nextOffset\n        } else {\n          const nearOffset = this.getOffset(this.panOffset, 'near')\n\n          if (Math.abs(this.panOffset - this.offset) < Math.abs(nextOffset - nearOffset) / 3 ||\n              this.panOffset < this.offset && nearOffset < this.offset ||\n              this.panOffset > this.offset && nearOffset > this.offset) {\n            offset = nearOffset\n          } else {\n            offset = nextOffset\n          }\n\n          v0 = this.calcVMin(offset - this.panOffset)\n        }\n\n        this.animate(this.panOffset, offset, v0)\n      }\n    },\n\n    calcVMin(r) {\n      return -a * Math.sqrt(2 * Math.abs(r) / -a)\n    },\n\n    onClick(e) {\n      if (this.animating) {\n        e.preventDefault()\n      }\n    },\n\n    onMouseEnter() {\n      this.mouseHovering = true\n    },\n\n    onMouseLeave() {\n      this.mouseHovering = false\n    },\n\n    animate(from, to, v0) {\n      const animating = this.animating = new Promise(resolve => {\n        this.$emit('update:current-page', this.transitionOffsets.indexOf(to) + 1)\n        this.offset = from\n        const s1 = Math.abs(to - from)\n        const t1 = (-v0 + Math.sqrt(r(v0 * v0 + 2 * a * s1))) / a\n\n        function r(n) {\n          return Math.round(n * 100000) / 100000\n        }\n\n        let start\n\n        const animate = now => {\n          if (!start) {\n            start = now\n          } else {\n            const t = now - start\n            const s = t >= t1\n              ? s1\n              : Math.abs(Math.round(v0 * t + a * t * t / 2))\n\n            this.offset = from + (from > to ? -s : s)\n\n            this.transform = this.isHorizontal\n              ? `translateX(${this.offset}px)`\n              : `translateY(${this.offset}px)`\n          }\n\n          if (this.animating === animating) {\n            if (this.offset === to) {\n              this.setAutoplay()\n              this.$emit('animation-end')\n              this.animating = false\n              resolve(true)\n            } else {\n              requestAnimationFrame(animate)\n            }\n          } else {\n            resolve(false)\n          }\n        }\n\n        requestAnimationFrame(animate)\n      })\n\n      return this.animating\n    },\n\n    getOffset(offset, dir) {\n      const left = this.transitionOffsets.find(o => o <= offset)\n\n      if (left === offset) {\n        return offset\n      }\n\n      const right = [...this.transitionOffsets].reverse().find(o => o >= offset)\n\n      return dir === 'near'\n        ? Math.abs(offset - left) < Math.abs(offset - right) ? left : right\n        : dir === 'left' ? left : right\n    },\n\n    getPageOfSlide(n) {\n      return this.transitionOffsets.indexOf(\n        this.getOffset(-this.getSlideOffset(this.$refs.slides.children[n - 1]), 'near')\n      ) + 1\n    },\n\n    goto(page, immediate) {\n      if (page != null && !this.animating && !this.panning && this.transitionOffsets.length) {\n        if (page < 1) {\n          page = 1\n        } else if (page > this.transitionOffsets.length) {\n          page = this.transitionOffsets.length\n        }\n\n        const to = this.transitionOffsets[page - 1]\n\n        if (to !== this.offset) {\n          if (immediate) {\n            this.$emit('update:current-page', this.transitionOffsets.indexOf(to) + 1)\n            this.offset = to\n\n            this.transform = this.isHorizontal\n              ? `translateX(${this.offset}px)`\n              : `translateY(${this.offset}px)`\n\n            this.setAutoplay()\n          } else {\n            this.animate(this.offset, to, this.calcVMin(to - this.offset))\n          }\n        }\n      }\n    },\n\n    setAutoplay() {\n      if (this.autoplayTimer) {\n        clearInterval(this.autoplayTimer)\n        this.autoplayTimer = null\n      }\n\n      if (this.autoplay) {\n        this.autoplayTimer = setInterval(() => {\n          if (!this.panning && !this.animating && !this.mouseHovering) {\n            const curOffsetIndex = this.transitionOffsets.indexOf(this.offset)\n\n            if (curOffsetIndex !== -1) {\n              this.goto(curOffsetIndex === this.transitionOffsets.length - 1 ? 1 : curOffsetIndex + 2)\n            }\n          }\n        }, this.autoplay.constructor === Number ? this.autoplay : 3000)\n      }\n    }\n  }\n}\n</script>\n\n<style scoped>\n.slides {\n  display: flex;\n  height: 100%;\n}\n\n.slides.horizontal {\n  flex-wrap: nowrap;\n}\n\n.slides.vertical {\n  flex-direction: column\n}\n</style>\n"]}, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__ = "data-v-2950aef9";
  /* module identifier */
  const __vue_module_identifier__ = undefined;
  /* functional template */
  const __vue_is_functional_template__ = false;
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__ = normalizeComponent(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    false,
    createInjector,
    undefined,
    undefined
  );

//
var script$1 = {
  name: 'Slide',
  inject: ['carousel'],
  mounted: function mounted() {
    var _this = this;

    this.carousel.$emit('slide-resize');
    this.resizeDetector = elementResizeDetectorMaker({
      strategy: 'scroll',
      callOnAdd: false
    });
    this.resizeDetector.listenTo(this.$el, function () {
      _this.carousel.$emit('slide-resize');
    });
  },
  destroyed: function destroyed() {
    this.resizeDetector.uninstall(this.$el);
    this.carousel.$emit('slide-resize');
  }
};

/* script */
const __vue_script__$1 = script$1;

/* template */
var __vue_render__$1 = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c("div", { staticClass: "slide" }, [_vm._t("default")], 2)
};
var __vue_staticRenderFns__$1 = [];
__vue_render__$1._withStripped = true;

  /* style */
  const __vue_inject_styles__$1 = function (inject) {
    if (!inject) return
    inject("data-v-9a5c30b8_0", { source: "\n.slide[data-v-9a5c30b8] {\n  flex-shrink: 0;\n}\n", map: {"version":3,"sources":["/Users/jfm/projects/vue-carousel/src/Slide.vue"],"names":[],"mappings":";AAgCA;EACA,cAAA;AACA","file":"Slide.vue","sourcesContent":["<template>\n  <div class=\"slide\"><slot /></div>\n</template>\n\n<script>\nimport elementResizeDetectorMaker from 'element-resize-detector'\n\nexport default {\n  name: 'Slide',\n  inject: ['carousel'],\n\n  mounted() {\n    this.carousel.$emit('slide-resize')\n\n    this.resizeDetector = elementResizeDetectorMaker({\n      strategy: 'scroll',\n      callOnAdd: false\n    })\n\n    this.resizeDetector.listenTo(this.$el, () => {\n      this.carousel.$emit('slide-resize')\n    })\n  },\n\n  destroyed() {\n    this.resizeDetector.uninstall(this.$el)\n    this.carousel.$emit('slide-resize')\n  }\n}\n</script>\n\n<style scoped>\n.slide {\n  flex-shrink: 0;\n}\n</style>\n"]}, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__$1 = "data-v-9a5c30b8";
  /* module identifier */
  const __vue_module_identifier__$1 = undefined;
  /* functional template */
  const __vue_is_functional_template__$1 = false;
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__$1 = normalizeComponent(
    { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 },
    __vue_inject_styles__$1,
    __vue_script__$1,
    __vue_scope_id__$1,
    __vue_is_functional_template__$1,
    __vue_module_identifier__$1,
    false,
    createInjector,
    undefined,
    undefined
  );

export { __vue_component__ as Carousel, __vue_component__$1 as Slide };
