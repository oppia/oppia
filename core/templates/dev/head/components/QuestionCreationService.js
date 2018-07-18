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
 * @fileoverview Service to create the question.
 */

oppia.factory('QuestionCreationService', [
  '$http', '$q', 'UrlInterpolationService',
  function($http, $q, UrlInterpolationService) {
    var QUESTION_CREATOR_URL_TEMPLATE =
      '/topic_editor_question_handler/<topic_id>';

    var _createNew = function(
        topicId, successCallback, errorCallback) {
      var questionCreationurl = UrlInterpolationService.interpolateUrl(
        QUESTION_CREATOR_URL_TEMPLATE, {
          topic_id: topicId
        });

      $http.post(questionCreationurl).then(function(response) {
        var questionId = angular.copy(response.data.questionId);
        if (successCallback) {
          successCallback(questionId);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    return {
      createNew: function(topicId) {
        return $q(function(resolve, reject) {
          _createNew(topicId, resolve, reject);
        });
      }
    };
  }
]);
