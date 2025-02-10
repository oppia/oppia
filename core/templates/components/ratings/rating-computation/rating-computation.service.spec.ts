// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests that average ratings are being computed correctly.
 */

import {RatingComputationService} from 'components/ratings/rating-computation/rating-computation.service';

describe('Rating computation service', () => {
  let ratingComputationService: RatingComputationService;

  beforeEach(() => {
    ratingComputationService = new RatingComputationService();
  });

  it('should show an average rating only if there are enough individual ones', () => {
    // Don't show an average rating if there are too few ratings.
    expect(
      ratingComputationService.computeAverageRating({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      })
    ).toBeNull();

    // Show an average rating once the minimum is reached.
    expect(
      ratingComputationService.computeAverageRating({
        1: 1,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      })
    ).toBe(1.0);

    // Continue showing an average rating if additional ratings are added.
    expect(
      ratingComputationService.computeAverageRating({
        1: 1,
        2: 0,
        3: 0,
        4: 0,
        5: 1,
      })
    ).toBe(3.0);
  });

  it('should compute average ratings correctly', () => {
    expect(
      ratingComputationService.computeAverageRating({
        1: 6,
        2: 3,
        3: 8,
        4: 12,
        5: 11,
      })
    ).toBe(3.475);
  });
});
