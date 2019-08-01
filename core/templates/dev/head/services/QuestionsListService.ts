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
 * @fileoverview Service to fetch questions and returns questions to the
 * questions list in editors.
 */

require('domain/question/QuestionBackendApiService.ts');
require('services/ContextService.ts');
require('services/services.constants.ts');

angular.module('oppia').factory('QuestionsListService', [
  '$rootScope', 'QuestionBackendApiService',
  'EVENT_QUESTION_SUMMARIES_INITIALIZED', function(
      $rootScope, QuestionBackendApiService,
      EVENT_QUESTION_SUMMARIES_INITIALIZED) {
    var _questionSummaries = [];
    var _nextCursorForQuestions = '';

    var _setQuestionSummaries = function(newQuestionSummaries) {
      if (_questionSummaries.length > 0) {
        newQuestionSummaries = _deduplicateQuestionSummaries(
          newQuestionSummaries);
      }
      _questionSummaries = _questionSummaries.concat(
        angular.copy(newQuestionSummaries));
      $rootScope.$broadcast(EVENT_QUESTION_SUMMARIES_INITIALIZED);
    };
    var _setNextQuestionsCursor = function(nextCursor) {
      _nextCursorForQuestions = nextCursor;
    };
    var _deduplicateQuestionSummaries = function(newQuestionSummaries) {
      // If the first id of newQuestionSummaries is equal to the last id of
      // _questionSummaries, deduplicate by merging them to solve the page
      // boundary issue.
      if (newQuestionSummaries[0].summary.id ===
          _questionSummaries.slice(-1)[0].summary.id) {
        _questionSummaries.slice(-1)[0].skill_descriptions =
          newQuestionSummaries[0].skill_descriptions.concat(
            _questionSummaries.slice(-1)[0].skill_descriptions
          );
        newQuestionSummaries = newQuestionSummaries.slice(1);
      }
      return newQuestionSummaries;
    };

    return {
      isLastQuestionBatch: function(index) {
        return (
          _nextCursorForQuestions === null &&
          (index + 1) * constants.NUM_QUESTIONS_PER_PAGE >=
            _questionSummaries.length);
      },

      getQuestionSummariesAsync: function(
          index, skillIds, fetchMore, resetHistory) {
        if (resetHistory) {
          _questionSummaries = [];
          _nextCursorForQuestions = '';
        }

        var num = constants.NUM_QUESTIONS_PER_PAGE;

        if (skillIds === undefined || skillIds.length === 0) {
          return [];
        }

        if ((index + 1) * num > _questionSummaries.length &&
            _nextCursorForQuestions !== null && fetchMore) {
          QuestionBackendApiService.fetchQuestionSummaries(
            skillIds, _nextCursorForQuestions).then(
            function(returnObject) {
              _setQuestionSummaries(returnObject.questionSummaries);
              _setNextQuestionsCursor(returnObject.nextCursor);
            }
          );
        }
        return _questionSummaries.slice(index * num, (index + 1) * num);
      },
    };
  }
]);
