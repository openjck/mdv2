import { storiesOf } from '@storybook/svelte';
import ColorPalette from './ColorPalette.svelte';

import '../public/global.css';

storiesOf('Principles|Color', module)
  .add('Telemetry', () => ({
    Component: ColorPalette,
  }));
