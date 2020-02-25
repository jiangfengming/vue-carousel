<template>
  <main>
    <v-carousel class="carousel" :current-page.sync="currentPage" :total-pages.sync="totalPages" autoplay>
      <v-slide class="slide">slide 1</v-slide>
      <v-slide class="slide">slide 2</v-slide>
      <v-slide class="slide">slide 3</v-slide>
      <v-slide class="slide">slide 4</v-slide>
      <v-slide class="slide">slide 5</v-slide>
      <v-slide class="slide">slide 6</v-slide>
    </v-carousel>

    <div>{{ currentPage }} / {{ totalPages }}</div>
  </main>
</template>

<script>
import { VCarousel, VSlide } from '../src'

export default {
  el: '#app',
  components: { VCarousel, VSlide },

  data: () => ({
    currentPage: 1,
    totalPages: 1
  })
}
</script>

<style scoped>
.carousel {
  width: 320px;
  height: 150px;
  border: 3px solid green;
  /* overflow: hidden; */
}

.slide {
  width: 150px;
  height: 150px;
}

.slide:nth-child(odd) {
  background-color: red;
}

.slide:nth-child(even) {
  background-color: blue;
}
</style>