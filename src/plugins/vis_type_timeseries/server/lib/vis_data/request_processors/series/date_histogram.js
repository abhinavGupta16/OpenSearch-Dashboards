/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { overwrite } from '../../helpers';
import { getBucketSize } from '../../helpers/get_bucket_size';
import { offsetTime } from '../../offset_time';
import { getIntervalAndTimefield } from '../../get_interval_and_timefield';
import { isLastValueTimerangeMode } from '../../helpers/get_timerange_mode';
import { search } from '../../../../../../data/server';
const { dateHistogramInterval } = search.aggs;

export function dateHistogram(
  req,
  panel,
  series,
  opensearchQueryConfig,
  indexPatternObject,
  capabilities
) {
  return (next) => (doc) => {
    const { timeField, interval } = getIntervalAndTimefield(panel, series, indexPatternObject);
    const { bucketSize, intervalString } = getBucketSize(req, interval, capabilities);

    const getDateHistogramForLastBucketMode = () => {
      const { from, to } = offsetTime(req, series.offset_time);
      const timezone = capabilities.searchTimezone;

      overwrite(doc, `aggs.${series.id}.aggs.timeseries.date_histogram`, {
        field: timeField,
        min_doc_count: 0,
        time_zone: timezone,
        extended_bounds: {
          min: from.valueOf(),
          max: to.valueOf(),
        },
        ...dateHistogramInterval(intervalString),
      });
    };

    const getDateHistogramForEntireTimerangeMode = () =>
      overwrite(doc, `aggs.${series.id}.aggs.timeseries.auto_date_histogram`, {
        field: timeField,
        buckets: 1,
      });

    isLastValueTimerangeMode(panel, series)
      ? getDateHistogramForLastBucketMode()
      : getDateHistogramForEntireTimerangeMode();

    // master

    overwrite(doc, `aggs.${series.id}.meta`, {
      timeField,
      intervalString,
      bucketSize,
      seriesId: series.id,
    });

    return next(doc);
  };
}
