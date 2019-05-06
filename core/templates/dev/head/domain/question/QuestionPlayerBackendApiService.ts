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
 * @fileoverview Service to receive questions for practice given a set of
 * skill_ids.
 */
oppia.constant(
  'QUESTION_PLAYER_URL_TEMPLATE',
  '/question_player_handler?skill_ids=<skill_ids>&question_count' +
  '=<question_count>&start_cursor=<start_cursor>');

oppia.factory('QuestionPlayerBackendApiService', [
  '$http', '$q', 'UrlInterpolationService', 'QUESTION_PLAYER_URL_TEMPLATE',
  function($http, $q, UrlInterpolationService, QUESTION_PLAYER_URL_TEMPLATE) {
    var _startCursor = '';
    var _fetchQuestions = function(
        skillIds, questionCount, resetHistory, successCallback, errorCallback) {
      if (!validateRequestParameters(skillIds, questionCount, errorCallback)) {
        return;
      }
      if (resetHistory) {
        _startCursor = '';
      }
      var questionDataUrl = UrlInterpolationService.interpolateUrl(
        QUESTION_PLAYER_URL_TEMPLATE, {
          skill_ids: skillIds.join(','),
          question_count: questionCount.toString(),
          start_cursor: _startCursor
        });

      $http.get(questionDataUrl).then(function(response) {
        var questionDicts = angular.copy(response.data.question_dicts);
        _startCursor = response.data.next_start_cursor;
        if (successCallback) {
          successCallback(questionDicts);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    /**
     * Does basic validation on input.
     */
    var validateRequestParameters = function(
        skillIds, questionCount, errorCallback) {
      if (!isListOfStrings(skillIds)) {
        errorCallback('Skill ids should be a list of strings');
        return false;
      }

      if (!isInt(questionCount) || questionCount <= 0) {
        errorCallback('Question count has to be a positive integer');
        return false;
      }

      return true;
    };

    /**
     * Checks if given input is a list and has all strings
     */
    var isListOfStrings = function(list) {
      if (!angular.isArray(list)) {
        return false;
      }
      return list.every(function(obj) {
        return angular.isString(obj);
      });
    };

    /**
     * Checks if given input is an integer
     */
    var isInt = function(n) {
      return angular.isNumber(n) && n % 1 === 0;
    };

    /**
     * Returns a list of questions based on the list of skill ids and number
     * of questions requested.
     */
    return {
      fetchQuestions: function(skillIds, questionCount, resetHistory) {
        return $q(function(resolve, reject) {
          _fetchQuestions(
            skillIds, questionCount, resetHistory, resolve, reject);
        });
      }
    };
  }
]);
