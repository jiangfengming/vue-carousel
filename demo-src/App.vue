<template>
  <main>
    <v-carousel class="carousel">
      <v-slide class="slide">slide 1</v-slide>
      <v-slide class="slide">slide 2</v-slide>
      <v-slide class="slide">slide 3</v-slide>
      <v-slide class="slide">slide 4</v-slide>
      <v-slide class="slide">slide 5</v-slide>
      <v-slide class="slide">slide 6</v-slide>
    </v-carousel>
  </main>
</template>

<script>
import VCarousel from './VCarousel'
import VSlide from './VSlide'

export default {
  el: '#app',
  components: { VCarousel, VSlide }
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