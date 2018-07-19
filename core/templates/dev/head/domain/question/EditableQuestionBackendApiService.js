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
 * @fileoverview Service to send and receive changes to a question in the
 *  backend.
 */
oppia.constant(
  'EDITABLE_QUESTION_DATA_URL_TEMPLATE',
  '/question_editor_handler/data/<question_id>');

oppia.factory('EditableQuestionBackendApiService', [
  '$http', '$q', 'EDITABLE_QUESTION_DATA_URL_TEMPLATE',
  'UrlInterpolationService',
  function($http, $q, EDITABLE_QUESTION_DATA_URL_TEMPLATE,
      UrlInterpolationService) {
    var _fetchQuestion = function(questionId, successCallback, errorCallback) {
      var questionDataUrl = UrlInterpolationService.interpolateUrl(
        EDITABLE_QUESTION_DATA_URL_TEMPLATE, {
          question_id: questionId
        });

      $http.get(questionDataUrl).then(function(response) {
        var questionDict = angular.copy(response.data.question_dict);
        if (successCallback) {
          successCallback(questionDict);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _updateQuestion = function(
        questionId, questionVersion, commitMessage, changeList,
        successCallback, errorCallback) {
      var editableQuestionDataUrl = UrlInterpolationService.interpolateUrl(
        EDITABLE_QUESTION_DATA_URL_TEMPLATE, {
          question_id: questionId
        });

      var putData = {
        version: questionVersion,
        commit_message: commitMessage,
        change_dicts: changeList
      };
      $http.put(editableQuestionDataUrl, putData).then(function(response) {
        // The returned data is an updated question dict.
        var questionDict = angular.copy(response.data.question_dict);

        if (successCallback) {
          successCallback(questionDict);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    return {
      fetchQuestion: function(questionId) {
        return $q(function(resolve, reject) {
          _fetchQuestion(questionId, resolve, reject);
        });
      },

      /**
       * Updates a question in the backend with the provided question ID.
       * The changes only apply to the question of the given version and the
       * request to update the question will fail if the provided question
       * version is older than the current version stored in the backend. Both
       * the changes and the message to associate with those changes are used
       * to commit a change to the question. The new question is passed to
       * the success callback, if one is provided to the returned promise
       * object. Errors are passed to the error callback, if one is provided.
       */
      updateQuestion: function(
          questionId, questionVersion, commitMessage, changeList) {
        return $q(function(resolve, reject) {
          _updateQuestion(
            questionId, questionVersion, commitMessage, changeList,
            resolve, reject);
        });
      }
    };
  }
]);
