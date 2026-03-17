<script setup lang="ts">
// Vue demo
import { ref, computed } from 'vue'

interface Animal {
  name: string
  sound: string
}

const animals = ref<Animal[]>([
  { name: 'Cat', sound: 'meow' },
  { name: 'Dog', sound: 'woof' },
])

const greeting = computed(() => `Hello from ${animals.value.length} animals!`)
</script>

<template>
  <div class="demo">
    <h1>{{ greeting }}</h1>
    <ul>
      <li v-for="animal in animals" :key="animal.name">
        {{ animal.name }} says {{ animal.sound }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.demo {
  font-family: sans-serif;
  padding: 1rem;
}
</style>
