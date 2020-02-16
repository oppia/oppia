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

require('domain/question/question-backend-api.service.ts');
require('domain/question/QuestionSummaryForOneSkillObjectFactory.ts');
require('services/context.service.ts');
require('services/services.constants.ajs.ts');

angular.module('oppia').factory('QuestionsListService', [
  '$filter', '$rootScope', 'QuestionBackendApiService',
  'QuestionSummaryForOneSkillObjectFactory',
  'EVENT_QUESTION_SUMMARIES_INITIALIZED', 'NUM_QUESTIONS_PER_PAGE', function(
      $filter, $rootScope, QuestionBackendApiService,
      QuestionSummaryForOneSkillObjectFactory,
      EVENT_QUESTION_SUMMARIES_INITIALIZED, NUM_QUESTIONS_PER_PAGE) {
    var _questionSummaries = [];
    var _questionSummariesForOneSkill = [];
    var _nextCursorForQuestions = '';
    var _currentPage = 0;

    var _setQuestionSummaries = function(newQuestionSummaries) {
      if (_questionSummaries.length > 0) {
        newQuestionSummaries = _deduplicateQuestionSummaries(
          newQuestionSummaries);
      }
      _questionSummaries = _questionSummaries.concat(
        angular.copy(newQuestionSummaries));
      $rootScope.$broadcast(EVENT_QUESTION_SUMMARIES_INITIALIZED);
    };

    var _setQuestionSummariesForOneSkill = function(newQuestionSummaries) {
      _questionSummariesForOneSkill = _questionSummariesForOneSkill.concat(
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
      isLastQuestionBatch: function() {
        return (
          _nextCursorForQuestions === null &&
          (_currentPage + 1) * NUM_QUESTIONS_PER_PAGE >=
            _questionSummariesForOneSkill.length);
      },

      getQuestionSummariesAsync: function(
          skillIds, fetchMore, resetHistory) {
        if (resetHistory) {
          _questionSummariesForOneSkill = [];
          _nextCursorForQuestions = '';
        }
        var num = NUM_QUESTIONS_PER_PAGE;

        if (skillIds === undefined || skillIds.length === 0) {
          return;
        }
        if ((_currentPage + 1) * num > _questionSummariesForOneSkill.length &&
            _nextCursorForQuestions !== null && fetchMore) {
          QuestionBackendApiService.fetchQuestionSummaries(
            skillIds, _nextCursorForQuestions).then(
            function(returnObject) {
              if (skillIds.length === 1) {
                var questionSummaries = returnObject.questionSummaries.map(
                  function(summary) {
                    return (
                      QuestionSummaryForOneSkillObjectFactory.
                        createFromBackendDict(summary));
                  });
                _setQuestionSummariesForOneSkill(questionSummaries);
              } else {
                _setQuestionSummaries(returnObject.questionSummaries);
              }
              _setNextQuestionsCursor(returnObject.nextCursor);
            }
          );
        }
      },

      getCachedQuestionSummaries: function() {
        var num = NUM_QUESTIONS_PER_PAGE;
        return _questionSummariesForOneSkill.slice(
          _currentPage * num, (_currentPage + 1) * num).map(
          function(question) {
            var summary = $filter(
              'formatRtePreview')(
              question.getQuestionSummary().getQuestionContent());
            question.getQuestionSummary().setQuestionContent(
              $filter('truncate')(summary, 100));
            return question;
          });
      },

      incrementPageNumber: function() {
        _currentPage++;
      },

      decrementPageNumber: function() {
        _currentPage--;
      },

      resetPageNumber: function() {
        _currentPage = 0;
      },

      getCurrentPageNumber: function() {
        return _currentPage;
      }
    };
  }
]);
