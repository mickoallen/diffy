<script lang="ts">
  // Svelte demo
  import { writable } from 'svelte/store';

  interface Animal {
    name: string;
    sound: string;
  }

  let animals = writable<Animal[]>([
    { name: 'Cat', sound: 'meow' },
    { name: 'Dog', sound: 'woof' },
  ]);

  let newName = '';
  let newSound = '';

  function add() {
    animals.update(list => [...list, { name: newName, sound: newSound }]);
    newName = '';
    newSound = '';
  }
</script>

<div class="demo">
  <h1>Animals</h1>
  <ul>
    {#each $animals as animal}
      <li>{animal.name} says {animal.sound}</li>
    {/each}
  </ul>
  <input bind:value={newName} placeholder="Name" />
  <input bind:value={newSound} placeholder="Sound" />
  <button on:click={add}>Add</button>
</div>

<style>
  .demo { padding: 1rem; }
  li { margin: 0.25rem 0; }
</style>
