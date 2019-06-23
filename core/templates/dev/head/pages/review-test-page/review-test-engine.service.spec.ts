// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the review tests.
 */
require('pages/review-test-page/review-test-engine.service.ts');

describe('Review test engine service', function() {
  beforeEach(angular.mock.module('oppia'));
  var ReviewTestEngineService = null;

  beforeEach(angular.mock.inject(function($injector) {
    ReviewTestEngineService = $injector.get('ReviewTestEngineService');
  }));

  it('should return the correct count of review test questions', function() {
    expect(ReviewTestEngineService.getReviewTestQuestionCount(-2)).toEqual(0);
    expect(ReviewTestEngineService.getReviewTestQuestionCount(0)).toEqual(0);
    expect(ReviewTestEngineService.getReviewTestQuestionCount(3)).toEqual(9);
    expect(ReviewTestEngineService.getReviewTestQuestionCount(8)).toEqual(16);
    expect(ReviewTestEngineService.getReviewTestQuestionCount(12)).toEqual(12);
  });
});
