<script>
import { format } from 'd3-format';
import { fly } from 'svelte/transition';
import { getContext, afterUpdate } from 'svelte';
import {
  searchResults, store, searchQuery,
} from '../store/store';

import Portal from '../../components/Portal.svelte';
import LineSegSpinner from '../../components/LineSegSpinner.svelte';

// FIXME: Unless we generalize the search results in some way, I'm not sure
// these shouldn't just be imported directly into this component.
// export let updateProbe = getContext('updateProbe');
export let updateSearchQuery = getContext('updateSearchQuery');
export let updateProbe = getContext('updateProbe');
export let updateSearchIsActive = getContext('updateSearchIsActive');
export let parentElement;

// when search query changes for any reason, always center back to first item,
// even if the result set is the exact same (for now, potential FIXME)

let searchListElement;
let formatTotal = format(',.4d');
let focusedItem = 0;
let focusedElement;

$: if ($searchQuery) { focusedItem = 0; }

$: if (searchListElement) {
  focusedElement = searchListElement.querySelector(`li:nth-child(${focusedItem + 1})`);
}

const keyUp = () => {
  if (!focusedItem) focusedItem = 0;
  if (focusedItem > 0) {
    focusedItem -= 1;
  }
};

const keyDown = () => {
  if (!focusedItem) focusedItem = 0;
  if (focusedItem < $searchResults.results.length - 1) {
    focusedItem += 1;
  }
};

const handleKeypress = (event) => {
  const { key } = event;
  if ($searchResults.results && $store.searchIsActive && $searchResults.results.length >= 1) {
    if (key === 'ArrowUp') keyUp(event.target);
    if (key === 'ArrowDown') keyDown(event.target);
    if (key === 'Enter') {
      // const {
      //   id, name, type, description, versions, apiName,
      // } = $searchResults.results[focusedItem];
      updateProbe($searchResults.results[focusedItem]);
      updateSearchIsActive(false);
      // reset focused element
      focusedItem = 0;
    }
    if (key === 'Escape') {
      updateSearchIsActive(false);
      // reset focused element
      focusedItem = 0;
    }
    if (key === 'Home') {
      focusedItem = 0;
    }
    if (key === 'End') {
      focusedItem = $searchResults.results.length - 1;
    }
  }
};

afterUpdate(() => {
  if (focusedElement) {
    focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
});

let x;
let y;
let width;

// update the location once parentElement is defined (that is, the parentElement's component mounts)
$: if (parentElement) {
  const bounds = parentElement.getBoundingClientRect();
  y = bounds.top + bounds.height;
  x = bounds.left;
  width = bounds.width;
}

</script>

<style>

/* FIXME: move toward BEM */
.telemetry-results {
    --header-bg-color: var(--cool-gray-200);
    --list-border-color: gainsboro;
    --list-border: 1px solid var(--list-border-color);
    max-height: calc(100vh - var(--header-height) * 3);
    border:1px solid var(--line-gray-02);
    background-color: white;
    /* width: calc(100vw - var(--drawer-width) * 2 - var(--space-base) - 40px * 2); */
    max-width: calc(var(--increment) * 16);
    box-shadow: var(--depth-5l);
    /* box-shadow: 
      0 1px 1px rgba(0,0,0,0.12),
      0 var(--space-1q) var(--space-1q) rgba(0,0,0,0.06),
      0 var(--space-1h) var(--space-1h) rgba(0,0,0,0.08),
      0 var(--space-base) var(--space-base) rgba(0,0,0,0.12),
      0 var(--space-2x) var(--space-2x) rgba(0,0,0,0.16),
      0 var(--space-4x) var(--space-4x) rgba(0,0,0,0.20); */
    border-bottom-right-radius: var(--border-radius-base);
    border-bottom-left-radius: var(--border-radius-base);
    position: absolute;
    left:0;top:0;
    /* 40px is icon width */
    overflow: hidden;
}

.header-container {
  background-color: var(--cool-gray-300);
    --height: calc(var(--space-base) * 3 + var(--space-base) * 2);
    font-size:.8em;
    color: var(--body-gray-01);
    font-style: italic;
    height: var(--height);
    max-height: var(--height);
    display: grid;
    align-items: stretch;
}

.header {
    padding:var(--space-base);
    padding-left: var(--space-2x);
    padding-right: var(--space-2x);
    display: grid;
    grid-template-columns: max-content auto;
    align-items:center;
    grid-column-gap: var(--space-base);
    position:relative;
}

.header--loaded {
    grid-template-columns: auto;
    grid-column-gap: 0px;
    align-items:center;
}

ul {
    max-height: calc(100vh - var(--header-height) * 3 - 40px);
    padding:0;
    margin:0;
    list-style-type: none;
    overflow-y: scroll;
}

li:first-child {
    border-top: var(--list-border);
}

li {
    padding:var(--space-2x);
    border-bottom: var(--list-border);
    display:grid;
    grid-template-columns: auto 100px;
    grid-column-gap: var(--space-2x);
    grid-template-rows: max-content max-content;
    grid-template-areas: "title probe-type"
                         "description versions";
    cursor: pointer;
    color: var(--body-gray-01);
}

.name {
    grid-area: title;
    word-break: break-all;
    font-weight:bold;
}

.probe-type, .first-release {
    justify-self: end;
    padding: var(--border-radius-1h);
}

.first-release {
    font-size:.8em;
    text-align: right;
    align-self: end;
}

.probe-type {
    grid-area: probe-type;
}

.description {
    grid-area: description;
    font-size:.8em;
    line-height:1.4;
    outline: 1px;
    max-height: 2.6em;
    overflow: hidden;
    color: var(--subhead-gray-02);
    font-style: italic;
    padding-bottom: var(--space-1h);
}

.focused {
    background-color: var(--bg-gray-01);
}

</style>

<svelte:window on:keydown={handleKeypress} />

<Portal>
{#if $store.searchIsActive && $searchQuery.length}
  <div 
  style="left: calc({x}px + var(--space-base)); top: {y}px; width:
  calc({width}px - var(--space-base));"
    transition:fly={{ duration: 20, y: -10 }}
    class=telemetry-results>
      <div class=header-container>
          {#if $searchResults.total}
          <div class="header header--loaded" in:fly={{ x: -5, duration: 200 }}>
              <div>found {$searchResults.results.length} of
                  {formatTotal($searchResults.total)} probes
              </div>
          </div>
          {:else}
          <div class=header out:fly={{ x: 5, duration: 200 }}>
              <LineSegSpinner color={'var(--subhead-gray-02)'} />
              <div>
                  getting the probes – one second!
              </div>
          </div>
          {/if}
          
      </div>
      {#if $searchResults.results.length}
          <ul bind:this={searchListElement}>
          {#each $searchResults.results.slice(0, 30) as {id, name, apiName, type, description, versions}, i (id)}
              <li 
                  class:focused={focusedItem === i} on:click={() => {
                  updateProbe($searchResults.results[focusedItem]);
              }}
                  on:mouseover={() => { focusedItem = i; }}>
                  <div class="name body-text--short-01">{name}</div>
                  <div class="probe-type label label-text--01 label--{type}">{type}</div>
                  <div class="description body-text--short-01">{@html description}</div>
              </li>
          {/each}
          </ul>
      {/if}
  </div>
{/if}
</Portal>