<script>
import { onMount } from 'svelte';
import { fade } from 'svelte/transition';
import {
  store, dataset,
} from '../store/store';

import QuantileExplorerView from '../patterns/body/quantiles/QuantileExplorerView.svelte';

function isScalarData(data) {
  return data && data[0].metadata.metric_type.includes('scalar');
}

function isNumericHistogramData(data) {
  return data && (data[0].metadata.metric_type === 'histogram-exponential' || data[0].metadata.metric_type
    === 'histogram-linear');
}

let container;
let width;

</script>

<style>
.graphic-body-container {
    /* padding: var(--space-4x);
    padding-top: var(--space-2x); */
    overflow-y: auto;
    height: calc(100vh - var(--header-height));
    background-color: white;
}

.graphic-body__graphic-header {
    display: grid;
    grid-template-columns: auto max-content;
    grid-column-gap: var(--space-4x);
    align-items: start;
    background-color: var(--cool-gray-100);
    border-bottom: 1px solid var(--line-gray-01);
}

.graphic-body__graphic-header h2 {
    margin:0;
    padding:0;
    width: 100%;
    word-break: break-all;
    height: var(--increment);
    display: grid;
    align-items: center;
    padding-left: var(--space-4x);
    
}

.graphic-body__content {
    background-color: white;
    padding: var(--space-4x);
    padding-top: var(--space-2x);
}

</style>

<svelte:window bind:innerWidth={width} />

<div bind:this={container} class=graphic-body-container>

    <div class=graphic-body__graphic-header>
    {#if $store.probe.name}
        <h2 class='heading--03'>{$store.probe.name}</h2>
    {:else}
        <h2 class='heading--04'>Telemetry Prototype</h2>
    {/if}
    </div>

    <div class=graphic-body__content>
        {#if $dataset.key === 'DEFAULT_VIEW'}
            <div>Telemetry dashboard default view goes here</div>
        {:else if $dataset.data}
            {#await $dataset.data}
                running query
            {:then data}
                <div in:fade>
                    {#if isScalarData(data.response)}
                        <QuantileExplorerView data={data.response} probeType='scalar' />
                    {:else if isNumericHistogramData(data.response)}
                        <QuantileExplorerView data={data.response} probeType='histogram' />
                    {:else}
                        <pre>
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    {/if}
                </div>
            {:catch err}
                An error was caught: {err}
            {/await}
        {:else}
            <div>{$dataset.key}</div>
        {/if}
        
    </div>
</div>
