# @jfm/v-carousel
A Vue carousel component.

## Demo
[https://jiangfengming.github.io/v-carousel/demo/](https://jiangfengming.github.io/v-carousel/demo/)

[Source code](https://github.com/jiangfengming/v-carousel/blob/master/demo-src/App.vue)

## Install
```
npm i @jfm/v-carousel
```

## Usage
```html
<template>
  <main>
    <v-carousel class="carousel" :current-page.sync="currentPage" :total-pages.sync="totalPages" autoplay>
      <v-slide class="slide">slide 1</v-slide>
      <v-slide class="slide">slide 2</v-slide>
      <v-slide class="slide">slide 3</v-slide>
    </v-carousel>

    <button @click="currentPage = currentPage === 1 ? totalPages : currentPage - 1">backward</button>
    <button @click="currentPage = currentPage === totalPages ? 1 : currentPage + 1">forward</button>
  </main>
</template>

<script>
import { VCarousel, VSlide } from '　@jfm/v-carousel'

export default {
  components: { VCarousel, VSlide },

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

## \<v-carousel> options
* `current-page.sync`: `Number`. Current page number.
* `total-page.sync`: `Number`. Total page count.
* `autoplay`: `Boolean` or `Number` (milliseconds). If `true`, it defaults to 3000.
* `direction`: `String`. `horizontal`, or `vertical`.
  
## License
[MIT](LICENSE)

