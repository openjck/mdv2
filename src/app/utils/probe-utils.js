import { nearestBelow } from '../../utils/stats';

export function sortByKey(key) {
  return (a, b) => {
    if (a[key] < b[key]) return -1;
    if (a[key] > b[key]) return 1;
    return 0;
  };
}

export const sortByHistogramObjectKey = (a, b) => {
  const ai = +a;
  const bi = +b;
  if (ai < bi) return -1;
  if (ai >= bi) return 1;
  return 0;
};

export const responseHistogramToGraphicFormat = (histogram, keyTransform = (k) => +k) => {
  // turn histogram to array of objects, sorted.
  const formatted = Object.entries(histogram).map(([k, v]) => ({ bin: keyTransform(k), value: v }));
  formatted.sort((a, b) => {
    if (a.key > b.key) return -1;
    if (a.key <= b.key) return 1;
    return 0;
  });
  return formatted;
};

export const prepareForQuantilePlot = (probeData, key = 'version') => probeData.map((probe) => {
  const histogram = responseHistogramToGraphicFormat(probe.data[0].histogram);
  const { percentiles } = probe.data[0];
  const transformedPercentiles = Object.entries(percentiles).reduce((acc, [bin, value]) => {
    acc[bin] = nearestBelow(value, histogram.map((h) => h.bin));
    return acc;
  }, {});
  return {
    label: probe.metadata[key],
    histogram,
    percentiles,
    transformedPercentiles,
    audienceSize: probe.data[0].total_users,
  };
});

function toProportions(obj) {
  const proportions = { ...obj };
  const total = Object.values(proportions).reduce((a, b) => a + b, 0);
  Object.keys(proportions).forEach((p) => {
    proportions[p] /= total;
  });
  return proportions;
}

export const prepareForProportionPlot = (probeData, key = 'version') => probeData.map((probe) => {
  const counts = probe.data[0].histogram;
  const proportions = toProportions(probe.data[0].histogram);
  return {
    label: probe.metadata[key],
    counts,
    proportions,
    audienceSize: probe.data[0].total_users,
  };
});

export function isScalar(payload) {
  return payload.every((aggregation) => aggregation.metadata.metric_type === 'scalar');
}

function sortByBuildID(a, b) {
  if (a.metadata.build_id < b.metadata.build_id) return -1;
  if (a.metadata.build_id >= b.metadata.build_id) return 1;
  return 0;
}

export function zipByAggregationType(payload) {
  // returns obj
  // keyed by aggwregation type, valued by [{data: [datum], metadata}, ...]
  const aggTypes = new Set([]);
  payload.forEach((aggregation) => {
    aggregation.data.forEach((histogram) => {
      const aggType = histogram.client_agg_type;
      aggTypes.add(aggType);
    });
  });

  const out = {};
  aggTypes.forEach((a) => {
    out[a] = [];
  });

  payload.forEach((aggregation) => {
    const { metadata } = aggregation;
    aggregation.data.forEach((datum) => {
      const aggType = datum.client_agg_type;
      out[aggType].push({ data: datum, metadata });
    });
  });

  aggTypes.forEach((a) => {
    out[a].sort(sortByBuildID);
  });
  return out;
}

function groupBy(xs, key, transform = (_) => _) {
  return xs.reduce((rv, x) => {
    const K = transform(x[key]);
    (rv[K] = rv[K] || []).push(x);
    return rv;
  }, {});
}

export function topKBuildsPerDay(dataset, k = 2) {
  const byBuildID = groupBy(dataset, 'label', (buildID) => buildID.slice(0, 8));
  // by buildID, return the top 2 of each.
  const topK = Object.entries(byBuildID).map(([_, matches]) => {
    const out = matches.filter((m) => m.audienceSize > 10);
    out.sort(sortByKey('audienceSize'));
    out.reverse();
    return out.slice(0, k);
  });
  const flattened = topK.flat(2);
  flattened.sort(sortByKey('label'));
  return flattened;
}

export function gatherBy(payload, by) {
  const gathered = {};
  // get the entire set of keys.
  payload.forEach((aggregation) => {
    aggregation.data.forEach((entry) => {
      const aggType = by(entry);
      if (!(aggType in gathered)) gathered[aggType] = [];
      gathered[aggType].push({
        data: [entry], metadata: aggregation.metadata,
      });
    });
  });
  return gathered;
}


export function byKeyAndAggregation(data, preparationType = 'quantile', aggregationLevel = 'build_id') {
  const prepareFcn = preparationType === 'quantile' ? prepareForQuantilePlot : prepareForProportionPlot;
  const byKey = gatherBy(data, (entry) => entry.key);
  Object.keys(byKey).forEach((k) => {
    byKey[k] = gatherBy(byKey[k], (entry) => entry.client_agg_type);
    Object.keys(byKey[k]).forEach((aggKey) => {
      byKey[k][aggKey] = prepareFcn(byKey[k][aggKey], aggregationLevel);
      byKey[k][aggKey] = topKBuildsPerDay(byKey[k][aggKey], 2);
      byKey[k][aggKey].sort(sortByKey('label'));
    });
  });
  return byKey;
}

// export function gatherBy(payload, by) {
//   const keys = new Set([]);
//   payload.forEach((aggregation) => {
//     aggregation.data.forEach((entry) => {
//       const aggType = by(entry);
//       keys.add(aggType);
//     });
//   });

//   const out = {};
//   keys.forEach((a) => {
//     out[a] = [];
//   });

//   payload.forEach((aggregation) => {
//     const { metadata } = aggregation;
//     aggregation.data.forEach((datum) => {
//       const aggType = datum.client_agg_type;
//       out[aggType].push({ data: [datum], metadata });
//     });
//   });

//   keys.forEach((a) => {
//     out[a].sort(sortByBuildID);
//   });
//   return out;
// }
