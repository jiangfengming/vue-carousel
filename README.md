# @jfm/vue-carousel
A Vue carousel component.

## Demo
[https://jiangfengming.github.io/vue-carousel/demo/](https://jiangfengming.github.io/vue-carousel/demo/)

[Source code](https://github.com/jiangfengming/vue-carousel/blob/master/demo-src/App.vue)

## Install
```
npm i @jfm/vue-carousel
```

## Usage
```vue
<template>
  <main>
    <Carousel class="carousel" :current-page.sync="currentPage" :total-pages.sync="totalPages" autoplay>
      <Slide class="slide">slide 1</Slide>
      <Slide class="slide">slide 2</Slide>
      <Slide class="slide">slide 3</Slide>
    </Carousel>

    <button @click="currentPage = currentPage === 1 ? totalPages : currentPage - 1">backward</button>
    <button @click="currentPage = currentPage === totalPages ? 1 : currentPage + 1">forward</button>
  </main>
</template>

<script>
import { Carousel, Slide } from '@jfm/vue-carousel'

export default {
  components: { Carousel, Slide },

  data: () => ({
    currentPage: 1,
    totalPages: 1
  })
}
</script>

<style scoped>
.carousel {
  width: 400px;
  height: 300px;
}

.slide {
  width: 100%;
  height: 100%;
}
</style>
```

## \<Carousel> options
* `current-page.sync`: `Number`. Current page number.
* `total-page.sync`: `Number`. Total page count.
* `autoplay`: `Boolean` or `Number` (milliseconds). If `true`, it defaults to 3000.
* `direction`: `String`. `horizontal`, or `vertical`.
  
## License
[MIT](LICENSE)
