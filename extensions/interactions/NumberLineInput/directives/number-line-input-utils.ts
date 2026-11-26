// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Number line point generation shared by player and editor.
 */

export const getNumberLinePoints = (
  startValue: number,
  endValue: number,
  interval: number
): number[] => {
  if (
    !Number.isSafeInteger(startValue) ||
    !Number.isSafeInteger(endValue) ||
    !Number.isFinite(interval) ||
    interval <= 0 ||
    endValue <= startValue
  ) {
    return [];
  }

  const numberOfIntervals = (endValue - startValue) / interval;
  const roundedNumberOfIntervals = Math.round(numberOfIntervals);
  if (
    roundedNumberOfIntervals < 2 ||
    roundedNumberOfIntervals > 9 ||
    !Number.isFinite(numberOfIntervals) ||
    Math.abs(numberOfIntervals - roundedNumberOfIntervals) > 1e-9
  ) {
    return [];
  }

  // Calculate each point from its index to avoid accumulated rounding error.
  const points = Array.from(
    {length: roundedNumberOfIntervals + 1},
    (_, index) => Number((startValue + index * interval).toFixed(12))
  );
  points[points.length - 1] = endValue;
  return points.every(
    (point, index) => index === 0 || point > points[index - 1]
  )
    ? points
    : [];
};
