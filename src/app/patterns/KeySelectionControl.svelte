<script>
import BodyControl from './BodyControl.svelte';

export let selections;
export let colorMap = () => 'black';
export let transformed = selections.map((opt) => ({
  label: opt, value: opt, labelColor: colorMap(opt),
}));

</script>

<BodyControl
  options={transformed}
    bind:selected={selections}
    multi={true}
    level="low"
/>