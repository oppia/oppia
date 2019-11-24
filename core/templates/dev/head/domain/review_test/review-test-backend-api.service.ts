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
 * @fileoverview Service to retrieve information of review tests from the
 * backend.
 */

require('domain/review_test/review-test-domain.constants.ajs.ts');

require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').factory('ReviewTestBackendApiService', [
  '$http', 'UrlInterpolationService', 'REVIEW_TEST_DATA_URL',
  function($http, UrlInterpolationService, REVIEW_TEST_DATA_URL) {
    var _fetchReviewTestData = function(storyId) {
      var reviewTestsDataUrl = UrlInterpolationService.interpolateUrl(
        REVIEW_TEST_DATA_URL, {
          story_id: storyId
        });
      return $http.get(reviewTestsDataUrl);
    };

    return {
      fetchReviewTestData: _fetchReviewTestData,
    };
  }
]);
