<template>
  <main>
    <v-carousel
      class="carousel"
      :current-page.sync="currentPage"
      :total-pages.sync="totalPages"
      :autoplay="autoplay"
      :direction="direction"
      :style="{ width: containerWidth, height: containerHeight, overflow: containerOverflow }"
    >
      <v-slide class="slide" :style="{ width: slideWidth, height: slideHeight }">slide 1</v-slide>
      <v-slide class="slide" :style="{ width: slideWidth, height: slideHeight }"><a href="https://www.example.com/">slide 2</a></v-slide>
      <v-slide class="slide" :style="{ width: slideWidth, height: slideHeight }">slide 3</v-slide>
      <v-slide class="slide" :style="{ width: slideWidth, height: slideHeight }">slide 4</v-slide>
      <v-slide class="slide" :style="{ width: slideWidth, height: slideHeight }">slide 5</v-slide>
      <v-slide class="slide" :style="{ width: slideWidth, height: slideHeight }">slide 6</v-slide>
    </v-carousel>

    <div class="text-center">
      <span v-for="n in totalPages" :key="n" class="bullet" :class="{ active: n === currentPage }" />
    </div>

    <div class="text-center">{{ currentPage }} / {{ totalPages }}</div>

    <div class="text-center">
      <button @click="currentPage = currentPage === 1 ? totalPages : currentPage - 1">backward</button>
      <button @click="currentPage = currentPage === totalPages ? 1 : currentPage + 1">forward</button>
    </div>

    <div>
      autoplay:
      <label><input v-model="autoplay" type="radio" :value="true">true</label>
      <label><input v-model="autoplay" type="radio" :value="false">false</label>
    </div>

    <div>
      direction:
      <label><input v-model="direction" type="radio" value="horizontal">horizontal</label>
      <label><input v-model="direction" type="radio" value="vertical">vertical</label>
    </div>

    <div>
      container overflow:
      <label><input v-model="containerOverflow" type="radio" value="visible">visible</label>
      <label><input v-model="containerOverflow" type="radio" value="hidden">hidden</label>
    </div>

    <template v-if="direction === 'horizontal'">
      <div>
        container width:
        <label><input v-model="containerWidth" type="radio" value="300px">300px</label>
        <label><input v-model="containerWidth" type="radio" value="100%">100%</label>
      </div>

      <div>
        slide width:
        <label><input v-model="slideWidth" type="radio" value="120px">120px</label>
        <label><input v-model="slideWidth" type="radio" value="100%">100%</label>
      </div>
    </template>

    <template v-else>
      <div>
        container height:
        <label><input v-model="containerHeight" type="radio" value="150px">150px</label>
        <label><input v-model="containerHeight" type="radio" value="500px">500px</label>
      </div>

      <div>
        slide height:
        <label><input v-model="slideHeight" type="radio" value="120px">120px</label>
        <label><input v-model="slideHeight" type="radio" value="100%">100%</label>
      </div>
    </template>
  </main>
</template>

<script>
import { VCarousel, VSlide } from '../src'

export default {
  el: '#app',
  components: { VCarousel, VSlide },

  data: () => ({
    currentPage: 1,
    totalPages: 1,
    autoplay: true,
    direction: 'horizontal',
    containerWidth: '300px',
    containerHeight: '150px',
    containerOverflow: 'visible',
    slideWidth: '120px',
    slideHeight: '100%'
  }),

  watch: {
    direction(d) {
      if (d === 'horizontal') {
        this.containerOverflow = 'visible'
        this.containerHeight = '150px'
        this.slideHeight = '100%'
      } else {
        this.containerOverflow = 'hidden'
        this.containerWidth = '300px'
        this.slideWidth = '100%'
      }
    }
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 8px;
  overflow: hidden;
}
</style>

<style scoped>
.carousel {
  box-sizing: border-box;
  margin: 0 auto;
  border: 3px solid #584EEB;
}

.slide {
  display: flex;
  justify-content: center;
  align-items: center;
}

.slide:nth-child(1) {
  background: #FFF78C;
}

.slide:nth-child(2) {
  background: #E8A86B;
}

.slide:nth-child(3) {
  background: #FF82B2;
}

.slide:nth-child(4) {
  background: #856BE8;
}

.slide:nth-child(5) {
  background: #75EEFF;
}

.slide:nth-child(6) {
  background: #56FF88;
}

.text-center {
  text-align: center;
}

.bullet {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: gray;
  margin: 0 3px;
}

.bullet.active {
  background: black;
}
</style>