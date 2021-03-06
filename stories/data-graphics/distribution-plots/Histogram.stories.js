import { storiesOf } from '@storybook/svelte';

import GenericQuantileView from './GenericQuantileView.svelte';
import GenericProportionView from './GenericProportionView.svelte';
import '../../../public/global.css';
import './shared.css';

storiesOf('Data Graphics|Quantile Plot', module)
  .add('Quantile Explorer (numeric hists, scalar aggregations)', () => ({
    Component: GenericQuantileView,
  }))
  .add('Proportion Explorer (categorical data)', () => ({
    Component: GenericProportionView,
  }));
