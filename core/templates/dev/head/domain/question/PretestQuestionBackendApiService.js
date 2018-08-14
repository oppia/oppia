// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to receive questions as pretests for an exploration.
 */
oppia.constant(
  'PRETEST_QUESTIONS_URL_TEMPLATE',
  '/pretest_handler/<exploration_id>?story_id=<story_id>&cursor=<cursor>');

oppia.factory('PretestQuestionBackendApiService', [
  '$http', '$q', 'PRETEST_QUESTIONS_URL_TEMPLATE', 'UrlInterpolationService',
  function(
      $http, $q, PRETEST_QUESTIONS_URL_TEMPLATE, UrlInterpolationService) {
    var _cursor = '';

    var _fetchPretestQuestions = function(
        explorationId, storyId, successCallback, errorCallback) {
      if (!storyId) {
        successCallback([]);
        return;
      }
      var pretestDataUrl = UrlInterpolationService.interpolateUrl(
        PRETEST_QUESTIONS_URL_TEMPLATE, {
          exploration_id: explorationId,
          story_id: storyId,
          cursor: _cursor
        });

      $http.get(pretestDataUrl).then(function(response) {
        var pretestQuestionDicts =
          angular.copy(response.data.pretest_question_dicts);
        _cursor = response.data.next_start_cursor;
        if (successCallback) {
          successCallback(pretestQuestionDicts);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    return {
      fetchPretestQuestions: function(explorationId, storyId) {
        return $q(function(resolve, reject) {
          _fetchPretestQuestions(explorationId, storyId, resolve, reject);
        });
      }
    };
  }
]);
