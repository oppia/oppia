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

oppia.constant(
    'QUESTIONS_LIST_URL_TEMPLATE',
    '/questions_list_handler/<activity_type>/<activity_id>?cursor=<cursor>');

oppia.factory('QuestionsListBackendApiService', [
  '$http', '$q', 'UrlInterpolationService', 'QUESTIONS_LIST_URL_TEMPLATE', 
  function($http, $q, UrlInterpolationService, QUESTIONS_LIST_URL_TEMPLATE) {
    var _fetchQuestions = function(
        activityType, activityId, cursor, successCallback, errorCallback) {
      var questionsDataUrl = UrlInterpolationService.interpolateUrl(
        QUESTIONS_LIST_URL_TEMPLATE, {
          activity_type: activityType,
          activity_id: activityId,
          cursor: cursor ? cursor : ''
        });

      $http.get(questionsDataUrl).then(function(response) {
        var questionSummaries = angular.copy(
          response.data.question_summary_dicts);
        var nextCursor = response.data.next_start_cursor;
        if (successCallback) {
          successCallback({
            questionSummaries: questionSummaries,
            nextCursor: nextCursor
          });
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    return {
      fetchQuestions: function(activityType, activityId, cursor) {
        return $q(function(resolve, reject) {
          _fetchQuestions(activityType, activityId, cursor, resolve, reject);
        });
      },
    }
  }
]);